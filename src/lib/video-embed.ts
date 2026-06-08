import type { Metadata } from "next";
import type { PublicFileMeta } from "@/lib/file-public-meta";

/** Discord inline video embed limit (~50 MiB). */
export const DISCORD_INLINE_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

/** Whether Discord / OG crawlers can access this video at all. */
export function canDiscordVideoEmbed(meta: {
  isVideo: boolean;
  encryptionMode: "legacy_server" | "e2ee_client";
  requiresPassword: boolean;
  embedSupported: boolean;
}): boolean {
  return (
    meta.isVideo &&
    meta.encryptionMode === "legacy_server" &&
    !meta.requiresPassword &&
    meta.embedSupported
  );
}

/** Discord inline player (og:video) — only for videos under the size cap. */
export function canDiscordInlineVideo(meta: PublicFileMeta): boolean {
  if (!canDiscordVideoEmbed(meta)) return false;
  if (meta.transcodeStatus !== "ready") return false;
  const bytes = Number(meta.size);
  if (!Number.isFinite(bytes) || bytes < 1) return false;
  return bytes <= DISCORD_INLINE_VIDEO_MAX_BYTES;
}

/** Link preview with poster image (works for any size). */
export function canDiscordLinkPreview(meta: PublicFileMeta): boolean {
  return canDiscordVideoEmbed(meta) && meta.hasPoster;
}

export function discordStreamUrl(origin: string, fileId: string): string {
  return `${origin}/api/files/${fileId}?preview=1&inline=1`;
}

export function discordPosterUrl(origin: string, fileId: string): string {
  return `${origin}/api/files/${fileId}/poster`;
}

export function buildDiscordWatchTitle(filename: string | null): string {
  const name = filename?.trim() || "Video";
  const display = name.replace(/\.[^.]+$/, "");
  return `Watch ${display} | storra.host`;
}

export function buildVideoWatchMetadata(
  id: string,
  meta: PublicFileMeta,
  siteUrl: string
): Metadata {
  const title = buildDiscordWatchTitle(meta.filename);
  const pageUrl = `${siteUrl}${meta.watchUrl}`;
  const description = `Watch ${meta.filename?.trim() || "video"} on storra.host`;
  const fallbackPoster = `${siteUrl}/banner.png`;
  const posterUrl =
    canDiscordLinkPreview(meta) ? discordPosterUrl(siteUrl, id) : fallbackPoster;

  const inlineVideo = canDiscordInlineVideo(meta);
  const streamUrl = inlineVideo ? discordStreamUrl(siteUrl, id) : undefined;

  const videoWidth = 1280;
  const videoHeight = 720;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: inlineVideo ? "video.other" : "website",
      siteName: "storra.host",
      title,
      description,
      url: pageUrl,
      images: [
        {
          url: posterUrl,
          width: videoWidth,
          height: videoHeight,
          alt: title,
        },
      ],
      ...(streamUrl
        ? {
            videos: [
              {
                url: streamUrl,
                secureUrl: streamUrl,
                type: "video/mp4",
                width: videoWidth,
                height: videoHeight,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: inlineVideo ? "player" : "summary_large_image",
      title,
      description,
      images: [posterUrl],
    },
  };
}
