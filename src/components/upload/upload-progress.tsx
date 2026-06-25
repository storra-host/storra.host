"use client";

import { Loader2 } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";
import { Progress } from "@/components/ui/progress";

type UploadProgressProps = {
  file: File;
  previewUrl: string | null;
  label: string;
  progress: number;
};

export function UploadProgress({
  file,
  previewUrl,
  label,
  progress,
}: UploadProgressProps) {
  return (
    <div
      className="ui-fade-up space-y-2.5 rounded-xl border border-slate-200/90 bg-white/50 px-3 py-3 dark:border-zinc-800/90 dark:bg-zinc-900/40"
      aria-busy
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <FileTypeIcon
          filename={file.name}
          mimeType={file.type}
          previewUrl={previewUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-800 dark:text-zinc-200">{label}</p>
        </div>
        <Loader2
          className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-600 dark:text-sky-400"
          aria-hidden
        />
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
}
