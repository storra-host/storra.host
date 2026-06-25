/** Common video extensions supported for embed detection. */
import {
  appendE2eeKeyToUrl as appendE2eeKey,
  fileSharePath,
} from "@/lib/e2ee-url";

export { appendE2eeKeyToUrl } from "@/lib/e2ee-url";

export const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
  "avi",
  "mkv",
  "flv",
  "wmv",
  "mpeg",
  "mpg",
  "3gp",
  "ogv",
  "ts",
  "mts",
  "m2ts",
  "vob",
  "f4v",
  "asf",
]);

/** Extension → MIME when the browser reports an empty type. */
export const VIDEO_EXTENSION_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  flv: "video/x-flv",
  wmv: "video/x-ms-wmv",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  "3gp": "video/3gpp",
  ogv: "video/ogg",
  ts: "video/mp2t",
  mts: "video/mp2t",
  m2ts: "video/mp2t",
  vob: "video/mpeg",
  f4v: "video/x-f4v",
  asf: "video/x-ms-asf",
};

/** MIME types reliably playable via HTML5 `<video>` in modern browsers. */
export const BROWSER_NATIVE_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

export function getFileExtension(filename: string | null | undefined): string | null {
  if (!filename?.trim()) return null;
  const base = filename.trim().split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot < 1 || dot === base.length - 1) return null;
  return base.slice(dot + 1).toLowerCase();
}

export function mimeFromExtension(ext: string | null): string | null {
  if (!ext) return null;
  return VIDEO_EXTENSION_TO_MIME[ext] ?? null;
}

export function resolveMimeType(
  filename: string | null | undefined,
  mimeType: string | null | undefined
): string | null {
  const trimmed = mimeType?.trim();
  if (trimmed) return trimmed;
  return mimeFromExtension(getFileExtension(filename));
}

export function isVideoFile(
  filename: string | null | undefined,
  mimeType: string | null | undefined
): boolean {
  const mime = resolveMimeType(filename, mimeType);
  if (mime?.startsWith("video/")) return true;
  const ext = getFileExtension(filename);
  return ext != null && VIDEO_EXTENSIONS.has(ext);
}

export function isBrowserNativeVideoMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  return BROWSER_NATIVE_VIDEO_MIMES.has(base);
}

export type TranscodeStatus =
  | "none"
  | "pending"
  | "ready"
  | "failed"
  | "skipped";

export function resolvePlaybackMime(input: {
  filename: string | null;
  mimeType: string | null;
  playbackMimeType: string | null;
  transcodeStatus: TranscodeStatus;
}): string | null {
  if (input.transcodeStatus === "ready" && input.playbackMimeType?.trim()) {
    return input.playbackMimeType.trim();
  }
  return resolveMimeType(input.filename, input.mimeType);
}

export function isEmbedPlaybackSupported(input: {
  filename: string | null;
  mimeType: string | null;
  playbackMimeType: string | null;
  transcodeStatus: TranscodeStatus;
}): boolean {
  if (input.transcodeStatus === "ready") return true;
  const playback = resolvePlaybackMime(input);
  return isBrowserNativeVideoMime(playback);
}

export function videoWatchPath(fileId: string): string {
  return `/v/${fileId}`;
}

export function videoEmbedPath(fileId: string): string {
  return `/e/${fileId}`;
}

/** One share link: `/v/{id}` for video, `/f/{id}` for everything else. */
export function buildFileShareUrl(
  origin: string,
  fileId: string,
  opts: { isVideo: boolean; e2eeKey?: string | null }
): string {
  const base = opts.isVideo
    ? `${origin}${videoWatchPath(fileId)}`
    : `${origin}${fileSharePath(fileId)}`;
  return appendE2eeKey(base, opts.e2eeKey);
}
