import { getSupabase } from "@/lib/supabase";
import { getObjectBuffer } from "@/lib/r2";
import { getEnv } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { verifyFilePassword } from "@/lib/file-password";
import { AUTH_TAG_LENGTH, decryptBuffer, getFileDecryptionKey } from "@/lib/server-crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function unavailableError() {
  return jsonError(404, "not_found", "File not found or unavailable");
}

type FileRow = {
  id: string;
  storage_key: string;
  size: string | number;
  mime_type: string | null;
  iv: string;
  filename: string | null;
  encrypted_name: string | null;
  name_iv: string | null;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  upload_complete: boolean;
  password_salt: string | null;
  password_key_wrap: string | null;
  wrapped_file_key: string | null;
  encryption_mode: "legacy_server" | "e2ee_client";
};

function fileNameForDisposition(
  name: string | null | undefined
): { ascii: string; star?: string } {
  const n = (name?.trim() || "download").replace(/[/\\?%*:|"<>]/g, "_");
  if (!/[^\u0000-\u007f]/.test(n)) {
    return { ascii: n.slice(0, 200) };
  }
  return {
    ascii: "download",
    star: n.slice(0, 200),
  };
}

function buildContentDisposition(row: FileRow) {
  const fromFilename = fileNameForDisposition(row.filename);
  const fn = fromFilename.ascii;
  if (fromFilename.star) {
    return `attachment; filename="${fn.replace(/"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fromFilename.star)}`;
  }
  return `attachment; filename="${fn.replace(/"/g, "_")}"`;
}

async function getMetadataResponse(request: Request, id: string) {
  const ip = getClientKey(request);
  const rl = await checkRateLimit("fileRead", ip);
  if (!rl.allowed) {
    return jsonError(429, "rate_limited", "Too many requests");
  }
  const supabase = getSupabase();
  const { data: file, error } = await supabase
    .from("files")
    .select(
      "id, size, mime_type, filename, iv, expires_at, max_downloads, download_count, upload_complete, password_key_wrap, encryption_mode"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !file) {
    return unavailableError();
  }
  const row = file as Pick<
    FileRow,
    | "id"
    | "size"
    | "mime_type"
    | "iv"
    | "filename"
    | "expires_at"
    | "max_downloads"
    | "download_count"
    | "upload_complete"
    | "password_key_wrap"
  >;
  if (!row.upload_complete) {
    return unavailableError();
  }
  const t = new Date();
  if (row.expires_at && new Date(row.expires_at) < t) {
    return unavailableError();
  }
  const requiresPassword = Boolean(row.password_key_wrap);
  return NextResponse.json({
    id: row.id,
    size: String(row.size),
    filename: row.filename,
    mimeType: row.mime_type,
    iv: row.iv,
    expiresAt: row.expires_at,
    maxDownloads: row.max_downloads,
    downloadCount: row.download_count,
    requiresPassword,
    encryptionMode: (file as { encryption_mode?: "legacy_server" | "e2ee_client" })
      .encryption_mode ?? "legacy_server",
  });
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const u = new URL(request.url);
  if (u.searchParams.get("meta") === "1") {
    return getMetadataResponse(request, id);
  }
  const ip = getClientKey(request);
  const rl = await checkRateLimit("fileRead", ip);
  if (!rl.allowed) {
    return jsonError(429, "rate_limited", "Too many requests");
  }
  const supabase = getSupabase();
  const { data: f, error: fetchErr } = await supabase
    .from("files")
    .select(
      "id, storage_key, iv, filename, size, mime_type, expires_at, max_downloads, download_count, upload_complete, password_key_wrap, wrapped_file_key"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (fetchErr || !f) {
    return unavailableError();
  }
  const file = f as FileRow;
  if (!file.upload_complete) {
    return unavailableError();
  }
  const now = new Date();
  if (file.expires_at && new Date(file.expires_at) < now) {
    return unavailableError();
  }
  if (file.max_downloads != null && file.download_count >= file.max_downloads) {
    return unavailableError();
  }

  if (file.password_key_wrap) {
    const provided = request.headers.get("x-access-password")?.trim() ?? "";
    if (!provided) {
      return jsonError(401, "unauthorized", "Access denied");
    }
    if (!verifyFilePassword(provided, file.password_key_wrap)) {
      return jsonError(401, "unauthorized", "Access denied");
    }
  }

  const { data: after, error: upErr } = await supabase
    .from("files")
    .update({ download_count: file.download_count + 1 })
    .eq("id", id)
    .eq("download_count", file.download_count)
    .select(
      "download_count, storage_key, iv, filename, size, mime_type, wrapped_file_key, encryption_mode"
    )
    .single();

  if (upErr || !after) {
    return jsonError(409, "concurrent", "Please retry");
  }
  if (file.max_downloads != null && after.download_count > file.max_downloads) {
    await supabase
      .from("files")
      .update({ download_count: file.download_count })
      .eq("id", id);
    return unavailableError();
  }

  const maxEnc = getEnv().MAX_FILE_SIZE_BYTES + AUTH_TAG_LENGTH + 64;
  let encrypted: Buffer;
  try {
    encrypted = await getObjectBuffer(after.storage_key, maxEnc);
  } catch {
    try {
      await supabase
        .from("files")
        .update({ download_count: file.download_count })
        .eq("id", id);
    } catch {
    }
    return jsonError(500, "storage", "R2 read failed");
  }

  const mode =
    (
      after as {
        encryption_mode?: "legacy_server" | "e2ee_client";
      }
    ).encryption_mode ?? "legacy_server";
  if (mode === "e2ee_client") {
    return new NextResponse(new Uint8Array(encrypted), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(encrypted.length),
        "Content-Disposition": buildContentDisposition(after as FileRow),
        "Cache-Control": "no-store",
        "X-Encryption-Mode": "e2ee_client",
      },
    });
  }

  const dataKey = getFileDecryptionKey(after.wrapped_file_key);
  let plain: Buffer;
  try {
    plain = decryptBuffer(encrypted, after.iv, dataKey);
  } catch {
    try {
      await supabase
        .from("files")
        .update({ download_count: file.download_count })
        .eq("id", id);
    } catch {
    }
    return jsonError(500, "decrypt", "Could not decrypt file");
  }

  if (Number(after.size) !== plain.length) {
    try {
      await supabase
        .from("files")
        .update({ download_count: file.download_count })
        .eq("id", id);
    } catch {
    }
    return jsonError(500, "integrity", "Size mismatch");
  }

  const mime = after.mime_type || "application/octet-stream";
  return new NextResponse(new Uint8Array(plain), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(plain.length),
      "Content-Disposition": buildContentDisposition(after as FileRow),
      "Cache-Control": "no-store",
      "X-Encryption-Mode": "legacy_server",
    },
  });
}
