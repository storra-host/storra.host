import type { PublicFileMeta } from "@/lib/file-public-meta";
import { buildVideoStructuredData } from "@/lib/video-embed";

type VideoStructuredDataProps = {
  fileId: string;
  meta: PublicFileMeta;
  siteUrl: string;
};

export function VideoStructuredData({
  fileId,
  meta,
  siteUrl,
}: VideoStructuredDataProps) {
  const data = buildVideoStructuredData(fileId, meta, siteUrl);
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
