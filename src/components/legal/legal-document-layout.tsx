import type { ReactNode } from "react";
import { LegalDocumentToc, type LegalTocSection } from "./legal-document-toc";
import { cn } from "@/lib/utils";

export function LegalDocumentLayout({
  sections,
  header,
  children,
  className,
}: {
  sections: LegalTocSection[];
  header: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 pb-12 text-left lg:flex lg:items-start lg:gap-10 xl:gap-12",
        className
      )}
    >
      <div className="min-w-0 flex-1 lg:max-w-prose">
        {header}
        <div className="mb-8 lg:hidden">
          <LegalDocumentToc sections={sections} variant="inline" />
        </div>
        {children}
      </div>
      <aside
        className="sticky top-20 z-[1] hidden w-[11.5rem] shrink-0 pt-1 lg:block"
        aria-label="Table of contents"
      >
        <LegalDocumentToc sections={sections} variant="sidebar" />
      </aside>
    </div>
  );
}
