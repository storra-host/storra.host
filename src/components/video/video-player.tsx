"use client";

import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  src: string | null;
  poster?: string | null;
  title?: string;
  className?: string;
  minimal?: boolean;
};

export function VideoPlayer({
  src,
  poster,
  title,
  className,
  minimal = false,
}: VideoPlayerProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-lg bg-black/90 text-sm text-zinc-400",
          className
        )}
      >
        Preparing video…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-black",
        minimal ? "rounded-none" : "rounded-lg shadow-2xl ring-1 ring-white/10",
        className
      )}
    >
      <video
        className="aspect-video h-auto w-full max-h-[min(80vh,720px)] bg-black object-contain"
        src={src}
        poster={poster ?? undefined}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        aria-label={title?.trim() || "Video player"}
      />
    </div>
  );
}
