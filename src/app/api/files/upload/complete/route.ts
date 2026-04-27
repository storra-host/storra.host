import { getSupabase } from "@/lib/supabase";
import { getEnv } from "@/lib/env";
import { deleteObject, headObjectContentLength } from "@/lib/r2";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { AUTH_TAG_LENGTH } from "@/lib/server-crypto";
import { verifyFinalizeToken } from "@/lib/upload-finalize-token";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

const bodySchema = z.object({
  fileId: z.string().regex(/^[A-Za-z0-9_-]{10,64}$/),
  finalizeToken: z.string().min(20),
});

export async function POST(request: Request) {
  const ip = getClientKey(request);
  const rl = await checkRateLimit("upload", ip);
  if (!rl.allowed) {
    return jsonError(429, "rate_limited", "Too many requests");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "bad_request", "Expected JSON");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "bad_request", "fileId and finalizeToken required");
  }
  const { fileId, finalizeToken } = parsed.data;
  const tokenPayload = verifyFinalizeToken(finalizeToken);
  if (!tokenPayload || tokenPayload.fileId !== fileId) {
    return jsonError(401, "unauthorized", "Invalid finalize token");
  }

  const supabase = getSupabase();
  const { data: row, error: fetchErr } = await supabase
    .from("files")
    .select("id, storage_key, iv, upload_complete, wrapped_file_key, mime_type")
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return jsonError(404, "not_found", "Upload not found");
  }
  if (tokenPayload.storageKey !== row.storage_key) {
    return jsonError(401, "unauthorized", "Invalid finalize token");
  }
  if (row.upload_complete) {
    return jsonError(409, "complete", "Upload already complete");
  }

  const maxPlain = getEnv().MAX_FILE_SIZE_BYTES;
  let encLength: number;
  try {
    const len = await headObjectContentLength(row.storage_key);
    if (len == null || len < 1) {
      throw new Error("missing length");
    }
    encLength = len;
  } catch {
    return jsonError(400, "not_uploaded", "Object not in storage. Retry upload to R2.");
  }

  const plainSize = encLength - AUTH_TAG_LENGTH;
  if (plainSize < 1) {
    return jsonError(400, "bad_size", "Stored object too small");
  }
  if (plainSize > maxPlain) {
    try {
      await deleteObject(row.storage_key);
    } catch {
    }
    await supabase.from("files").delete().eq("id", fileId);
    return jsonError(413, "too_large", "File exceeds max size");
  }

  if (encLength > maxPlain + AUTH_TAG_LENGTH + 1_048_576) {
    return jsonError(500, "integrity", "Unexpected object size");
  }

  const { error: updateErr } = await supabase
    .from("files")
    .update({ size: plainSize, upload_complete: true })
    .eq("id", fileId)
    .eq("upload_complete", false);

  if (updateErr) {
    return jsonError(500, "db", "Could not finalize upload");
  }

  return NextResponse.json({ fileId });
}
