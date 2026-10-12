"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export const HERO_SENTINEL = "data-hero-sentinel";

/** How far (px) below the header line the hero's bottom must be before the header expands. */
export const HEADER_EXPAND_GAP = 48;

const CollapsedContext = createContext(false);

/** Whether the public header is collapsed (false outside the header). */
export function useHeaderCollapsed(): boolean {
  return useContext(CollapsedContext);
}

/**
 * Sticky header shell in two rows. The sticky box keeps one height in both states
 * (`--header-box-height`: the expanded top row, the links row from lg and the border), so the page
 * below never moves; it is transparent and lets clicks through. Inside it one bar carries the
 * paper, the border and both rows, and only its top row changes height, between two fixed
 * heights over 300 ms, so the visible collapsed bar is `--header-collapsed-height`.
 *
 * Two IntersectionObservers on the hero (it carries the sentinel attribute) give the change
 * some hysteresis, with no scroll listeners: the header collapses once the hero's bottom is
 * above the header line, and expands only once it is `HEADER_EXPAND_GAP` px below it; in between
 * the state holds. The line is the header box's measured height, re-measured on resize. On load
 * the state comes from the expand observer's first report. Pages without a hero never collapse.
 * The name's fade, the mark's move (header-mark.tsx), the icons and the row's height are
 * transitions that reduced motion makes instant.
 */
export function HeaderChrome({ top, links }: { top: ReactNode; links?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const header = ref.current;
    const hero = document.querySelector(`[${HERO_SENTINEL}]`);
    if (!header || !hero) return;
    let observers: IntersectionObserver[] = [];
    let line = -1;
    let started = false;
    const watch = () => {
      const height = Math.round(header.getBoundingClientRect().height);
      if (height === line) return;
      line = height;
      for (const observer of observers) observer.disconnect();
      const collapseAt = new IntersectionObserver(
        ([entry]) => {
          if (started && !entry.isIntersecting) setCollapsed(true);
        },
        { rootMargin: `-${height}px 0px 0px 0px` },
      );
      const expandAt = new IntersectionObserver(
        ([entry]) => {
          if (!started) {
            started = true;
            setCollapsed(!entry.isIntersecting);
          } else if (entry.isIntersecting) {
            setCollapsed(false);
          }
        },
        { rootMargin: `-${height + HEADER_EXPAND_GAP}px 0px 0px 0px` },
      );
      collapseAt.observe(hero);
      expandAt.observe(hero);
      observers = [collapseAt, expandAt];
    };
    watch();
    const resize = new ResizeObserver(watch);
    resize.observe(header);
    return () => {
      resize.disconnect();
      for (const observer of observers) observer.disconnect();
    };
  }, []);

  return (
    <CollapsedContext.Provider value={collapsed}>
      <header
        ref={ref}
        data-collapsed={collapsed}
        data-testid="site-header"
        className="group/header pointer-events-none sticky top-0 z-40 h-[var(--header-box-height)]"
      >
        <div data-testid="header-bar" className="bg-paper border-line pointer-events-auto border-b">
          <div
            data-testid="header-top"
            className="relative flex h-[var(--header-top-height)] items-center transition-[height] duration-300 group-data-[collapsed=true]/header:h-[var(--header-top-collapsed-height)]"
          >
            {top}
          </div>
          {links ? (
            <div
              data-testid="header-links"
              className="border-line hidden h-[var(--header-links-height)] border-t lg:block"
            >
              {links}
            </div>
          ) : null}
        </div>
      </header>
    </CollapsedContext.Provider>
  );
}
