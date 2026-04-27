"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export function FileIdRedirect() {
  const p = useParams<{ id: string | string[] }>();
  const id = Array.isArray(p.id) ? p.id[0] : p.id;

  useEffect(() => {
    if (!id) return;
    try {
      const h = window.location.hash ?? "";
      const u = new URL(window.location.origin + "/");
      u.searchParams.set("f", id);
      window.location.replace(u.pathname + u.search + h);
    } catch {}
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
