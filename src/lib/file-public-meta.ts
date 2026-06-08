import {
  isEmbedPlaybackSupported,
  isVideoFile,
  resolveMimeType,
  resolvePlaybackMime,
  type TranscodeStatus,
  videoEmbedPath,
  videoWatchPath,
} from "@/lib/video";
import { canDiscordInlineVideo, canDiscordVideoEmbed } from "@/lib/video-embed";

export type PublicFileMeta = {
  id: string;
  size: string;
  filename: string | null;
  mimeType: string | null;
  iv: string;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  viewCount: number;
  requiresPassword: boolean;
  encryptionMode: "legacy_server" | "e2ee_client";
  isVideo: boolean;
  embedSupported: boolean;
  playbackMimeType: string | null;
  transcodeStatus: TranscodeStatus;
  watchUrl: string;
  embedUrl: string;
  discordEmbeddable: boolean;
  discordInlineVideo: boolean;
  hasPoster: boolean;
  createdAt: string | null;
};

type DbRow = {
  id: string;
  size: string | number;
  mime_type: string | null;
  filename: string | null;
  iv: string;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  view_count?: number | null;
  password_key_wrap: string | null;
  encryption_mode?: "legacy_server" | "e2ee_client";
  transcode_status?: string | null;
  playback_mime_type?: string | null;
  poster_storage_key?: string | null;
  created_at?: string | null;
};

export function toPublicFileMeta(row: DbRow): PublicFileMeta {
  const transcodeStatus = (row.transcode_status ?? "none") as TranscodeStatus;
  const filename = row.filename;
  const mimeType = resolveMimeType(filename, row.mime_type);
  const playbackMimeType = resolvePlaybackMime({
    filename,
    mimeType: row.mime_type,
    playbackMimeType: row.playback_mime_type ?? null,
    transcodeStatus,
  });
  const isVideo = isVideoFile(filename, row.mime_type);
  const embedSupported = isVideo
    ? isEmbedPlaybackSupported({
        filename,
        mimeType: row.mime_type,
        playbackMimeType: row.playback_mime_type ?? null,
        transcodeStatus,
      })
    : false;

  const baseMeta = {
    isVideo,
    encryptionMode: (row.encryption_mode ?? "legacy_server") as
      | "legacy_server"
      | "e2ee_client",
    requiresPassword: Boolean(row.password_key_wrap),
    embedSupported,
  };

  const discordEmbeddable = isVideo ? canDiscordVideoEmbed(baseMeta) : false;

  const publicMeta: PublicFileMeta = {
    id: row.id,
    size: String(row.size),
    filename,
    mimeType,
    iv: row.iv,
    expiresAt: row.expires_at,
    maxDownloads: row.max_downloads,
    downloadCount: row.download_count,
    viewCount: row.view_count ?? 0,
    requiresPassword: Boolean(row.password_key_wrap),
    encryptionMode: row.encryption_mode ?? "legacy_server",
    isVideo,
    embedSupported,
    playbackMimeType,
    transcodeStatus,
    watchUrl: videoWatchPath(row.id),
    embedUrl: videoEmbedPath(row.id),
    discordEmbeddable,
    discordInlineVideo: false,
    hasPoster: Boolean(row.poster_storage_key),
    createdAt: row.created_at ?? null,
  };

  publicMeta.discordInlineVideo = canDiscordInlineVideo(publicMeta);
  return publicMeta;
}
