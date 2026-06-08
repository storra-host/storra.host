import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { getSupabase } from "@/lib/supabase";
import { decryptBuffer, getFileDecryptionKey } from "@/lib/server-crypto";
import { getObjectBuffer, putObjectBuffer } from "@/lib/r2";
import { getEnv } from "@/lib/env";
import { AUTH_TAG_LENGTH } from "@/lib/server-crypto";
import { type TranscodeStatus } from "@/lib/video";

const execFileAsync = promisify(execFile);

/** Opt-out via ENABLE_VIDEO_TRANSCODE=0; enabled by default for legacy uploads. */
function transcodeEnabled(): boolean {
  return process.env.ENABLE_VIDEO_TRANSCODE !== "0";
}

async function ffmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * H.264/AAC MP4 transcode for legacy_server video uploads. Applies faststart,
 * yuv420p, and a 1080p cap so links stream immediately in the browser.
 * Requires ffmpeg on PATH. Disable with ENABLE_VIDEO_TRANSCODE=0.
 */
export async function runVideoTranscodeIfNeeded(fileId: string): Promise<void> {
  if (!transcodeEnabled()) {
    const supabase = getSupabase();
    await supabase
      .from("files")
      .update({ transcode_status: "skipped" satisfies TranscodeStatus })
      .eq("id", fileId);
    return;
  }

  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from("files")
    .select(
      "id, storage_key, iv, filename, mime_type, upload_complete, wrapped_file_key, encryption_mode, transcode_status"
    )
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !row || !row.upload_complete) return;
  if (row.encryption_mode === "e2ee_client") {
    await supabase
      .from("files")
      .update({ transcode_status: "skipped" satisfies TranscodeStatus })
      .eq("id", fileId);
    return;
  }

  if (row.transcode_status === "ready" || row.transcode_status === "pending") {
    return;
  }

  const hasFfmpeg = await ffmpegAvailable();
  if (!hasFfmpeg) {
    await supabase
      .from("files")
      .update({ transcode_status: "failed" satisfies TranscodeStatus })
      .eq("id", fileId);
    return;
  }

  await supabase
    .from("files")
    .update({ transcode_status: "pending" satisfies TranscodeStatus })
    .eq("id", fileId);

  const maxEnc = getEnv().MAX_FILE_SIZE_BYTES + AUTH_TAG_LENGTH + 64;
  let encrypted: Buffer;
  try {
    encrypted = await getObjectBuffer(row.storage_key, maxEnc);
  } catch {
    await supabase
      .from("files")
      .update({ transcode_status: "failed" satisfies TranscodeStatus })
      .eq("id", fileId);
    return;
  }

  let plain: Buffer;
  try {
    const dataKey = getFileDecryptionKey(row.wrapped_file_key);
    plain = decryptBuffer(encrypted, row.iv, dataKey);
  } catch {
    await supabase
      .from("files")
      .update({ transcode_status: "failed" satisfies TranscodeStatus })
      .eq("id", fileId);
    return;
  }

  const work = await mkdtemp(join(tmpdir(), "storra-vid-"));
  const inputPath = join(work, "input.bin");
  const outputPath = join(work, "playback.mp4");
  const posterPath = join(work, "poster.jpg");
  const transcodedKey = `obj/${fileId}/playback.mp4`;
  const posterKey = `obj/${fileId}/poster.jpg`;

  try {
    await writeFile(inputPath, plain);
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale='min(1920,iw)':-2",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        "-f",
        "mp4",
        outputPath,
      ],
      { timeout: 600_000, maxBuffer: 10 * 1024 * 1024 }
    );
    const out = await readFile(outputPath);
    if (out.length < 1) throw new Error("empty transcode output");
    await putObjectBuffer(transcodedKey, out);

    let savedPosterKey: string | null = null;
    try {
      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-i",
          outputPath,
          "-ss",
          "00:00:00.500",
          "-vframes",
          "1",
          "-q:v",
          "2",
          posterPath,
        ],
        { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 }
      );
      const poster = await readFile(posterPath);
      if (poster.length > 0) {
        await putObjectBuffer(posterKey, poster, "image/jpeg");
        savedPosterKey = posterKey;
      }
    } catch {
      /* poster is optional */
    }

    await supabase
      .from("files")
      .update({
        transcoded_storage_key: transcodedKey,
        playback_mime_type: "video/mp4",
        transcode_status: "ready" satisfies TranscodeStatus,
        poster_storage_key: savedPosterKey,
      })
      .eq("id", fileId);
  } catch {
    await supabase
      .from("files")
      .update({ transcode_status: "failed" satisfies TranscodeStatus })
      .eq("id", fileId);
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }
}

export function scheduleVideoTranscode(fileId: string): void {
  void runVideoTranscodeIfNeeded(fileId).catch(() => {});
}
