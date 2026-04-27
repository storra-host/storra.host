"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LegalTocSection } from "@/lib/legal-sections";

export type { LegalTocSection } from "@/lib/legal-sections";

function useTocActiveId(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const key = sectionIds.join("|");

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const update = () => {
      const y = 120;
      let current = sectionIds[0] ?? "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= y) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    update();

    const main = document.querySelector("main");
    if (main) {
      main.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      return () => {
        main.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    }

    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [key, sectionIds]);

  return activeId;
}

function TocList({
  sections,
  activeId,
  className,
}: {
  sections: LegalTocSection[];
  activeId: string;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)} role="list">
      {sections.map((s) => {
        const isActive = activeId === s.id;
        return (
          <li key={s.id} className="relative">
            <a
              href={`#${s.id}`}
              className={cn(
                "relative block border-l-2 py-0.5 pl-3 pr-0 text-left text-[0.7rem] leading-snug transition-colors",
                isActive
                  ? "border-zinc-300 font-medium text-zinc-900 dark:border-zinc-200 dark:text-zinc-100"
                  : "border-zinc-200/30 text-zinc-500 hover:text-zinc-800 dark:border-zinc-700/50 dark:text-zinc-500 dark:hover:text-zinc-200"
              )}
            >
              {isActive ? (
                <span
                  className="absolute left-0 top-[0.4rem] size-1.5 -translate-x-1/2 rotate-45 bg-zinc-300 dark:bg-zinc-200"
                  aria-hidden
                />
              ) : null}
              {s.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function LegalDocumentToc({
  sections,
  className,
}: {
  sections: LegalTocSection[];
  className?: string;
}) {
  const ids = sections.map((s) => s.id);
  const activeId = useTocActiveId(ids);

  return (
    <nav
      className={cn("text-left", className)}
      aria-label="On this page"
    >
      <p className="mb-3 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">
        <Menu className="size-3 shrink-0 text-zinc-500" aria-hidden />
        On this page
      </p>
      <TocList sections={sections} activeId={activeId} />
    </nav>
  );
}
