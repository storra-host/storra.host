import Link from "next/link";

const linkClass =
  "text-xs text-slate-500 underline decoration-slate-400/50 underline-offset-2 transition hover:text-slate-800 hover:decoration-slate-500 dark:text-zinc-500 dark:decoration-zinc-600/50 dark:hover:text-zinc-300 dark:hover:decoration-zinc-500/60";

export function FooterLegalLinks() {
  return (
    <nav
      className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center"
      aria-label="Legal"
    >
      <Link href="/tos" className={linkClass}>
        Terms of Service
      </Link>
      <span className="text-xs text-slate-400 dark:text-zinc-600" aria-hidden>
        ·
      </span>
      <Link href="/aup" className={linkClass}>
        Acceptable use
      </Link>
    </nav>
  );
}
