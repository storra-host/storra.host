"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadForm } from "@/app/upload/upload-form";
import { BrandTitle } from "./brand-title";
import { Loader2 } from "lucide-react";

type SpaHomeProps = { maxFileLabel: string; maxFileBytes: number };

export function SpaHome({ maxFileBytes }: SpaHomeProps) {
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
          if (!cancelled) router.replace(`/f/${f}${window.location.hash ?? ""}`);
          return;
        }
        const meta = (await r.json()) as { isVideo?: boolean };
        const hash = window.location.hash ?? "";
        if (meta.isVideo) {
          router.replace(`/v/${f}${hash}`);
          return;
        }
        router.replace(`/f/${f}${hash}`);
        return;
      } catch {
        if (!cancelled) router.replace(`/f/${f}${window.location.hash ?? ""}`);
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

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      <header className="ui-fade-up w-full space-y-1.5 text-center">
        <BrandTitle />
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Encrypted file sharing - drop a file, get a link, done.
        </p>
      </header>

      <div className="ui-fade-up ui-fade-up-delay-1 w-full">
        <UploadForm maxFileBytes={maxFileBytes} />
      </div>
    </div>
  );
}
