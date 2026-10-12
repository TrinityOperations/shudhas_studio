"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { HEADER_STROKE } from "@/lib/themes/artwork/data";
import { measureHeader } from "@/lib/themes/artwork/measure";
import {
  placeHeaderIcons,
  type HeaderIcon,
  type HeaderPlacement,
} from "@/lib/themes/artwork/place";
import { cn } from "@/lib/utils";
import { SeasonIcon } from "./season-icon";

type State = "both" | "top" | "small";

type Layout = { width: number; icons: HeaderPlacement[] };

/** Where an icon's centre sits across the row at the top of the page, by its anchor. */
function left(icon: HeaderIcon): string {
  if (icon.anchor === "l") return `${icon.dx}px`;
  if (icon.anchor === "r") return `calc(100% - ${icon.dx}px)`;
  return `calc(50% + ${icon.dx}px)`;
}

const COLOUR_CLASS: Record<HeaderIcon["colour"], string> = {
  a: "text-brand",
  p: "text-[var(--pop)]",
};

/** An icon shown in one state only fades out (or in) as it moves. */
const STATE_CLASS: Record<State, string> = {
  both: "",
  top: "group-data-[collapsed=true]/header:opacity-0",
  small: "opacity-0 group-data-[collapsed=true]/header:opacity-100",
};

const stateOf = (p: HeaderPlacement): State =>
  p.top && p.small ? "both" : p.top ? "top" : "small";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The season's icons behind the header's top row, edge to edge. When the header collapses
 * (`data-collapsed` on the `group/header` element) the icons left of the mark slide in from the
 * left and the icons right of the name slide in from the right, each side by half the width the
 * name gives up, over the header's 300 ms with the mark's easing. Spacing on a side stays put,
 * and the gap from the mark ends where the gap from the mark and the name began; on the way up
 * they slide back out.
 * Each icon's two transforms are written into the state selectors themselves (`--t-top`,
 * `--t-small`), so the browser sees the icon's own transform change and animates it in WebKit
 * as well as Chromium; transform and opacity only, and the global reduced-motion rule makes the
 * change instant. Placement comes from one measurement per width (measure.ts → place.ts
 * `placeHeaderIcons`); the row's height changes during the collapse but its width does not, so
 * nothing is re-placed mid-change. An icon that would meet the brand or an action in one state
 * fades out in that state. Server-rendered empty; aria-hidden, ignores the pointer.
 */
export function HeaderArtworkLayer({
  theme,
  pop,
  icons,
  className,
}: {
  theme: string;
  /** The theme's pop colour, upper-case hex */
  pop: string;
  icons: readonly HeaderIcon[];
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
      setLayout({ width: geometry.width, icons: placeHeaderIcons(icons, geometry) });
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
  }, [icons]);

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
      {layout?.icons.map((p) => {
        const icon = icons[p.index];
        const state = stateOf(p);
        const rest = `translate(-50%, -50%) rotate(${icon.rotate}deg)`;
        const moved = `translate(-50%, -50%) translate(${p.shiftX}px, ${p.shiftY}px) rotate(${icon.rotate}deg)`;
        return (
          <SeasonIcon
            key={p.index}
            name={icon.icon}
            size={icon.size}
            strokeWidth={HEADER_STROKE}
            headerState={state}
            className={cn(
              "absolute [transform:var(--t-top)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsed=true]/header:[transform:var(--t-small)]",
              COLOUR_CLASS[icon.colour],
              STATE_CLASS[state],
            )}
            style={
              {
                "--t-top": rest,
                "--t-small": moved,
                left: left(icon),
                top: p.y,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
