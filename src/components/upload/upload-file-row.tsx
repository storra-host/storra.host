"use client";

import { X } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format-bytes";

type UploadFileRowProps = {
  file: File;
  fileInputId: string;
  previewUrl: string | null;
  onRemove: () => void;
};

export function UploadFileRow({
  file,
  fileInputId,
  previewUrl,
  onRemove,
}: UploadFileRowProps) {
  return (
    <div className="ui-fade-up rounded-xl border border-slate-200/90 bg-white/50 px-3 py-2.5 dark:border-zinc-800/90 dark:bg-zinc-900/40">
      <div className="flex items-center gap-2.5">
        <FileTypeIcon
          filename={file.name}
          mimeType={file.type}
          previewUrl={previewUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-800 dark:text-zinc-200">{file.name}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-500">{formatBytes(file.size)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <label
            htmlFor={fileInputId}
            className="cursor-pointer text-xs text-sky-700 underline-offset-2 transition-colors duration-150 hover:text-sky-900 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
          >
            Change
          </label>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-200"
            aria-label="Remove file"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
