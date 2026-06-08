"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LegalTocSection } from "@/lib/legal-sections";

export type { LegalTocSection } from "@/lib/legal-sections";

/** Matches `scroll-mt-20` on legal document headings. */
const SCROLL_MARGIN = 80;
const TRACK_X = 7;
const BRANCH_END = 26;
const CORNER = 5;
const CLICK_LOCK_MS = 800;

type ItemGeom = {
  id: string;
  top: number;
  height: number;
  center: number;
};

function getScrollRoot(): HTMLElement | null {
  return document.querySelector("main");
}

function scrollToLegalSection(
  id: string,
  behavior: ScrollBehavior = "smooth"
) {
  const el = document.getElementById(id);
  const root = getScrollRoot();
  if (!el || !root) return;

  const rootRect = root.getBoundingClientRect();
  const targetRect = el.getBoundingClientRect();
  const top =
    root.scrollTop + (targetRect.top - rootRect.top) - SCROLL_MARGIN;

  root.scrollTo({ top: Math.max(0, top), behavior });
  history.replaceState(null, "", `#${id}`);
}

function useTocActiveId(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const clickLock = useRef<string | null>(null);
  const key = sectionIds.join("|");

  const lockActive = useCallback((id: string) => {
    clickLock.current = id;
    window.setTimeout(() => {
      if (clickLock.current === id) clickLock.current = null;
    }, CLICK_LOCK_MS);
  }, []);

  const scrollToSection = useCallback(
    (id: string) => {
      scrollToLegalSection(id);
      setActiveId(id);
      lockActive(id);
    },
    [lockActive]
  );

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const update = () => {
      if (clickLock.current) {
        setActiveId(clickLock.current);
        return;
      }

      const root = getScrollRoot();
      if (!root) return;

      const rootTop = root.getBoundingClientRect().top;
      let current = sectionIds[0] ?? "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const relativeTop = el.getBoundingClientRect().top - rootTop;
        if (relativeTop <= SCROLL_MARGIN) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    update();

    const root = getScrollRoot();
    if (root) {
      root.addEventListener("scroll", update, { passive: true });
    } else {
      window.addEventListener("scroll", update, { passive: true, capture: true });
    }
    window.addEventListener("resize", update, { passive: true });

    const onHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || !sectionIds.includes(hash)) return;
      scrollToLegalSection(hash, "auto");
      setActiveId(hash);
      lockActive(hash);
    };
    onHash();
    window.addEventListener("hashchange", onHash);

    return () => {
      if (root) {
        root.removeEventListener("scroll", update);
      } else {
        window.removeEventListener("scroll", update, { capture: true });
      }
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", onHash);
    };
  }, [key, sectionIds, lockActive]);

  return { activeId, scrollToSection };
}

/** Curved elbow from spine → label (matches docs-style TOC rails). */
function branchPath(centerY: number): string {
  const y = centerY;
  return `M ${TRACK_X} ${y} C ${TRACK_X + 1.5} ${y}, ${TRACK_X + CORNER} ${y}, ${BRANCH_END} ${y}`;
}

function TocTrack({
  items,
  activeId,
  height,
}: {
  items: ItemGeom[];
  activeId: string;
  height: number;
}) {
  if (items.length === 0 || height < 1) return null;

  const first = items[0].center;
  const last = items[items.length - 1].center;
  const activeIdx = Math.max(
    0,
    items.findIndex((i) => i.id === activeId)
  );
  const active = items[activeIdx] ?? items[0];
  const activeTop =
    activeIdx > 0
      ? (items[activeIdx - 1].center + active.center) / 2
      : active.top + 2;
  const activeBottom =
    activeIdx < items.length - 1
      ? (active.center + items[activeIdx + 1].center) / 2
      : active.top + active.height - 2;

  const spinePath = `M ${TRACK_X} ${first} L ${TRACK_X} ${last}`;
  const activeSpinePath = `M ${TRACK_X} ${activeTop} L ${TRACK_X} ${activeBottom}`;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 w-7 overflow-visible text-zinc-300 dark:text-zinc-700/90"
      width={28}
      height={height}
      aria-hidden
    >
      <path
        d={spinePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
      />
      {items.map((item) => (
        <path
          key={item.id}
          d={branchPath(item.center)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="round"
          className={
            item.id === activeId
              ? "text-amber-600 dark:text-amber-400"
              : undefined
          }
        />
      ))}
      <path
        d={activeSpinePath}
        fill="none"
        className="text-amber-600 dark:text-amber-400"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function TocList({
  sections,
  activeId,
  onNavigate,
  className,
}: {
  sections: LegalTocSection[];
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [items, setItems] = useState<ItemGeom[]>([]);
  const [trackHeight, setTrackHeight] = useState(0);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const list = listRef.current;
    if (!container || !list) return;

    const containerTop = container.getBoundingClientRect().top;
    const geom: ItemGeom[] = [];

    for (const s of sections) {
      const el = list.querySelector<HTMLElement>(`[data-toc-id="${s.id}"]`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const top = rect.top - containerTop;
      geom.push({
        id: s.id,
        top,
        height: rect.height,
        center: top + rect.height / 2,
      });
    }

    setItems(geom);
    setTrackHeight(container.offsetHeight);
  }, [sections]);

  useLayoutEffect(() => {
    measure();
  }, [measure, activeId]);

  useEffect(() => {
    measure();
    const container = containerRef.current;
    const list = listRef.current;
    if (!container || !list) return;

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(list);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div ref={containerRef} className={cn("relative pl-7", className)}>
      <TocTrack items={items} activeId={activeId} height={trackHeight} />
      <ul ref={listRef} className="relative space-y-1" role="list">
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                data-toc-id={s.id}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(s.id);
                }}
                className={cn(
                  "block py-1 pr-1 text-left text-[0.8125rem] leading-snug transition-colors duration-150 ease-out",
                  isActive
                    ? "font-medium text-amber-700 dark:text-amber-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                )}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LegalDocumentToc({
  sections,
  className,
  variant = "sidebar",
}: {
  sections: LegalTocSection[];
  className?: string;
  variant?: "sidebar" | "inline";
}) {
  const ids = sections.map((s) => s.id);
  const { activeId, scrollToSection } = useTocActiveId(ids);

  return (
    <nav className={cn("text-left", className)} aria-label="On this page">
      <p
        className={cn(
          "mb-4 flex items-center gap-2 text-zinc-500 dark:text-zinc-500",
          variant === "sidebar" ? "text-sm" : "text-xs uppercase tracking-widest"
        )}
      >
        <Menu
          className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
          aria-hidden
        />
        On this page
      </p>
      <TocList
        sections={sections}
        activeId={activeId}
        onNavigate={scrollToSection}
      />
    </nav>
  );
}
