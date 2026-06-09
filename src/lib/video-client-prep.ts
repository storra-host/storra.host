import { createFile } from "mp4box";

type Mp4Chunk = ArrayBuffer & { fileStart?: number };

export type VideoPrepResult = {
  playback: Blob;
  poster: Blob;
};

function isMp4File(file: File): boolean {
  if (file.type === "video/mp4") return true;
  return /\.mp4$/i.test(file.name);
}

/** Extract a JPEG poster frame from a local video file. */
export async function captureVideoPosterBlob(
  file: File,
  seekSeconds = 0.5
): Promise<Blob | null> {
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|mkv|m4v|ogv)$/i.test(file.name)) {
    return null;
  }
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("metadata"));
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    video.currentTime = Math.min(seekSeconds, Math.max(0, duration - 0.1));

    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("seek"));
    });

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w < 1 || h < 1) return null;

    const canvas = document.createElement("canvas");
    const maxW = 1280;
    const scale = Math.min(1, maxW / w);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.88);
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lossless MP4 remux: rewrites with moov at front for instant streaming. */
export async function remuxMp4Faststart(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const mp4boxfile = createFile(true);

  return new Promise<Blob>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Video preparation timed out."));
    }, 120_000);

    mp4boxfile.onError = (e: string) => {
      window.clearTimeout(timeout);
      reject(new Error(e || "Could not parse MP4."));
    };

    mp4boxfile.onReady = () => {
      try {
        mp4boxfile.flush();
        // getBuffer() — save() triggers an anchor download in the browser.
        const stream = mp4boxfile.getBuffer();
        const out = new Blob([stream.buffer], { type: "video/mp4" });
        window.clearTimeout(timeout);
        if (!out || out.size < 1) {
          reject(new Error("Remux produced an empty file."));
          return;
        }
        resolve(out);
      } catch (err) {
        window.clearTimeout(timeout);
        reject(
          err instanceof Error ? err : new Error("Could not remux video.")
        );
      }
    };

    const chunk = buf as Mp4Chunk;
    chunk.fileStart = 0;
    // mp4box expects buffers tagged with fileStart
    mp4boxfile.appendBuffer(chunk as unknown as Parameters<typeof mp4boxfile.appendBuffer>[0]);
    mp4boxfile.flush();
  });
}

/**
 * Prepare stream-ready playback MP4 (lossless remux) and poster JPEG in the browser.
 */
export async function prepareVideoForUpload(file: File): Promise<VideoPrepResult> {
  if (!isMp4File(file)) {
    throw new Error(
      "Only MP4 videos support instant playback. Re-export or convert your clip to MP4 first."
    );
  }

  const [playback, poster] = await Promise.all([
    remuxMp4Faststart(file),
    captureVideoPosterBlob(file),
  ]);

  if (!poster || poster.size < 1) {
    throw new Error("Could not extract a poster frame from this video.");
  }

  return { playback, poster };
}
