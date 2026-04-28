import { Suspense } from "react";
import Script from "next/script";
import { SpaHome } from "@/components/site/spa-home";
import { Loader2 } from "lucide-react";
import { getMaxFileSizeBytes } from "@/lib/file-limits";

function formatMaxFile(bytes: number): string {
  if (bytes >= 1_048_576) {
    return `${Math.max(1, Math.round(bytes / 1_048_576))} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function HomeFallback() {
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      Loading…
    </p>
  );
}

export default function HomePage() {
  const maxFileBytes = getMaxFileSizeBytes();
  const maxFileLabel = formatMaxFile(maxFileBytes);
  return (
    <>
      <Script
        id="storra-ads"
        src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1255433"
        strategy="lazyOnload"
        data-cfasync="false"
      />
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-1 -translate-y-4 sm:-translate-y-8">
        <Suspense fallback={<HomeFallback />}>
          <SpaHome maxFileLabel={maxFileLabel} maxFileBytes={maxFileBytes} />
        </Suspense>
      </div>
    </>
  );
}
