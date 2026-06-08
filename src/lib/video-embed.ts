import type { PublicFileMeta } from "@/lib/file-public-meta";

/** Whether Discord / OG crawlers can inline-embed this video. */
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
