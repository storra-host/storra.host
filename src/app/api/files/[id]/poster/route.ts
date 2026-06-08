import { getSupabase } from "@/lib/supabase";
import { getObjectBuffer } from "@/lib/r2";
import { isEmbedCrawler } from "@/lib/embed-crawler";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { canDiscordVideoEmbed } from "@/lib/video-embed";
import { toPublicFileMeta } from "@/lib/file-public-meta";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  if (!isEmbedCrawler(request)) {
    const ip = getClientKey(request);
    const rl = await checkRateLimit("fileRead", ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests" } },
        { status: 429 }
      );
    }
  }

  const supabase = getSupabase();
  const { data: file, error } = await supabase
    .from("files")
    .select(
      "id, size, mime_type, filename, iv, expires_at, max_downloads, download_count, view_count, upload_complete, password_key_wrap, encryption_mode, transcode_status, playback_mime_type, poster_storage_key"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !file || !file.upload_complete) {
    return new NextResponse(null, { status: 404 });
  }
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return new NextResponse(null, { status: 404 });
  }

  const meta = toPublicFileMeta(file);
  if (!canDiscordVideoEmbed(meta) || !file.poster_storage_key) {
    return new NextResponse(null, { status: 404 });
  }

  let poster: Buffer;
  try {
    poster = await getObjectBuffer(file.poster_storage_key, 8 * 1024 * 1024);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(poster), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(poster.length),
      "Cache-Control": "public, max-age=86400, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
