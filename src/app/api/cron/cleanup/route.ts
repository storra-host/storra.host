import { getSupabase } from "@/lib/supabase";
import { getEnv } from "@/lib/env";
import { deleteObject } from "@/lib/r2";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorizeCron(request: Request): { ok: true } | { ok: false; body: string; status: number } {
  const { CRON_SECRET, ALLOW_INSECURE_LOCAL_CRON } = getEnv();
  const isDev = process.env.NODE_ENV === "development";
  if (!CRON_SECRET) {
    if (isDev && ALLOW_INSECURE_LOCAL_CRON) {
      return { ok: true };
    }
    return { ok: false, status: 503, body: "Set CRON_SECRET to enable cleanup" };
  }
  if (!isDev && request.headers.get("x-forwarded-proto") === "http") {
    return { ok: false, status: 400, body: "HTTPS required" };
  }
  const h = request.headers.get("authorization");
  if (h !== `Bearer ${CRON_SECRET}`) {
    return { ok: false, status: 401, body: "Unauthorized" };
  }
  return { ok: true };
}

export async function GET() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function POST(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) {
    return new NextResponse(auth.body, { status: auth.status });
  }
  return runCleanup();
}

const ABANDONED_MS = 24 * 60 * 60 * 1000;

async function runCleanup() {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const abandonedBefore = new Date(Date.now() - ABANDONED_MS).toISOString();
  const { data: stuck, error: stuckErr } = await supabase
    .from("files")
    .select("id, storage_key")
    .is("deleted_at", null)
    .eq("upload_complete", false)
    .lt("created_at", abandonedBefore)
    .limit(100);
  if (!stuckErr && stuck) {
    for (const r of stuck) {
      try {
        await deleteObject(r.storage_key);
      } catch {
      }
      await supabase.from("files").delete().eq("id", r.id);
    }
  }
  const { data: batch, error: qErr } = await supabase
    .from("files")
    .select("id, storage_key")
    .is("deleted_at", null)
    .eq("upload_complete", true)
    .not("expires_at", "is", null)
    .lt("expires_at", now)
    .order("expires_at", { ascending: true })
    .limit(200);

  if (qErr || !batch) {
    return NextResponse.json(
      { error: { code: "db", message: "Could not list expired files" } },
      { status: 500 }
    );
  }

  let softDeleted = 0;
  let r2Failed = 0;
  for (const row of batch) {
    try {
      try {
        await deleteObject(row.storage_key);
      } catch {
        r2Failed += 1;
        continue;
      }
      const { error: uErr } = await supabase
        .from("files")
        .update({ deleted_at: now })
        .eq("id", row.id);
      if (uErr) {
        continue;
      }
      softDeleted += 1;
    } catch {
    }
  }
  return NextResponse.json({
    ok: true,
    expiredFound: batch.length,
    metadataMarkedDeleted: softDeleted,
    r2DeleteFailures: r2Failed,
  });
}
