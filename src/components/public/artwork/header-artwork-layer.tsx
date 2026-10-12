"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { HEADER_STROKE } from "@/lib/themes/artwork/data";
import { measureHeader } from "@/lib/themes/artwork/measure";
import {
  headerFrames,
  headerOffset,
  placeHeader,
  type HeaderIcon,
} from "@/lib/themes/artwork/place";
import { cn } from "@/lib/utils";
import { SeasonIcon } from "./season-icon";

type SetName = "top" | "small";

type Layout = { width: number } & Record<SetName, { anchorY: number; kept: number[] }>;

/** Where an icon's centre sits across the row, by its anchor. */
function left(icon: HeaderIcon): string {
  if (icon.anchor === "l") return `${icon.dx}px`;
  if (icon.anchor === "r") return `calc(100% - ${icon.dx}px)`;
  return `calc(50% + ${icon.dx}px)`;
}

const COLOUR_CLASS: Record<HeaderIcon["colour"], string> = {
  a: "text-brand",
  p: "text-[var(--pop)]",
};

/**
 * The cross-fade's slide, as a share of the icon's distance from the row's centre, and its
 * scale: the top set slides 40% in at 0.8 as it fades out; the small set comes in from 30%
 * further out at 1.1. [at the top of the page, once collapsed]
 */
const MOTION: Record<
  SetName,
  [{ slide: number; scale: number }, { slide: number; scale: number }]
> = {
  top: [
    { slide: 0, scale: 1 },
    { slide: -0.4, scale: 0.8 },
  ],
  small: [
    { slide: 0.3, scale: 1.1 },
    { slide: 0, scale: 1 },
  ],
};

function transform(offset: number, rotate: number, m: { slide: number; scale: number }): string {
  return `translate(-50%, -50%) translateX(${offset * m.slide}px) scale(${m.scale}) rotate(${rotate}deg)`;
}

/** Each set's opacity follows the header's state; each icon's transform is set per state below. */
const SET_CLASS: Record<SetName, string> = {
  top: "group-data-[collapsed=true]/header:opacity-0",
  small: "opacity-0 group-data-[collapsed=true]/header:opacity-100",
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The season's icons behind the header's top row, in two sets: `top` while the page is at the
 * top, `small` once the header has collapsed (`data-collapsed` on the `group/header` element).
 * Both are placed once per width from one measurement (measure.ts → headerFrames), each against
 * its own state's row and brand (with or without the name), on that row's centre line, and
 * cross-faded with a slide over the header's 300 ms. Each icon's two transforms are written into
 * the state selectors themselves (`--t-top`, `--t-small`), so the browser sees the icon's own
 * transform change and animates it in WebKit as well as Chromium; opacity and transform only,
 * and the global reduced-motion rule makes both instant. The row's height changes during the
 * collapse, but its width does not, so nothing is re-placed mid-change. A dropped icon is simply
 * gone. Server-rendered empty; everything is aria-hidden and ignores the pointer.
 */
export function HeaderArtworkLayer({
  theme,
  pop,
  top,
  small,
  className,
}: {
  theme: string;
  /** The theme's pop colour, upper-case hex */
  pop: string;
  top: readonly HeaderIcon[];
  small: readonly HeaderIcon[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [shown, setShown] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const row = el?.parentElement;
    if (!el || !row) return;
    let width = -1;
    const place = (force: boolean) => {
      const geometry = el.getClientRects().length ? measureHeader(row) : null;
      if (!geometry) {
        width = -1;
        setLayout(null);
        return;
      }
      // Only a new width (or late fonts) re-places: height-only resizes are the collapse.
      if (!force && geometry.width === width) return;
      width = geometry.width;
      const frames = headerFrames(geometry);
      setLayout({
        width: geometry.width,
        top: { anchorY: frames.top.anchorY, kept: placeHeader(top, frames.top) },
        small: { anchorY: frames.small.anchorY, kept: placeHeader(small, frames.small) },
      });
    };
    place(true);
    const observer = new ResizeObserver(() => place(false));
    observer.observe(row);
    let live = true;
    void document.fonts?.ready.then(() => live && place(true));
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [top, small]);

  useEffect(() => {
    if (!layout) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [layout]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="artwork-layer"
      data-surface="header"
      data-artwork-theme={theme}
      data-placed={layout ? "true" : "false"}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-500 select-none",
        shown ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ "--pop": pop } as CSSProperties}
    >
      {layout
        ? (["top", "small"] as const).map((name) => (
            <div
              key={name}
              data-header-set={name}
              className={cn("absolute inset-0 transition-opacity duration-300", SET_CLASS[name])}
            >
              {layout[name].kept.map((i) => {
                const icon = (name === "top" ? top : small)[i];
                const offset = headerOffset(icon, layout.width);
                const [atTop, collapsed] = MOTION[name];
                return (
                  <SeasonIcon
                    key={i}
                    name={icon.icon}
                    size={icon.size}
                    strokeWidth={HEADER_STROKE}
                    className={cn(
                      "absolute [transform:var(--t-top)] transition-transform duration-300 group-data-[collapsed=true]/header:[transform:var(--t-small)]",
                      COLOUR_CLASS[icon.colour],
                    )}
                    style={
                      {
                        "--t-top": transform(offset, icon.rotate, atTop),
                        "--t-small": transform(offset, icon.rotate, collapsed),
                        left: left(icon),
                        top: layout[name].anchorY + icon.dy,
                      } as CSSProperties
                    }
                  />
                );
              })}
            </div>
          ))
        : null}
    </div>
  );
}
