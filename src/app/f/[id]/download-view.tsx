"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileTypeIcon } from "@/components/file-type-icon";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { decryptFileWithDataKey } from "@/lib/client-file-crypto";

type Meta = {
  id: string;
  size: string;
  filename: string | null;
  mimeType: string | null;
  iv: string;
  downloadCount: number;
  maxDownloads: number | null;
  requiresPassword?: boolean;
  encryptionMode?: "legacy_server" | "e2ee_client";
};

type Phase =
  | "loading"
  | "error"
  | "ready"
  | "forbidden"
  | "gone"
  | "other";

function formatFileSize(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "-";
  if (n < 1000) return `${n} B`;
  if (n < 1_048_576) {
    const kb = n / 1024;
    return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb).toLocaleString()} KB`;
  }
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

function saveBlob(b: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
}

function getKeyFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!h) return null;
  const p = new URLSearchParams(h);
  const k = p.get("k")?.trim() ?? "";
  return k.length > 0 ? k : null;
}

type DownloadViewProps = {
  fileIdOverride?: string;
};

export function DownloadView({ fileIdOverride }: DownloadViewProps = {}) {
  const params = useParams<{ id: string; filename?: string }>();
  const sp = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [working, setWorking] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const id = fileIdOverride ?? params.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        toast.error("Missing file in link.");
        if (!cancelled) setPhase("error");
        return;
      }
      const m = sp.get("message");
      if (m) {
        try {
          toast.message(decodeURIComponent(m));
        } catch {
          toast.message(m);
        }
      }
      const r = await fetch(`/api/files/${id}?meta=1`);
      if (!r.ok) {
        if (r.status === 404) {
          if (!cancelled) {
            toast.error("File not found.");
            setPhase("gone");
          }
        } else if (r.status === 410) {
          if (!cancelled) {
            toast.error("This file has expired or was removed.");
            setPhase("gone");
          }
        } else {
          if (!cancelled) {
            toast.error("Could not load file metadata.");
            setPhase("other");
          }
        }
        return;
      }
      const j = (await r.json()) as Meta;
      if (cancelled) return;
      setMeta(j);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [id, sp]);

  const download = async () => {
    if (!id || !meta) return;
    if (meta.requiresPassword && !accessPassword.trim()) {
      toast.error("Enter the access password to download.");
      return;
    }
    setWorking(true);
    try {
      const headers: HeadersInit = {};
      if (meta.requiresPassword && accessPassword.trim()) {
        headers["X-Access-Password"] = accessPassword.trim();
      }
      const d = await fetch(`/api/files/${id}`, { headers });
      if (d.status === 401) {
        const j = (await d.json().catch(() => null)) as {
          error?: { code?: string; message?: string };
        } | null;
        toast.error(
          j?.error?.code === "password_required"
            ? "Access password required."
            : j?.error?.message ?? "Incorrect access password."
        );
        return;
      }
      if (d.status === 403) {
        toast.error("Download not allowed. The limit for this file may be reached.");
        setPhase("forbidden");
        return;
      }
      if (d.status === 404) {
        toast.error("File not found.");
        setPhase("gone");
        return;
      }
      if (d.status === 410) {
        toast.error("File expired or removed.");
        setPhase("gone");
        return;
      }
      if (d.status === 429) {
        toast.error("Too many requests. Try again in a moment.");
        return;
      }
      if (!d.ok) {
        const j = (await d.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        toast.error(
          j?.error?.message ?? "Download failed."
        );
        setPhase("other");
        return;
      }
      const name =
        meta.filename && meta.filename.length > 0
          ? meta.filename
          : "download";
      let blob = await d.blob();
      if ((meta.encryptionMode ?? "legacy_server") === "e2ee_client") {
        const key = getKeyFromHash();
        if (!key) {
          toast.error("Missing decryption key in link (#k=...).");
          return;
        }
        const encrypted = await blob.arrayBuffer();
        let plain: ArrayBuffer;
        try {
          plain = await decryptFileWithDataKey(encrypted, key, meta.iv);
        } catch {
          toast.error("Could not decrypt file. The key may be wrong.");
          return;
        }
        blob = new Blob([plain], {
          type: meta.mimeType || "application/octet-stream",
        });
      }
      saveBlob(blob, name);
      toast.success("File saved to your device");
    } catch {
      toast.error("Network error while downloading.");
    } finally {
      setWorking(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-sm py-1 text-center">
        <p className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          Loading…
        </p>
      </div>
    );
  }

  if (phase === "ready" && meta) {
    const bytes = Number(meta.size);
    const displayName = meta.filename?.trim() || "Unnamed file";
    const forIcon = meta.filename?.trim() || "file.bin";
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-lg border border-dashed border-zinc-600/50 bg-zinc-950/20 px-4 py-5 text-center">
          <p className="text-[0.65rem] font-medium uppercase tracking-widest text-zinc-500">
            Download
          </p>
          <div className="mt-3 flex min-h-[2.5rem] w-full max-w-full items-center justify-center gap-2">
            <FileTypeIcon filename={forIcon} className="h-5 w-5" />
            <span className="min-w-0 max-w-full truncate text-sm font-medium text-zinc-100">
              {displayName}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            {formatFileSize(bytes)}
            {meta.maxDownloads != null
              ? ` · ${meta.downloadCount} / ${meta.maxDownloads} downloads`
              : null}
          </p>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-zinc-500">
            {(meta.encryptionMode ?? "legacy_server") === "e2ee_client"
              ? "Encrypted object will be decrypted in your browser using the key in this link."
              : "Decrypted for this request and sent to your browser."}
          </p>
          {meta.requiresPassword ? (
            <div className="mt-3 w-full space-y-1.5 text-left">
              <Label
                htmlFor={`access-pw-${id}`}
                className="text-[0.65rem] font-medium uppercase tracking-widest text-zinc-500"
              >
                Access password
              </Label>
              <Input
                id={`access-pw-${id}`}
                type="password"
                name="access-password"
                autoComplete="off"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void download();
                  }
                }}
                placeholder="Set when the file was uploaded"
                className="h-8 text-xs"
              />
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 h-8 gap-1.5 text-xs"
            onClick={download}
            disabled={working}
          >
            {working ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 shrink-0" />
            )}
            {working ? "Working…" : "Download"}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "forbidden" || phase === "gone" || phase === "other" || phase === "error") {
    return (
      <div className="mx-auto w-full max-w-sm space-y-2 text-center">
        <p className="text-sm font-medium text-zinc-200">Cannot open file</p>
        {phase === "forbidden" && (
          <p className="text-xs text-zinc-500">
            This download is not available (limit or policy).
          </p>
        )}
        {phase === "gone" && (
          <p className="text-xs text-zinc-500">
            The file expired or was removed.
          </p>
        )}
        {phase === "other" && (
          <p className="text-xs text-zinc-500">Something went wrong. Try again later.</p>
        )}
        {phase === "error" && (
          <p className="text-xs text-zinc-500">The link is invalid or incomplete.</p>
        )}
      </div>
    );
  }

  return null;
}
