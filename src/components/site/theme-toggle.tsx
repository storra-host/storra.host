"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const KEY = "storra-theme";

function getSnapshot() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot() {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  const el = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function ThemeToggle({ className }: { className?: string }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = mode === "dark";

  const setTheme = useCallback((next: "light" | "dark") => {
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(KEY, next);
    } catch {
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        "border-0 bg-transparent text-slate-600 shadow-none",
        "ring-0 ring-offset-0 outline-none",
        "hover:bg-transparent active:bg-transparent",
        "dark:text-zinc-400 dark:hover:bg-transparent dark:active:bg-transparent",
        "focus:bg-transparent focus:outline-none focus:ring-0",
        "focus-visible:bg-transparent focus-visible:ring-0",
        "transition-[color,opacity] hover:text-slate-900 dark:hover:text-zinc-100",
        className
      )}
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
