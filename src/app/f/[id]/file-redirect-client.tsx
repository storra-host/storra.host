"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export function FileIdRedirect() {
  const p = useParams<{ id: string | string[] }>();
  const id = Array.isArray(p.id) ? p.id[0] : p.id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const h = window.location.hash ?? "";
        const r = await fetch(`/api/files/${id}?meta=1`);
        if (cancelled) return;
        if (r.ok) {
          const meta = (await r.json()) as { isVideo?: boolean };
          if (meta.isVideo) {
            window.location.replace(`/v/${id}${h}`);
            return;
          }
        }
        const u = new URL(window.location.origin + "/");
        u.searchParams.set("f", id);
        window.location.replace(u.pathname + u.search + h);
      } catch {
        if (!cancelled) {
          const h = window.location.hash ?? "";
          window.location.replace(`/?f=${id}${h}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <p className="text-sm text-rose-800">Invalid link</p>;
  }

  return (
    <p className="text-sm text-slate-500" role="status">
      Loading…
    </p>
  );
}
