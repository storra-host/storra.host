import { AnnouncementBar } from "./announcement-bar";
import { StorageDisclaimer } from "./disclaimer";
import { FooterExternalLinks } from "./footer-external-links";
import { FooterLegalLinks } from "./footer-legal-links";
import { BugReportButton } from "./bug-report-button";
import { ChangelogNavLink } from "./changelog-nav-link";
import { NavExternalLinks } from "./nav-external-links";
import { ThemeToggle } from "./theme-toggle";

export function SiteShell({
  children,
  showBugReport = false,
}: {
  children: React.ReactNode;
  showBugReport?: boolean;
}) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <AnnouncementBar />
      <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="absolute right-3 top-3 z-10 flex max-w-[min(100%-1rem,calc(100vw-1.5rem))] flex-wrap items-center justify-end gap-x-0.5 gap-y-0.5 sm:right-4 sm:top-4 sm:gap-1">
          <NavExternalLinks />
          <ChangelogNavLink />
          {showBugReport ? <BugReportButton /> : null}
          <ThemeToggle />
        </div>
        <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
            {children}
          </div>
        </main>
        <footer className="shrink-0 border-t border-slate-200/90 py-2.5 text-center sm:py-3 dark:border-zinc-800/90">
          <div className="mx-auto max-w-md px-4">
            <StorageDisclaimer className="text-xs text-slate-500 dark:text-zinc-500" />
            <FooterLegalLinks />
            <FooterExternalLinks />
          </div>
        </footer>
      </div>
    </div>
  );
}
