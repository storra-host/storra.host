import { getPublicAppUrl } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const ip = getClientKey(request);
  const rl = await checkRateLimit("fileRead", ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      { status: 429 }
    );
  }
  const { id } = await ctx.params;
  const base = getPublicAppUrl(request);
  return NextResponse.json({
    message:
      "GET the same path for the decrypted file (download limits and counts apply on that request).",
    downloadUrl: `${base}/api/files/${id}`,
    metaUrl: `${base}/api/files/${id}?meta=1`,
  });
}
