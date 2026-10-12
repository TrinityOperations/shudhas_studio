"use client";
import { useEffect, useState, type ReactNode } from "react";

export const HERO_SENTINEL = "data-hero-sentinel";

/**
 * Sticky header shell in two rows. One IntersectionObserver on the hero (it carries the sentinel
 * attribute) collapses the top row once the hero has scrolled out from under the header; pages
 * without a hero never collapse. The links row (desktop only) keeps its height either way, so
 * `--header-collapsed-height` in globals.css is the top row's collapsed height plus the links
 * row. The name and the artwork fade and the padding change are CSS transitions, so reduced
 * motion makes them instant through globals.css.
 */
export function HeaderChrome({ top, links }: { top: ReactNode; links?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector(`[${HERO_SENTINEL}]`);
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: "-80px 0px 0px 0px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      data-collapsed={collapsed}
      data-testid="site-header"
      className="group/header bg-paper border-line sticky top-0 z-40 box-border border-b"
    >
      <div
        data-testid="header-top"
        className="relative box-border transition-[padding] duration-300 group-data-[collapsed=false]/header:py-[18px] group-data-[collapsed=true]/header:h-[var(--header-top-collapsed-height)] group-data-[collapsed=true]/header:py-2.5"
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
    </header>
  );
}
