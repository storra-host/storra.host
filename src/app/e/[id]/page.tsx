"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/** Legacy embed URLs → unified watch page (preserves #k= for E2EE). */
export default function VideoEmbedRedirectPage() {
  const p = useParams<{ id: string | string[] }>();
  const id = Array.isArray(p.id) ? p.id[0] : p.id;

  useEffect(() => {
    if (!id) return;
    const hash = window.location.hash ?? "";
    window.location.replace(`/v/${id}?embed=1${hash}`);
  }, [id]);

  return (
    <p className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading…
    </p>
  );
}
