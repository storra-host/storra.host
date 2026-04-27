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
        "w-full min-w-0 pb-12 text-left xl:grid xl:max-w-none xl:grid-cols-[minmax(0,1fr),11.5rem] xl:items-start xl:gap-x-8",
        className
      )}
    >
      <div className="min-w-0 max-w-prose">
        {header}
        <div className="mb-6 xl:hidden">
          <LegalDocumentToc sections={sections} />
        </div>
        {children}
      </div>
      <aside
        className="sticky top-3 z-[1] hidden h-fit w-full max-w-[12rem] justify-self-end self-start xl:top-4 xl:block"
        aria-label="Table of contents"
      >
        <LegalDocumentToc sections={sections} />
      </aside>
    </div>
  );
}
