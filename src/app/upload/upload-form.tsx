"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Eye, EyeOff, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { FileTypeIcon } from "@/components/file-type-icon";
import {
  encryptFileWithDataKey,
  generateDataKeyAndIv,
} from "@/lib/client-file-crypto";
import { DEFAULT_MAX_FILE_SIZE_BYTES } from "@/lib/file-limits";
import { cn } from "@/lib/utils";

type Step = "pick" | "upload" | "done";
type EncryptionMode = "e2ee_client" | "legacy_server";

const expiryOptions = [
  { value: "none", label: "No expiry" },
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
] as const;

type ManualUnit = "minutes" | "hours" | "days";

type PresetExpiry = (typeof expiryOptions)[number]["value"];
type ExpiryChoice = PresetExpiry | "custom";

const MAX_EXPIRY_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;

function expiryToIso(v: PresetExpiry): string | null {
  if (v === "none") return null;
  const t = new Date();
  if (v === "1h") t.setHours(t.getHours() + 1);
  if (v === "24h") t.setDate(t.getDate() + 1);
  if (v === "7d") t.setDate(t.getDate() + 7);
  if (v === "30d") t.setDate(t.getDate() + 30);
  return t.toISOString();
}

function manualExpiryToIso(
  amountStr: string,
  unit: ManualUnit
): { ok: true; iso: string } | { ok: false; message: string } {
  const raw = amountStr.trim();
  if (raw === "") {
    return { ok: false, message: "Enter how long the link should last." };
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, message: "Use a whole number of 1 or more." };
  }
  if (n > 1_000_000) {
    return { ok: false, message: "That value is too large." };
  }
  const t = new Date();
  if (unit === "minutes") t.setMinutes(t.getMinutes() + n);
  else if (unit === "hours") t.setHours(t.getHours() + n);
  else t.setDate(t.getDate() + n);
  if (t.getTime() - Date.now() > MAX_EXPIRY_MS) {
    return { ok: false, message: "Expiry cannot be more than 10 years from now." };
  }
  return { ok: true, iso: t.toISOString() };
}

function resolveExpiresAt(
  choice: ExpiryChoice,
  manualAmount: string,
  manualUnit: ManualUnit
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (choice === "custom") {
    const m = manualExpiryToIso(manualAmount, manualUnit);
    if (!m.ok) return m;
    return { ok: true, value: m.iso };
  }
  return { ok: true, value: expiryToIso(choice) };
}

function formatMaxForToast(bytes: number): string {
  if (bytes >= 1_048_576) {
    return `${Math.max(1, Math.round(bytes / 1_048_576))} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const E_R2_NET = "__R2_NETWORK__";
const E_R2_ST0 = "__R2_ST0__";
const E_R2_HTTP = "__R2_HTTP__:";

function toastR2DirectUploadError(
  kind:
    | { code: "cors_or_network" }
    | { code: "http"; status: number }
) {
  if (kind.code === "http") {
    toast.error("R2 rejected the upload", {
      description: `The storage endpoint returned ${kind.status}. Check that your R2 API token can write to this bucket, and that the presigned request is not blocked. If 403, verify token permissions and CORS (AllowedMethods include PUT, AllowedHeaders allow Content-Type).`,
      duration: 14_000,
    });
    return;
  }
  const origin =
    typeof window !== "undefined" ? window.location.origin : "this app’s URL";
  toast.error("Browser could not complete upload to R2", {
    description: `This almost always means the R2 bucket has no CORS rule for your app. In Cloudflare: R2 → the bucket → Settings → CORS. Add an entry with AllowedOrigins including ${origin} (and http://localhost:3000 for local dev), AllowedMethods: PUT, GET, HEAD, AllowedHeaders: *, ExposeHeaders: ETag, MaxAgeSeconds: 3600. See README → R2.`,
    duration: 18_000,
  });
}

type UploadFormProps = { maxFileBytes?: number };

