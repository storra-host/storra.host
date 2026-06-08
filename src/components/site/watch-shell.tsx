import Link from "next/link";

export function WatchShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-zinc-300 transition-colors duration-150 ease-out hover:text-white"
        >
          storra.host
        </Link>
      </header>
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center p-5 sm:p-8">
        {children}
      </main>
    </div>
  );
}

export function EmbedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col bg-black text-zinc-100">
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
