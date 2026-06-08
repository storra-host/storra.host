"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  src: string | null;
  poster?: string | null;
  title?: string;
  className?: string;
  minimal?: boolean;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  poster,
  title,
  className,
  minimal = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowSpeedMenu(false);
    }, 2800);
  }, [clearHideTimer]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (playing) scheduleHide();
  }, [playing, scheduleHide]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  const seekTo = useCallback((clientX: number) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !Number.isFinite(v.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    const onPlay = () => {
      setPlaying(true);
      scheduleHide();
    };
    const onPause = () => {
      setPlaying(false);
      setShowControls(true);
      clearHideTimer();
    };
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onVolume = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("volumechange", onVolume);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("volumechange", onVolume);
    };
  }, [src, scheduleHide, clearHideTimer]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
  }, [rate, src]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  if (!src) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-black text-sm text-zinc-400",
          className
        )}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparing video…
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full overflow-hidden bg-black",
        minimal ? "rounded-none" : "rounded-xl",
        className
      )}
      onMouseMove={revealControls}
      onMouseLeave={() => {
        if (playing) {
          clearHideTimer();
          hideTimer.current = setTimeout(() => setShowControls(false), 600);
        }
      }}
    >
      <video
        ref={videoRef}
        className="aspect-video h-auto w-full max-h-[min(85vh,calc(100vw*9/16))] bg-black object-contain"
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="auto"
        aria-label={title?.trim() || "Video player"}
        onClick={togglePlay}
      />

      {buffering ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <Loader2 className="h-10 w-10 animate-spin text-white/90" />
        </div>
      ) : null}

      {!playing && !buffering ? (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform duration-150 ease-out hover:scale-105"
          aria-label="Play"
        >
          <Play className="ml-1 h-7 w-7 fill-current" />
        </button>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-10 transition-opacity duration-200 ease-out sm:px-4 sm:pb-4",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          ref={progressRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
          className="group/progress mb-3 h-1.5 cursor-pointer rounded-full bg-white/25"
          onClick={(e) => seekTo(e.clientX)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") seekBy(-5);
            if (e.key === "ArrowRight") seekBy(5);
          }}
        >
          <div
            className="relative h-full rounded-full bg-white transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/progress:opacity-100" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-white sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded p-1 transition-colors hover:bg-white/15"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="hidden rounded p-1 transition-colors hover:bg-white/15 sm:block"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => seekBy(10)}
            className="hidden rounded p-1 transition-colors hover:bg-white/15 sm:block"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = !v.muted;
            }}
            className="rounded p-1 transition-colors hover:bg-white/15"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          <span className="min-w-[4.5rem] text-xs tabular-nums text-white/90 sm:text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="rounded px-2 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-white/15 sm:text-sm"
            >
              {rate === 1 ? "1x" : `${rate}x`}
            </button>
            {showSpeedMenu ? (
              <div className="absolute bottom-full right-0 mb-2 min-w-[7rem] rounded-lg border border-white/10 bg-zinc-900/95 py-1 shadow-xl backdrop-blur-sm">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setRate(s);
                      setShowSpeedMenu(false);
                    }}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/10",
                      rate === s ? "text-amber-400" : "text-white/90"
                    )}
                  >
                    {s === 1 ? "Normal" : `${s}x`}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded p-1 transition-colors hover:bg-white/15"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
