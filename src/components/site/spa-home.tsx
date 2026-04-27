"use client";

import { useSearchParams } from "next/navigation";
import { DownloadView } from "@/app/f/[id]/download-view";
import { UploadForm } from "@/app/upload/upload-form";
import { BrandTitle } from "./brand-title";
import Link from "next/link";

const linkClass =
  "text-sky-700 underline decoration-sky-500/50 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/40";

type SpaHomeProps = { maxFileLabel: string; maxFileBytes: number };

export function SpaHome({ maxFileLabel, maxFileBytes }: SpaHomeProps) {
  const sp = useSearchParams();
  const f = sp.get("f");

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
