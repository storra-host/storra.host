"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DownloadView } from "./download-view";
import { BrandTitle } from "@/components/site/brand-title";
import { Loader2 } from "lucide-react";

const linkClass =
  "text-sky-700 underline decoration-sky-500/50 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-500/40";

export function FilePageClient() {
  const p = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const id = Array.isArray(p.id) ? p.id[0] : p.id;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/files/${id}?meta=1`);
        if (!r.ok) {
          if (!cancelled) setReady(true);
          return;
        }
        const meta = (await r.json()) as { isVideo?: boolean };
        if (meta.isVideo) {
          const hash = window.location.hash ?? "";
          router.replace(`/v/${id}${hash}`);
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!id) {
    return <p className="text-sm text-rose-800">Invalid link</p>;
  }

  if (!ready) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading…
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-5">
      <header className="w-full text-center">
        <BrandTitle />
      </header>
      <div className="w-full">
        <DownloadView fileIdOverride={id} />
      </div>
      <p className="text-center text-sm text-slate-500 dark:text-zinc-500">
        <Link href="/" className={linkClass}>
          New upload
        </Link>
      </p>
    </div>
  );
}
