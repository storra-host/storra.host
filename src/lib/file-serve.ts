import { getSupabase } from "@/lib/supabase";
import { getObjectBuffer } from "@/lib/r2";
import { getEnv } from "@/lib/env";
import { verifyFilePassword } from "@/lib/file-password";
import { AUTH_TAG_LENGTH, decryptBuffer, getFileDecryptionKey } from "@/lib/server-crypto";
import { NextResponse } from "next/server";

export type FileRow = {
  id: string;
  storage_key: string;
  size: string | number;
  mime_type: string | null;
  iv: string;
  filename: string | null;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  upload_complete: boolean;
  password_key_wrap: string | null;
  wrapped_file_key: string | null;
  encryption_mode: "legacy_server" | "e2ee_client";
  transcoded_storage_key: string | null;
  transcode_status: string;
  playback_mime_type: string | null;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

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

export function buildContentDisposition(
  row: Pick<FileRow, "filename">,
  inline: boolean
) {
  const fromFilename = fileNameForDisposition(row.filename);
  const fn = fromFilename.ascii;
  const type = inline ? "inline" : "attachment";
  if (fromFilename.star) {
    return `${type}; filename="${fn.replace(/"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fromFilename.star)}`;
  }
  return `${type}; filename="${fn.replace(/"/g, "_")}"`;
}

function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | "invalid" | null {
  if (!header?.startsWith("bytes=")) return null;
  const spec = header.slice(6).trim();
  const dash = spec.indexOf("-");
  if (dash < 0) return "invalid";
  const startStr = spec.slice(0, dash).trim();
  const endStr = spec.slice(dash + 1).trim();
  let start = startStr === "" ? NaN : Number.parseInt(startStr, 10);
  let end = endStr === "" ? NaN : Number.parseInt(endStr, 10);
  if (startStr === "" && Number.isFinite(end)) {
    const suffix = end;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else if (Number.isFinite(start) && endStr === "") {
    end = size - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "invalid";
  if (start < 0 || end < start || start >= size) return "invalid";
  end = Math.min(end, size - 1);
  return { start, end };
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, X-Access-Password, Content-Type",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Accept-Ranges, Content-Type",
  };
}

function withCors(response: NextResponse, enable: boolean): NextResponse {
  if (!enable) return response;
  const h = corsHeaders();
  for (const [k, v] of Object.entries(h)) {
    response.headers.set(k, v);
  }
  return response;
}

export type ServeFileOptions = {
  preview?: boolean;
  inline?: boolean;
  cors?: boolean;
  preferTranscoded?: boolean;
};

export async function serveFileById(
  request: Request,
  id: string,
  options: ServeFileOptions = {}
): Promise<Response> {
  const preview = options.preview === true;
  const inline = options.inline === true;
  const cors = options.cors === true;
  const preferTranscoded = options.preferTranscoded !== false;

  if (request.method === "OPTIONS" && cors) {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }

  const supabase = getSupabase();
  const { data: f, error: fetchErr } = await supabase
    .from("files")
    .select(
      "id, storage_key, iv, filename, size, mime_type, expires_at, max_downloads, download_count, upload_complete, password_key_wrap, wrapped_file_key, encryption_mode, transcoded_storage_key, transcode_status, playback_mime_type"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !f) {
    return withCors(jsonError(404, "not_found", "File not found or unavailable"), cors);
  }

  const file = f as FileRow;
  if (!file.upload_complete) {
    return withCors(jsonError(404, "not_found", "File not found or unavailable"), cors);
  }

  const now = new Date();
  if (file.expires_at && new Date(file.expires_at) < now) {
    return withCors(jsonError(404, "not_found", "File not found or unavailable"), cors);
  }

  if (!preview && file.max_downloads != null && file.download_count >= file.max_downloads) {
    return withCors(jsonError(404, "not_found", "File not found or unavailable"), cors);
  }

  if (file.password_key_wrap) {
    const provided = request.headers.get("x-access-password")?.trim() ?? "";
    if (!provided) {
      return withCors(jsonError(401, "unauthorized", "Access denied"), cors);
    }
    if (!verifyFilePassword(provided, file.password_key_wrap)) {
      return withCors(jsonError(401, "unauthorized", "Access denied"), cors);
    }
  }

  let after = file;
  if (!preview) {
    const { data: updated, error: upErr } = await supabase
      .from("files")
      .update({ download_count: file.download_count + 1 })
      .eq("id", id)
      .eq("download_count", file.download_count)
      .select(
        "download_count, storage_key, iv, filename, size, mime_type, wrapped_file_key, encryption_mode, transcoded_storage_key, transcode_status, playback_mime_type"
      )
      .single();

    if (upErr || !updated) {
      return withCors(jsonError(409, "concurrent", "Please retry"), cors);
    }
    if (file.max_downloads != null && updated.download_count > file.max_downloads) {
      await supabase
        .from("files")
        .update({ download_count: file.download_count })
        .eq("id", id);
      return withCors(jsonError(404, "not_found", "File not found or unavailable"), cors);
    }
    after = { ...file, ...updated } as FileRow;
  }

  const mode = after.encryption_mode ?? "legacy_server";
  if (mode === "e2ee_client") {
    const maxEnc = getEnv().MAX_FILE_SIZE_BYTES + AUTH_TAG_LENGTH + 64;
    let encrypted: Buffer;
    try {
      encrypted = await getObjectBuffer(after.storage_key, maxEnc);
    } catch {
      if (!preview) {
        await supabase
          .from("files")
          .update({ download_count: file.download_count })
          .eq("id", id);
      }
      return withCors(jsonError(500, "storage", "R2 read failed"), cors);
    }

    const res = new NextResponse(new Uint8Array(encrypted), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(encrypted.length),
        "Content-Disposition": buildContentDisposition(after, inline),
        "Cache-Control": preview ? "private, max-age=3600" : "no-store",
        "X-Encryption-Mode": "e2ee_client",
        "Accept-Ranges": "none",
      },
    });
    return withCors(res, cors);
  }

  const useTranscoded =
    preferTranscoded &&
    after.transcode_status === "ready" &&
    Boolean(after.transcoded_storage_key);

  const storageKey = useTranscoded
    ? after.transcoded_storage_key!
    : after.storage_key;

  const maxEnc = getEnv().MAX_FILE_SIZE_BYTES + AUTH_TAG_LENGTH + 64;
  let encrypted: Buffer;
  try {
    encrypted = await getObjectBuffer(storageKey, maxEnc);
  } catch {
    if (!preview) {
      await supabase
        .from("files")
        .update({ download_count: file.download_count })
        .eq("id", id);
    }
    return withCors(jsonError(500, "storage", "R2 read failed"), cors);
  }

  let plain: Buffer;
  if (useTranscoded) {
    plain = encrypted;
  } else {
    const dataKey = getFileDecryptionKey(after.wrapped_file_key);
    try {
      plain = decryptBuffer(encrypted, after.iv, dataKey);
    } catch {
      if (!preview) {
        await supabase
          .from("files")
          .update({ download_count: file.download_count })
          .eq("id", id);
      }
      return withCors(jsonError(500, "decrypt", "Could not decrypt file"), cors);
    }
    if (Number(after.size) !== plain.length) {
      if (!preview) {
        await supabase
          .from("files")
          .update({ download_count: file.download_count })
          .eq("id", id);
      }
      return withCors(jsonError(500, "integrity", "Size mismatch"), cors);
    }
  }

  const mime = useTranscoded
    ? after.playback_mime_type || "video/mp4"
    : after.mime_type || "application/octet-stream";

  const range = parseRange(request.headers.get("range"), plain.length);
  if (range === "invalid") {
    return withCors(
      new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${plain.length}`,
          ...Object.fromEntries(
            cors ? Object.entries(corsHeaders()) : []
          ),
        },
      }),
      cors
    );
  }

  if (range) {
    const slice = plain.subarray(range.start, range.end + 1);
    const res = new NextResponse(new Uint8Array(slice), {
      status: 206,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(slice.length),
        "Content-Range": `bytes ${range.start}-${range.end}/${plain.length}`,
        "Accept-Ranges": "bytes",
        "Content-Disposition": buildContentDisposition(after, inline),
        "Cache-Control": preview ? "private, max-age=3600" : "no-store",
        "X-Encryption-Mode": "legacy_server",
      },
    });
    return withCors(res, cors);
  }

  const res = new NextResponse(new Uint8Array(plain), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(plain.length),
      "Accept-Ranges": "bytes",
      "Content-Disposition": buildContentDisposition(after, inline),
      "Cache-Control": preview ? "private, max-age=3600" : "no-store",
      "X-Encryption-Mode": "legacy_server",
    },
  });
  return withCors(res, cors);
}
