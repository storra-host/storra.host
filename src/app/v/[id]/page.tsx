import type { Metadata } from "next";
import { VideoStructuredData } from "@/components/video/video-structured-data";
import { VideoWatchView } from "@/components/video/video-watch-view";
import { fetchPublicFileMeta } from "@/lib/file-server-meta";
import { resolveSiteOrigin } from "@/lib/site-origin";
import { buildVideoWatchMetadata } from "@/lib/video-embed";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const meta = await fetchPublicFileMeta(id);
  if (!meta?.isVideo) {
    return { title: "Video" };
  }

  const siteUrl = await resolveSiteOrigin();
  return buildVideoWatchMetadata(id, meta, siteUrl);
}

export default async function VideoWatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const minimal = sp.embed === "1";
  const [meta, siteUrl] = await Promise.all([
    fetchPublicFileMeta(id),
    resolveSiteOrigin(),
  ]);

  return (
    <>
      {meta?.isVideo ? (
        <VideoStructuredData fileId={id} meta={meta} siteUrl={siteUrl} />
      ) : null}
      <VideoWatchView fileId={id} minimal={minimal} />
    </>
  );
}
