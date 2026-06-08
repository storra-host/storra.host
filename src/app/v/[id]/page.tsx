import type { Metadata } from "next";
import { VideoWatchView } from "@/components/video/video-watch-view";
import { fetchPublicFileMeta } from "@/lib/file-server-meta";
import {
  buildDiscordWatchTitle,
  canDiscordVideoEmbed,
  discordPosterUrl,
  discordStreamUrl,
} from "@/lib/video-embed";

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
  const title = buildDiscordWatchTitle(meta.filename);
  const pageUrl = `${siteUrl}${meta.watchUrl}`;
  const description = `Watch ${meta.filename?.trim() || "video"} on storra.host`;
  const fallbackPoster = `${siteUrl}/banner.png`;
  const embeddable = canDiscordVideoEmbed(meta);
  const streamUrl = embeddable ? discordStreamUrl(siteUrl, id) : undefined;
  const posterUrl = embeddable && meta.hasPoster
    ? discordPosterUrl(siteUrl, id)
    : fallbackPoster;

  const videoWidth = 1280;
  const videoHeight = 720;

  return {
    title,
    description,
    openGraph: {
      type: embeddable ? "video.other" : "website",
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
      card: streamUrl ? "player" : "summary_large_image",
      title,
      description,
      images: [posterUrl],
    },
    other: streamUrl
      ? {
          "og:video": streamUrl,
          "og:video:url": streamUrl,
          "og:video:secure_url": streamUrl,
          "og:video:type": "video/mp4",
          "og:video:width": String(videoWidth),
          "og:video:height": String(videoHeight),
          "theme-color": "#18181b",
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
