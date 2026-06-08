import { getSupabase } from "@/lib/supabase";
import { toPublicFileMeta } from "@/lib/file-public-meta";
import { serveFileById } from "@/lib/file-serve";
import { isEmbedCrawler } from "@/lib/embed-crawler";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function unavailableError() {
  return jsonError(404, "not_found", "File not found or unavailable");
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
      "id, size, mime_type, filename, iv, expires_at, max_downloads, download_count, view_count, upload_complete, password_key_wrap, encryption_mode, transcode_status, playback_mime_type, poster_storage_key, created_at"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !file) {
    return unavailableError();
  }
  if (!file.upload_complete) {
    return unavailableError();
  }
  const t = new Date();
  if (file.expires_at && new Date(file.expires_at) < t) {
    return unavailableError();
  }
  return NextResponse.json(toPublicFileMeta(file));
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

  const preview = u.searchParams.get("preview") === "1";

  if (!isEmbedCrawler(request) || !preview) {
    const ip = getClientKey(request);
    const rl = await checkRateLimit("fileRead", ip);
    if (!rl.allowed) {
      return jsonError(429, "rate_limited", "Too many requests");
    }
  }
  const inline = u.searchParams.get("inline") === "1" || preview;
  const cors = u.searchParams.get("cors") === "1" || preview;

  return serveFileById(request, id, {
    preview,
    inline,
    cors,
    preferTranscoded: u.searchParams.get("original") !== "1",
  });
}

export async function OPTIONS(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  return serveFileById(request, id, { preview: true, cors: true });
}
