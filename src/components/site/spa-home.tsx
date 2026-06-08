"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DownloadView } from "@/app/f/[id]/download-view";
import { UploadForm } from "@/app/upload/upload-form";
import { BrandTitle } from "./brand-title";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const linkClass =
  "text-sky-700 underline decoration-sky-500/50 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/40";

type SpaHomeProps = { maxFileLabel: string; maxFileBytes: number };

export function SpaHome({ maxFileLabel, maxFileBytes }: SpaHomeProps) {
  const sp = useSearchParams();
  const router = useRouter();
  const f = sp.get("f");
  const [fileReady, setFileReady] = useState(!f);

  useEffect(() => {
    if (!f) {
      setFileReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/files/${f}?meta=1`);
        if (!r.ok) {
          if (!cancelled) setFileReady(true);
          return;
        }
        const meta = (await r.json()) as { isVideo?: boolean };
        if (meta.isVideo) {
          const hash = window.location.hash ?? "";
          router.replace(`/v/${f}${hash}`);
          return;
        }
        if (!cancelled) setFileReady(true);
      } catch {
        if (!cancelled) setFileReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [f, router]);

  if (f && !fileReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </p>
      </div>
    );
  }

  if (f) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-5">
        <header className="w-full text-center">
          <BrandTitle />
        </header>
        <div className="w-full">
          <DownloadView fileIdOverride={f} />
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-zinc-500">
          <Link href="/" className={linkClass}>
            New upload
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5">
      <header className="w-full space-y-1.5 text-center">
        <BrandTitle />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Up to {maxFileLabel} · E2EE by default
        </p>
      </header>

      <UploadForm maxFileBytes={maxFileBytes} />
    </div>
  );
}
