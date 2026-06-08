import type { Metadata } from "next";
import { VideoWatchView } from "@/components/video/video-watch-view";
import { fetchPublicFileMeta } from "@/lib/file-server-meta";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
};

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const meta = await fetchPublicFileMeta(id);
  if (!meta?.isVideo) {
    return { title: "Video" };
  }

  const siteUrl = siteOrigin();
  const title = meta.filename?.trim() || "Video";
  const pageUrl = `${siteUrl}${meta.watchUrl}`;
  const description = `Watch ${title} on storra.host`;
  const poster = `${siteUrl}/banner.png`;

  const canDiscordVideo =
    meta.encryptionMode === "legacy_server" &&
    !meta.requiresPassword &&
    meta.embedSupported;

  const streamUrl = canDiscordVideo
    ? `${siteUrl}/api/files/${id}?preview=1&inline=1`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      type: "video.other",
      siteName: "storra.host",
      title,
      description,
      url: pageUrl,
      images: [
        {
          url: poster,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(streamUrl
        ? {
            videos: [
              {
                url: streamUrl,
                secureUrl: streamUrl,
                type: meta.playbackMimeType ?? "video/mp4",
                width: 1280,
                height: 720,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: streamUrl ? "player" : "summary_large_image",
      title,
      description,
      images: [poster],
    },
    other: streamUrl
      ? {
          "og:video:url": streamUrl,
          "og:video:secure_url": streamUrl,
          "og:video:type": meta.playbackMimeType ?? "video/mp4",
          "og:video:width": "1280",
          "og:video:height": "720",
        }
      : undefined,
  };
}

export default async function VideoWatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const minimal = sp.embed === "1";
  return <VideoWatchView fileId={id} minimal={minimal} />;
}
