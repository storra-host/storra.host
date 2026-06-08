import type { PublicFileMeta } from "@/lib/file-public-meta";
import type { TranscodeStatus } from "@/lib/video";

export function isVideoPlaybackReady(meta: PublicFileMeta): boolean {
  if (!meta.isVideo) return true;
  if (meta.encryptionMode === "e2ee_client") return true;
  if (meta.transcodeStatus === "pending") return false;
  if (meta.transcodeStatus === "none") return false;
  if (meta.transcodeStatus === "ready" || meta.transcodeStatus === "skipped") {
    return true;
  }
  return meta.embedSupported;
}

export async function pollVideoPlaybackReady(
  fileId: string,
  opts?: {
    intervalMs?: number;
    timeoutMs?: number;
    onStatus?: (status: TranscodeStatus) => void;
  }
): Promise<{ ok: boolean; meta: PublicFileMeta | null }> {
  const intervalMs = opts?.intervalMs ?? 2000;
  const timeoutMs = opts?.timeoutMs ?? 600_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const r = await fetch(`/api/files/${fileId}?meta=1`);
    if (!r.ok) return { ok: false, meta: null };
    const meta = (await r.json()) as PublicFileMeta;
    opts?.onStatus?.(meta.transcodeStatus);
    if (isVideoPlaybackReady(meta)) return { ok: true, meta };
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { ok: false, meta: null };
}