export function UploadForm({
  maxFileBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
}: UploadFormProps) {
  const fileInputId = useId();
  const optionsFieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [expiryChoice, setExpiryChoice] = useState<ExpiryChoice>("none");
  const [manualAmount, setManualAmount] = useState("7");
  const [manualUnit, setManualUnit] = useState<ManualUnit>("days");
  const [maxDownloads, setMaxDownloads] = useState<string>("");
  const [step, setStep] = useState<Step>("pick");
  const [progress, setProgress] = useState(0);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [drag, setDrag] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [showAccessPassword, setShowAccessPassword] = useState(false);
  const [encryptionMode, setEncryptionMode] = useState<EncryptionMode>("e2ee_client");

  const applyFile = useCallback(
    (f: File) => {
      if (f.size > maxFileBytes) {
        toast.error(
          `File is too large. Maximum size is ${formatMaxForToast(maxFileBytes)}.`
        );
        return;
      }
      setFile(f);
    },
    [maxFileBytes]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f) applyFile(f);
    },
    [applyFile]
  );

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      applyFile(f);
    }
  };

  const clearFileInput = () => {
    const el = inputRef.current;
    if (el) el.value = "";
  };

  const maxDl = useMemo(() => {
    const n = maxDownloads.trim();
    if (!n) return null;
    const v = Number.parseInt(n, 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [maxDownloads]);

  const start = async () => {
    if (!file) return;
    const resolved = resolveExpiresAt(expiryChoice, manualAmount, manualUnit);
    if (!resolved.ok) {
      setOptionsOpen(true);
      toast.error(resolved.message);
      return;
    }
    setOptionsOpen(false);
    setStep("upload");
    setProgress(0);
    try {
      const metaPayload: Record<string, unknown> = {
        encryptionMode,
        originalName: file.name,
        mimeType: file.type || null,
        expiresAt: resolved.value,
        maxDownloads: maxDl,
      };
      const localE2EE = encryptionMode === "e2ee_client" ? generateDataKeyAndIv() : null;
      if (localE2EE) {
        metaPayload.iv = localE2EE.iv;
      }
      const pw = accessPassword.trim();
      if (pw.length > 0) {
        metaPayload.accessPassword = pw;
      }
      setProgress(2);
      const preRes = await fetch("/api/files/upload/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: JSON.stringify(metaPayload) }),
      });
      if (!preRes.ok) {
        const j = (await preRes.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(
          j?.error?.message ??
            (preRes.status === 429
              ? "Too many requests. Wait a bit and try again."
              : `Could not start upload (${preRes.status})`)
        );
      }
      const pre = (await preRes.json()) as {
        fileId: string;
        finalizeToken: string;
        dataKey?: string;
        iv: string;
        encryptionMode?: EncryptionMode;
        put: { method: "PUT"; url: string };
      };
      const resolvedMode = pre.encryptionMode ?? encryptionMode;
      setProgress(5);
      const fileBuf = await file.arrayBuffer();
      const dataKey = resolvedMode === "e2ee_client" ? localE2EE?.dataKey : pre.dataKey;
      const iv = resolvedMode === "e2ee_client" ? localE2EE?.iv : pre.iv;
      if (!dataKey || !iv) {
        throw new Error("Upload setup is incomplete. Please retry.");
      }
      const encBuf = await encryptFileWithDataKey(
        fileBuf,
        dataKey,
        iv
      );
      setProgress(8);
      const { fileId } = await new Promise<{
        fileId: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(pre.put.method, pre.put.url);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const p = 8 + Math.round((ev.loaded / ev.total) * 87);
            setProgress(p);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ fileId: pre.fileId });
            return;
          }
          if (xhr.status === 0) {
            reject(new Error(E_R2_ST0));
            return;
          }
          reject(new Error(`${E_R2_HTTP}${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error(E_R2_NET));
        xhr.send(new Blob([encBuf]));
      });
      setProgress(95);
      const compRes = await fetch("/api/files/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, finalizeToken: pre.finalizeToken }),
      });
      if (!compRes.ok) {
        const j = (await compRes.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(
          j?.error?.message ?? `Could not finalize upload (${compRes.status})`
        );
      }
      await compRes.json();
      setProgress(100);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const linkValue =
        resolvedMode === "e2ee_client"
          ? `${origin}/?f=${fileId}#k=${encodeURIComponent(dataKey)}`
          : `${origin}/?f=${fileId}`;
      setLink(linkValue);
      setStep("done");
      toast.success("Upload complete");
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === E_R2_NET || e.message === E_R2_ST0) {
          toastR2DirectUploadError({ code: "cors_or_network" });
        } else if (e.message.startsWith(E_R2_HTTP)) {
          const s = e.message.slice(E_R2_HTTP.length);
          const n = Number.parseInt(s, 10);
          toastR2DirectUploadError({
            code: "http",
            status: Number.isFinite(n) ? n : 0,
          });
        } else {
          toast.error(e.message);
        }
      } else {
        toast.error("Something went wrong");
      }
      setStep("pick");
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const again = () => {
    setFile(null);
    setLink(null);
    setStep("pick");
    setProgress(0);
    setAccessPassword("");
    setShowAccessPassword(false);
    setOptionsOpen(false);
    setManualAmount("7");
    setManualUnit("days");
    setExpiryChoice("7d");
    setEncryptionMode("e2ee_client");
    clearFileInput();
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-3">
      {step === "done" && link ? (
        <div className="flex w-full flex-col items-center space-y-2 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400/90">
            {copied ? "Link copied" : "Your link"}
          </p>
          {link.includes("#k=") ? (
            <p className="text-[0.65rem] text-amber-700 dark:text-amber-300">
              This link contains the decryption key. Share only with trusted recipients.
            </p>
          ) : null}
          <div className="flex w-full gap-1.5">
            <Input
              readOnly
              value={link}
              className="h-8 min-w-0 flex-1 font-mono text-xs text-left"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="shrink-0"
              onClick={copy}
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="text-center">
            <button
              type="button"
              onClick={again}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Upload another
            </button>
          </p>
        </div>
      ) : (
        <form
          className="w-full space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            void start();
          }}
        >
          <input
            ref={inputRef}
            id={fileInputId}
            name="file"
            className="sr-only"
            type="file"
            onChange={pick}
            tabIndex={-1}
            aria-label="Choose file to upload"
          />
          {step === "upload" ? (
            <div
              className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-100/90 px-3 py-3 dark:border-zinc-700/50 dark:bg-zinc-950/30"
              aria-busy
            >
              <div className="flex items-center justify-center gap-2">
                {file ? <FileTypeIcon filename={file.name} /> : null}
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-500 dark:text-zinc-500" />
                <span className="truncate text-xs text-slate-800 dark:text-zinc-300">{file?.name}</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          ) : !file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDrag(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={cn(
                "rounded-lg border border-dashed border-slate-300 bg-slate-50/80 transition-colors dark:border-zinc-600/60 dark:bg-zinc-950/20",
                drag &&
                  "border-sky-500/50 bg-sky-50/90 dark:border-zinc-500/80 dark:bg-zinc-900/30"
              )}
            >
              <label
                htmlFor={fileInputId}
                tabIndex={0}
                className="flex cursor-pointer flex-col items-center gap-1.5 px-4 py-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-sky-400/50 dark:focus-visible:ring-offset-zinc-950"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
              >
                <div className="flex items-center justify-center rounded-full border border-slate-200 bg-white/50 p-2 dark:border-zinc-600/50 dark:bg-transparent">
                  <Upload className="h-4 w-4 text-slate-500 dark:text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                  Drag & drop a file here
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-500">One file per upload</p>
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-1.5 h-7 text-xs"
                  )}
                >
                  Browse files
                </span>
              </label>
            </div>
          ) : (
            <div
              className="flex items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 dark:border-zinc-600/50 dark:bg-zinc-950/30"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <FileTypeIcon filename={file.name} />
                <p className="min-w-0 flex-1 truncate text-xs text-slate-800 dark:text-zinc-200">
                  {file.name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label
                  htmlFor={fileInputId}
                  className="cursor-pointer text-xs text-sky-600 underline-offset-2 hover:underline dark:text-sky-400/90"
                >
                  Change
                </label>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Remove file"
                  onClick={() => {
                    setFile(null);
                    clearFileInput();
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {file && step === "pick" && (
            <>
              <div className="w-full text-center">
                <button
                  type="button"
                  onClick={() => setOptionsOpen(true)}
                  className="cursor-pointer text-xs text-slate-600 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-400"
                >
                  More options
                </button>
              </div>

              <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
                <DialogContent className="max-h-[min(90vh,32rem)] gap-0 overflow-y-auto p-4 sm:max-w-md">
                  <DialogTitle className="text-base">More options</DialogTitle>
                  <DialogDescription className="sr-only">
                    Expiry, download limit, and optional access password for this upload.
                  </DialogDescription>
                  <div className="mt-3 space-y-3 text-left text-slate-800 dark:text-zinc-200">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`${optionsFieldId}-expiry`}
                        className="text-xs text-slate-600 dark:text-zinc-400"
                      >
                        Expires
                      </Label>
                      <Select
                        value={expiryChoice}
                        onValueChange={(v) => setExpiryChoice(v as ExpiryChoice)}
                      >
                        <SelectTrigger
                          id={`${optionsFieldId}-expiry`}
                          className="h-8 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {expiryOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Choose your own</SelectItem>
                        </SelectContent>
                      </Select>
                      {expiryChoice === "custom" ? (
                        <div className="flex flex-col gap-2 pt-0.5 sm:flex-row sm:items-end">
                          <div className="min-w-0 flex-1 space-y-1">
                            <Label
                              htmlFor={`${optionsFieldId}-mamt`}
                              className="text-xs text-slate-600 dark:text-zinc-400"
                            >
                              Amount
                            </Label>
                            <Input
                              id={`${optionsFieldId}-mamt`}
                              inputMode="numeric"
                              min={1}
                              placeholder="e.g. 12"
                              value={manualAmount}
                              onChange={(e) =>
                                setManualAmount(e.target.value.replace(/[^\d]/g, ""))
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="w-full space-y-1 sm:max-w-[8.5rem]">
                            <span className="block text-xs text-slate-600 dark:text-zinc-400">
                              Unit
                            </span>
                            <Select
                              value={manualUnit}
                              onValueChange={(v) => setManualUnit(v as ManualUnit)}
                            >
                              <SelectTrigger
                                id={`${optionsFieldId}-munit`}
                                className="h-8 text-xs"
                                aria-label="Time unit"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`${optionsFieldId}-md`}
                        className="text-xs text-slate-600 dark:text-zinc-400"
                      >
                        Max downloads (optional)
                      </Label>
                      <Input
                        id={`${optionsFieldId}-md`}
                        inputMode="numeric"
                        placeholder="e.g. 10"
                        value={maxDownloads}
                        onChange={(e) => setMaxDownloads(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 dark:text-zinc-400">
                        Encryption mode
                      </Label>
                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          type="button"
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                            encryptionMode === "e2ee_client"
                              ? "border-sky-500/60 bg-sky-50/80 text-sky-900 dark:border-sky-500/50 dark:bg-sky-950/30 dark:text-sky-100"
                              : "border-slate-200/90 bg-white/80 text-slate-700 dark:border-zinc-700/60 dark:bg-zinc-950/30 dark:text-zinc-300"
                          )}
                          onClick={() => setEncryptionMode("e2ee_client")}
                        >
                          True E2EE (recommended): decryption key stays in link fragment.
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                            encryptionMode === "legacy_server"
                              ? "border-sky-500/60 bg-sky-50/80 text-sky-900 dark:border-sky-500/50 dark:bg-sky-950/30 dark:text-sky-100"
                              : "border-slate-200/90 bg-white/80 text-slate-700 dark:border-zinc-700/60 dark:bg-zinc-950/30 dark:text-zinc-300"
                          )}
                          onClick={() => setEncryptionMode("legacy_server")}
                        >
                          Legacy mode: server can decrypt for compatibility.
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`${optionsFieldId}-apw`}
                        className="text-xs text-slate-600 dark:text-zinc-400"
                      >
                        Access password (optional)
                      </Label>
                      <div className="relative">
                        <Input
                          id={`${optionsFieldId}-apw`}
                          type={showAccessPassword ? "text" : "password"}
                          name="access-password"
                          autoComplete="new-password"
                          placeholder="4+ characters; share link with people you trust"
                          value={accessPassword}
                          onChange={(e) => setAccessPassword(e.target.value)}
                          className="h-8 pr-[4.25rem] text-xs"
                        />
                        <div className="absolute right-0.5 top-1/2 flex -translate-y-1/2 items-center gap-px">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300"
                            aria-label="Copy password"
                            onClick={async () => {
                              const t = accessPassword.trim();
                              if (!t) {
                                toast.message("Enter a password to copy.");
                                return;
                              }
                              try {
                                await navigator.clipboard.writeText(t);
                                toast.success("Password copied");
                              } catch {
                                toast.error("Could not copy");
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300"
                            aria-label={
                              showAccessPassword ? "Hide password" : "Show password"
                            }
                            aria-pressed={showAccessPassword}
                            onClick={() => setShowAccessPassword((v) => !v)}
                          >
                            {showAccessPassword ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-[0.65rem] leading-snug text-slate-500 dark:text-zinc-500">
                        Recipients must enter this to download. The link alone is not enough.
                        {encryptionMode === "e2ee_client"
                          ? " In E2EE mode, the server cannot decrypt your file."
                          : " In legacy mode, the server still holds the master encryption key."}
                        {" "}Copying passwords to clipboard can expose them to clipboard history tools.
                      </p>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setOptionsOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex justify-center pt-0.5">
                <Button type="submit" size="sm" className="h-8 min-w-20 text-xs">
                  Upload
                </Button>
              </div>
            </>
          )}

        </form>
      )}
    </div>
  );
}
