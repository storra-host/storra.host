import Link from "next/link";
import { ChangelogIcon } from "./changelog-icon";
import { cn } from "@/lib/utils";

export function ChangelogNavLink() {
  return (
    <Link
      href="/changelog"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        "border-0 bg-transparent text-slate-600 shadow-none",
        "ring-0 ring-offset-0 outline-none",
        "hover:bg-transparent active:bg-transparent",
        "dark:text-zinc-400 dark:hover:bg-transparent dark:active:bg-transparent",
        "focus:bg-transparent focus:outline-none focus:ring-0",
        "focus-visible:bg-transparent focus-visible:ring-0",
        "transition-[color,opacity] hover:text-slate-900 dark:hover:text-zinc-100"
      )}
      title="Changelog"
      aria-label="Changelog"
    >
      <ChangelogIcon />
    </Link>
  );
}
