"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shareUrlHasE2eeKey } from "@/lib/e2ee-url";
import { isVideoFile } from "@/lib/video";
import { DISCORD_INLINE_VIDEO_MAX_BYTES } from "@/lib/video-embed";

type UploadSuccessProps = {
  link: string;
  copied: boolean;
  file: File | null;
  uploadedFileId: string | null;
  videoThumbnail: string | null;
  onCopy: () => void;
  onAgain: () => void;
};

export function UploadSuccess({
  link,
  copied,
  file,
  uploadedFileId,
  videoThumbnail,
  onCopy,
  onAgain,
}: UploadSuccessProps) {
  const isVideo = file && isVideoFile(file.name, file.type || null);

  return (
    <div className="flex w-full flex-col items-center space-y-3 text-center">
      <p className="ui-fade-up text-xs text-emerald-600 dark:text-emerald-400/90">
        {copied ? "Copied" : isVideo ? "Video ready" : "Upload complete"}
      </p>

      {shareUrlHasE2eeKey(link) ? (
        <p className="ui-fade-up ui-fade-up-delay-1 text-[0.65rem] leading-relaxed text-amber-700 dark:text-amber-300">
          This link contains the decryption key. Share only with trusted recipients.
        </p>
      ) : null}

      {videoThumbnail ? (
        <div className="ui-fade-up ui-fade-up-delay-1 w-full overflow-hidden rounded-xl border border-slate-200/90 dark:border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={videoThumbnail}
            alt="Video preview"
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : null}

      <div className="ui-fade-up ui-fade-up-delay-2 w-full space-y-1.5 text-left">
        <label className="text-xs text-slate-600 dark:text-zinc-400">Your link</label>
        <div className="flex w-full gap-1.5">
          <Input
            readOnly
            value={link}
            className="h-8 min-w-0 flex-1 font-mono text-xs"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="shrink-0"
            onClick={onCopy}
            aria-label="Copy link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {uploadedFileId && isVideo ? (
          <p className="text-[0.65rem] leading-relaxed text-slate-500 dark:text-zinc-500">
            {file!.size > DISCORD_INLINE_VIDEO_MAX_BYTES
              ? "Discord shows a thumbnail preview for clips over 50 MB."
              : "Paste in Discord to embed the video inline."}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onAgain}
        className="ui-fade-up ui-fade-up-delay-3 text-xs text-slate-500 transition-colors duration-150 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        Upload another
      </button>
    </div>
  );
}
