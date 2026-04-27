"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export function PrettyLinkRedirect() {
  const params = useParams<{ id: string; filename: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawName = Array.isArray(params.filename)
    ? params.filename[0]
    : params.filename;

  useEffect(() => {
    if (!id || !rawName) return;
    try {
      const h = window.location.hash ?? "";
      const u = new URL(window.location.origin + "/");
      u.searchParams.set("f", id);
      u.searchParams.set("n", rawName);
      window.location.replace(u.pathname + u.search + h);
    } catch {
    }
  }, [id, rawName]);

  if (!id || !rawName) {
    return <p className="text-sm text-rose-800">Invalid link</p>;
  }

  return (
    <p className="text-sm text-slate-500" role="status">
      Loading…
    </p>
  );
}
