"use client";
import { usePathname } from "next/navigation";
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
 * The public layout keeps this header across routes, so the observers re-bind on `pathname`.
 * On the home page two IntersectionObservers on the hero (it carries the sentinel attribute)
 * give the change some hysteresis, with no scroll listeners: the header collapses once the
 * hero's bottom is above the header line, and expands only once it is `HEADER_EXPAND_GAP` px
 * below it; in between the state holds. The line is the header box's measured height,
 * re-measured on resize. On load the state comes from the expand observer's first report.
 * On every other page the same change happens once the page is scrolled halfway (the midpoint
 * of the scrollable range, with the same 48px of hysteresis on the way back). Coming back to
 * the top of a page, or to the home hero, expands again. The name's fade, the mark's move
 * (header-mark.tsx), the icons and the row's height are transitions that reduced motion makes
 * instant.
 */
export function HeaderChrome({ top, links }: { top: ReactNode; links?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    // Key off the route, not a DOM query: the hero is gone (or not yet mounted) in the
    // same tick as a client navigation, and a leftover query would bind the wrong mode.
    if (pathname !== "/") {
      const fromScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) {
          setCollapsed(false);
          return;
        }
        const mid = max / 2;
        const y = window.scrollY;
        setCollapsed((was) => (was ? y > mid - HEADER_EXPAND_GAP : y >= mid));
      };
      fromScroll();
      window.addEventListener("scroll", fromScroll, { passive: true });
      window.addEventListener("resize", fromScroll);
      const resize = new ResizeObserver(fromScroll);
      resize.observe(document.body);
      return () => {
        window.removeEventListener("scroll", fromScroll);
        window.removeEventListener("resize", fromScroll);
        resize.disconnect();
      };
    }

    let cancelled = false;
    let observers: IntersectionObserver[] = [];
    let resize: ResizeObserver | undefined;
    let line = -1;
    let started = false;
    const bind = (hero: Element) => {
      if (cancelled) return;
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
      resize = new ResizeObserver(watch);
      resize.observe(header);
    };

    // Coming home, the hero can mount after this effect. Wait for it, then bind.
    const hero = document.querySelector(`[${HERO_SENTINEL}]`);
    if (hero) {
      bind(hero);
      return () => {
        cancelled = true;
        resize?.disconnect();
        for (const observer of observers) observer.disconnect();
      };
    }
    const waiting = new MutationObserver(() => {
      const found = document.querySelector(`[${HERO_SENTINEL}]`);
      if (!found) return;
      waiting.disconnect();
      bind(found);
    });
    waiting.observe(document.body, { childList: true, subtree: true });
    queueMicrotask(() => {
      if (!cancelled) setCollapsed(false);
    });
    return () => {
      cancelled = true;
      waiting.disconnect();
      resize?.disconnect();
      for (const observer of observers) observer.disconnect();
    };
  }, [pathname]);

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
