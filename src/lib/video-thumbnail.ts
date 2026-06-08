/** Capture a poster frame from a local video file (upload preview). */
export async function captureVideoThumbnail(
  file: File,
  seekSeconds = 0.5
): Promise<string | null> {
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
    const maxW = 640;
    const scale = Math.min(1, maxW / w);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
