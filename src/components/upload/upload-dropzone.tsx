"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  fileInputId: string;
  isDragging: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

export function UploadDropzone({
  fileInputId,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: UploadDropzoneProps) {
  const dragCounter = useRef(0);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current += 1;
    onDragEnter();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) onDragLeave();
  }

  return (
    <div
      data-dragging={isDragging || undefined}
      onDragOver={onDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={onDrop}
      className={cn(
        "upload-drop rounded-xl border border-dashed",
        "border-slate-300/90 bg-slate-50/70 dark:border-zinc-700/70 dark:bg-zinc-950/25",
        isDragging && "upload-drop--active border-sky-500/45 bg-sky-50/80 shadow-[0_0_0_3px_rgba(14,165,233,0.12)] dark:border-sky-500/35 dark:bg-sky-950/25 dark:shadow-[0_0_0_3px_rgba(14,165,233,0.08)]"
      )}
    >
      <label
        htmlFor={fileInputId}
        tabIndex={0}
        className="flex cursor-pointer flex-col items-center gap-2 px-4 py-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById(fileInputId)?.click();
          }
        }}
      >
        <span className="upload-drop-icon flex items-center justify-center rounded-full border border-slate-200/90 bg-white/80 p-2.5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/80">
          <Upload
            className="h-4 w-4 text-slate-500 transition-colors duration-200 dark:text-zinc-400"
            aria-hidden
          />
        </span>
        <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
          {isDragging ? "Drop it here" : "Drag & drop a file"}
        </span>
        <span className="text-xs text-slate-500 dark:text-zinc-500">
          or{" "}
          <span className="text-sky-700 underline decoration-sky-500/30 underline-offset-2 dark:text-sky-400">
            browse
          </span>
        </span>
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-0.5 h-7 text-xs"
          )}
        >
          Choose file
        </span>
      </label>
    </div>
  );
}
