import { getSupabase } from "@/lib/supabase";
import { presignedPutObjectUrl } from "@/lib/r2";
import { uploadMetadataSchema } from "@/lib/validation";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { sanitizeOriginalFilename } from "@/lib/filename-sanitize";
import { hashFilePassword } from "@/lib/file-password";
import { ivToRecord, randomIvBuffer, wrapDataKey } from "@/lib/server-crypto";
import { issueFinalizeToken } from "@/lib/upload-finalize-token";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const ip = getClientKey(request);
  const rl = await checkRateLimit("upload", ip);
  if (!rl.allowed) {
    return jsonError(429, "rate_limited", "Too many requests");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "bad_request", "Expected JSON body");
  }
  if (!body || typeof body !== "object" || !("metadata" in body)) {
    return jsonError(400, "bad_request", "metadata (JSON string) required");
  }
  const rawMeta = (body as { metadata: unknown }).metadata;
  if (typeof rawMeta !== "string") {
    return jsonError(400, "bad_request", "metadata must be a JSON string");
  }

  let meta: unknown;
  try {
    meta = JSON.parse(rawMeta);
  } catch {
    return jsonError(400, "bad_request", "metadata must be valid JSON");
  }
  const parsed = uploadMetadataSchema.safeParse(meta);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.issues[0]?.message ?? "Invalid metadata");
  }
  const m = parsed.data;

  const fileId = nanoid(24);
  const storageKey = `obj/${fileId}`;
  const encryptionMode = m.encryptionMode ?? "e2ee_client";
  const isE2EE = encryptionMode === "e2ee_client";

  let ivRecord: string;
  let wrappedFileKey: string | null;
  let dataKey: Buffer | null = null;
  if (isE2EE) {
    if (!m.iv) {
      return jsonError(400, "validation", "iv is required for e2ee_client uploads");
    }
    ivRecord = m.iv;
    wrappedFileKey = null;
  } else {
    dataKey = randomBytes(32);
    const fileIv = randomIvBuffer();
    ivRecord = ivToRecord(fileIv);
    wrappedFileKey = wrapDataKey(dataKey);
  }

  const displayName = sanitizeOriginalFilename(
    m.originalName ?? "upload",
    "upload"
  );

  let passwordKeyWrap: string | null = null;
  if (m.accessPassword) {
    try {
      passwordKeyWrap = await hashFilePassword(m.accessPassword);
    } catch {
      return jsonError(500, "password", "Could not set access password");
    }
  }

  const supabase = getSupabase();
  const resolvedMimeType =
    m.mimeType != null && m.mimeType !== "" ? m.mimeType : null;

  const { error: insertErr } = await supabase.from("files").insert({
    id: fileId,
    storage_key: storageKey,
    size: 0,
    mime_type: resolvedMimeType,
    iv: ivRecord,
    filename: displayName,
    encrypted_name: null,
    name_iv: null,
    expires_at: m.expiresAt ?? null,
    max_downloads: m.maxDownloads ?? null,
    upload_complete: false,
    password_salt: null,
    password_key_wrap: passwordKeyWrap,
    wrapped_file_key: wrappedFileKey,
    encryption_mode: encryptionMode,
  });
  if (insertErr) {
    return jsonError(500, "db", "Could not create upload");
  }

  let putUrl: string;
  try {
    putUrl = await presignedPutObjectUrl(storageKey);
  } catch {
    await supabase.from("files").delete().eq("id", fileId);
    return jsonError(500, "storage", "Could not prepare object storage");
  }

  const base = {
    fileId,
    finalizeToken: issueFinalizeToken(fileId, storageKey),
    encryptionMode,
    iv: ivRecord,
    put: {
      method: "PUT" as const,
      url: putUrl,
    },
  };
  if (!isE2EE && dataKey) {
    return NextResponse.json({
      ...base,
      dataKey: dataKey.toString("base64url"),
    });
  }
  return NextResponse.json(base);
}
