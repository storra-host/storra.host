"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoPlayer } from "@/components/video/video-player";
import { decryptFileWithDataKey } from "@/lib/client-file-crypto";
import type { PublicFileMeta } from "@/lib/file-public-meta";
import { appendE2eeKeyToUrl } from "@/lib/video";
import { Check, Copy, Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

type Phase =
  | "loading"
  | "error"
  | "ready"
  | "buffering"
  | "unsupported"
  | "transcoding"
  | "gone"
  | "needs_password";

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

function formatViews(n: number): string {
  if (n === 1) return "1 view";
  return `${n.toLocaleString()} views`;
}

function formatUploadDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000
  );

  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Yesterday at ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
    return `${weekday} at ${time}`;
  }

  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return `${datePart} at ${time}`;
}

type VideoWatchViewProps = {
  fileId: string;
  minimal?: boolean;
};

export function VideoWatchView({ fileId, minimal = false }: VideoWatchViewProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [meta, setMeta] = useState<PublicFileMeta | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);
  const blobRef = useRef<string | null>(null);
  const viewRecorded = useRef(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const shareUrl = useMemo(() => {
    if (!meta) return "";
    const base = `${origin}${meta.watchUrl}`;
    if (meta.encryptionMode === "e2ee_client") {
      return appendE2eeKeyToUrl(base, getKeyFromHash());
    }
    return base;
  }, [meta, origin]);

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  const setBlobSrc = useCallback(
    (blob: Blob) => {
      revokeBlob();
      const url = URL.createObjectURL(blob);
      blobRef.current = url;
      setSrc(url);
    },
    [revokeBlob]
  );

  const loadMeta = useCallback(async () => {
    const r = await fetch(`/api/files/${fileId}?meta=1`);
    if (!r.ok) {
      setPhase(r.status === 404 || r.status === 410 ? "gone" : "error");
      return null;
    }
    const j = (await r.json()) as PublicFileMeta;
    if (!j.isVideo) {
      setPhase("error");
      return null;
    }
    setMeta(j);
    setViewCount(j.viewCount);
    return j;
  }, [fileId]);

  const recordView = useCallback(async () => {
    if (viewRecorded.current) return;
    viewRecorded.current = true;
    try {
      const r = await fetch(`/api/files/${fileId}/view`, { method: "POST" });
      if (r.ok) {
        const j = (await r.json()) as { viewCount?: number };
        if (typeof j.viewCount === "number") setViewCount(j.viewCount);
      }
    } catch {
      viewRecorded.current = false;
    }
  }, [fileId]);

  const resolvePlayback = useCallback(
    async (m: PublicFileMeta, password: string) => {
      if (m.transcodeStatus === "pending") {
        setPhase("transcoding");
        return;
      }
      if (!m.embedSupported) {
        setPhase("unsupported");
        return;
      }

      if (m.requiresPassword && !password.trim()) {
        setPhase("needs_password");
        return;
      }

      const headers: HeadersInit = {};
      if (m.requiresPassword && password.trim()) {
        headers["X-Access-Password"] = password.trim();
      }

      const canStreamDirect =
        m.encryptionMode === "legacy_server" && !m.requiresPassword;

      if (canStreamDirect) {
        revokeBlob();
        setSrc(`/api/files/${fileId}?preview=1&inline=1`);
        setPhase("ready");
        void recordView();
        return;
      }

      setPhase("buffering");

      if (m.encryptionMode === "e2ee_client") {
        const key = getKeyFromHash();
        if (!key) {
          toast.error("Missing decryption key in link (#k=...).");
          setPhase("error");
          return;
        }
        const d = await fetch(`/api/files/${fileId}?preview=1`, { headers });
        if (!d.ok) {
          if (d.status === 401) {
            setPhase("needs_password");
            toast.error("Incorrect access password.");
          } else {
            setPhase("error");
          }
          return;
        }
        const encrypted = await d.arrayBuffer();
        let plain: ArrayBuffer;
        try {
          plain = await decryptFileWithDataKey(encrypted, key, m.iv);
        } catch {
          toast.error("Could not decrypt video. The key may be wrong.");
          setPhase("error");
          return;
        }
        setBlobSrc(
          new Blob([plain], {
            type: m.playbackMimeType || m.mimeType || "video/mp4",
          })
        );
        setPhase("ready");
        void recordView();
        return;
      }

      if (m.requiresPassword) {
        const d = await fetch(`/api/files/${fileId}?preview=1&inline=1`, { headers });
        if (!d.ok) {
          if (d.status === 401) {
            setPhase("needs_password");
            toast.error("Incorrect access password.");
          } else {
            setPhase("error");
          }
          return;
        }
        setBlobSrc(
          new Blob([await d.arrayBuffer()], {
            type: m.playbackMimeType || m.mimeType || "video/mp4",
          })
        );
        setPhase("ready");
        void recordView();
      }
    },
    [fileId, recordView, revokeBlob, setBlobSrc]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await loadMeta();
      if (cancelled || !m) return;
      await resolvePlayback(m, accessPassword);
    })();
    return () => {
      cancelled = true;
      revokeBlob();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, [fileId]);

  useEffect(() => {
    if (!meta || meta.transcodeStatus !== "pending") return;
    const t = setInterval(async () => {
      const m = await loadMeta();
      if (m && m.transcodeStatus !== "pending") {
        clearInterval(t);
        await resolvePlayback(m, accessPassword);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [meta, loadMeta, resolvePlayback, accessPassword]);

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const download = async () => {
    if (!meta) return;
    setWorking(true);
    try {
      const headers: HeadersInit = {};
      if (meta.requiresPassword && accessPassword.trim()) {
        headers["X-Access-Password"] = accessPassword.trim();
      }
      const d = await fetch(`/api/files/${fileId}`, { headers });
      if (!d.ok) {
        toast.error("Download failed.");
        return;
      }
      let blob = await d.blob();
      if (meta.encryptionMode === "e2ee_client") {
        const key = getKeyFromHash();
        if (!key) {
          toast.error("Missing decryption key.");
          return;
        }
        const plain = await decryptFileWithDataKey(
          await blob.arrayBuffer(),
          key,
          meta.iv
        );
        blob = new Blob([plain], {
          type: meta.mimeType || "application/octet-stream",
        });
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = meta.filename?.trim() || "video";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
      toast.success("Download started");
    } catch {
      toast.error("Download failed.");
    } finally {
      setWorking(false);
    }
  };

  if (phase === "loading" || phase === "buffering") {
    return (
      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        {phase === "buffering" ? "Preparing playback…" : "Loading…"}
      </div>
    );
  }

  if (phase === "gone") {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        This video expired or was removed.
      </p>
    );
  }

  if (phase === "transcoding") {
    return (
      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-400">Optimizing video for playback…</p>
      </div>
    );
  }

  if (phase === "unsupported" && meta) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <p className="text-sm font-medium text-zinc-200">
          Playback not supported in browser
        </p>
        <Button type="button" size="sm" variant="outline" onClick={download} disabled={working}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download video
        </Button>
      </div>
    );
  }

  if (!meta) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Could not load this video.
      </p>
    );
  }

  const title = meta.filename?.trim() || "Video";
  const displayTitle = title.replace(/\.[^.]+$/, "");
  const uploadedLabel = meta.createdAt ? formatUploadDate(meta.createdAt) : null;

  return (
    <div
      className={
        minimal
          ? "flex h-full min-h-0 w-full flex-col bg-black"
          : "flex w-full max-w-5xl flex-col gap-5"
      }
    >
      {phase === "needs_password" ? (
        <div className="mx-auto w-full max-w-sm space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <Label htmlFor={`video-pw-${fileId}`} className="text-xs text-zinc-400">
            Access password
          </Label>
          <Input
            id={`video-pw-${fileId}`}
            type="password"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            className="h-8 text-xs"
            placeholder="Required to play"
            onKeyDown={(e) => {
              if (e.key === "Enter") void resolvePlayback(meta, accessPassword);
            }}
          />
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={() => void resolvePlayback(meta, accessPassword)}
          >
            Unlock video
          </Button>
        </div>
      ) : (
        <VideoPlayer
          src={src}
          poster={
            meta.discordEmbeddable && meta.hasPoster
              ? `/api/files/${fileId}/poster`
              : null
          }
          title={title}
          minimal={minimal}
          className={minimal ? "flex-1 rounded-none" : "w-full"}
        />
      )}

      {!minimal && meta.encryptionMode === "e2ee_client" ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          Discord cannot embed encrypted videos (the key in <code className="text-amber-100">#k=</code> is
          never sent to Discord). Re-upload the video to get a Streamable-style inline embed.
        </p>
      ) : null}

      {!minimal && phase === "ready" ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-5">
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="truncate text-base font-semibold tracking-tight text-zinc-50 sm:text-lg">
              {displayTitle}
            </h1>
            <p className="text-sm text-zinc-500">
              {formatViews(viewCount)}
              {uploadedLabel ? (
                <>
                  <span className="mx-2 text-zinc-700" aria-hidden>
                    ·
                  </span>
                  {uploadedLabel}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-zinc-700/80 bg-zinc-900/50 px-3.5 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
              onClick={() => void copyShare()}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Share
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-zinc-700/80 bg-zinc-900/50 px-3.5 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={download}
              disabled={working}
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
