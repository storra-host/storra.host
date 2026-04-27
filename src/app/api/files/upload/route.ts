import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Multipart upload to this URL is no longer supported (Vercel 4.5 MB body limit).
 * The app uses prepare → direct PUT to R2 → complete.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: "use_direct_upload",
        message:
          "Upload via POST multipart to this path is disabled. Use POST /api/files/upload/prepare, PUT to the returned URL, then POST /api/files/upload/complete.",
      },
    },
    { status: 410 }
  );
}
