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
      />
      <Script
        id="storra-ads-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `s3ii[129303]=(function(){var j=2;for(;j !== 9;){switch(j){case 1:return globalThis;break;case 2:j=typeof globalThis === '\\u006f\\u0062\\u006a\\x65\\x63\\u0074'?1:5;break;case 5:var s;try{var U=2;for(;U !== 6;){switch(U){case 9:delete s['\\x52\\x4e\\u0062\\u0074\\u0031'];U=8;break;case 3:throw "";U=9;break;case 4:U=typeof RNbt1 === '\\x75\\u006e\\u0064\\u0065\\u0066\\u0069\\u006e\\u0065\\u0064'?3:9;break;case 8:var H=Object['\\x70\\u0072\\u006f\\u0074\\u006f\\x74\\u0079\\x70\\x65'];delete H['\\u005f\\u0065\\x48\\u0041\\u0064'];U=6;break;case 2:Object['\\x64\\x65\\u0066\\u0069\\u006e\\u0065\\u0050\\u0072\\u006f\\x70\\x65\\x72\\u0074\\x79'](Object['\\u0070\\x72\\u006f\\x74\\u006f\\x74\\u0079\\x70\\x65'],'\\u005f\\x65\\x48\\x41\\x64',{'\\x67\\x65\\x74':function(){var l=2;for(;l !== 1;){switch(l){case 2:return this;break;}}},\'\\x63\\x6f\\x6e\\x66\\x69\\x67\\x75\\x72\\x61\\x62\\x6c\\x65\\':true});s=_eHAd;s['\\x52\\x4e\\x62\\u0074\\u0031']=s;U=4;break;}}}catch(k){s=window;}return s;break;}}})();P7Q(s3ii[129303]);`,
        }}
      />
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-1 -translate-y-4 sm:-translate-y-8">
        <Suspense fallback={<HomeFallback />}>
          <SpaHome maxFileLabel={maxFileLabel} maxFileBytes={maxFileBytes} />
        </Suspense>
      </div>
    </>
  );
}
