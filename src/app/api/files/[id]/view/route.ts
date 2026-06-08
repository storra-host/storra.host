import { getSupabase } from "@/lib/supabase";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const ip = getClientKey(request);
  const rl = await checkRateLimit("fileRead", ip);
  if (!rl.allowed) {
    return jsonError(429, "rate_limited", "Too many requests");
  }

  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from("files")
    .select("id, view_count, upload_complete, expires_at, deleted_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !row || !row.upload_complete) {
    return jsonError(404, "not_found", "File not found");
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return jsonError(404, "not_found", "File not found");
  }

  const current = row.view_count ?? 0;
  const { data: updated, error: upErr } = await supabase
    .from("files")
    .update({ view_count: current + 1 })
    .eq("id", id)
    .eq("view_count", current)
    .select("view_count")
    .single();

  if (upErr || !updated) {
    return jsonError(409, "concurrent", "Please retry");
  }

  return NextResponse.json({ viewCount: updated.view_count });
}
