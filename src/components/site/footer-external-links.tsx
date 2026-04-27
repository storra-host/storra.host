import { siX } from "simple-icons";
import { cn } from "@/lib/utils";
import { sanitizeExternalHttpsUrl } from "@/lib/safe-url";

const ghostIcon = cn(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
  "border-0 bg-transparent text-slate-600 shadow-none",
  "ring-0 ring-offset-0 outline-none",
  "hover:bg-transparent active:bg-transparent",
  "dark:text-zinc-400 dark:hover:bg-transparent dark:active:bg-transparent",
  "focus:bg-transparent focus:outline-none focus:ring-0",
  "focus-visible:bg-transparent focus-visible:ring-0",
  "transition-[color,opacity] hover:text-slate-900 dark:hover:text-zinc-100"
);

function BrandGlyph({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path fill="currentColor" d={path} />
    </svg>
  );
}

export function FooterExternalLinks() {
  const x = sanitizeExternalHttpsUrl(process.env.NEXT_PUBLIC_X_URL);

  if (!x) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        className={ghostIcon}
        aria-label={`X - ${siX.title}`}
        title="X"
      >
        <BrandGlyph path={siX.path} />
      </a>
    </div>
  );
}
