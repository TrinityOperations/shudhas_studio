"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type {
  Band,
  Hanger,
  Motif,
  MotifColour,
  OpacityTiers,
  PoolSlot,
} from "@/lib/themes/artwork/data";
import type { SeasonIconName } from "@/lib/themes/artwork/icons";
import { measureExclusions } from "@/lib/themes/artwork/measure";
import {
  layoutSurface,
  motifStroke,
  type BandLayout,
  type SurfaceLayout,
} from "@/lib/themes/artwork/place";
import { cn } from "@/lib/utils";
import { SeasonIcon } from "./season-icon";

export type ArtworkLayerProps = {
  /** Which surface this is, for tests and the theme preview check */
  surface: "tag" | "footer";
  theme: string;
  /** The theme's deco colour; ivory comes from the tokens */
  deco: string;
  /** Below lg: the phone pool, no hangers, the smaller hero (chosen by the caller) */
  compact?: boolean;
  pool: readonly PoolSlot[];
  /** Icons that must all appear */
  set: readonly SeasonIconName[];
  filler: SeasonIconName;
  /** Slots past the set smaller than this get the filler */
  fillerBelow: number;
  tiers: OpacityTiers;
  hero: Motif | null;
  hangers?: readonly Hanger[];
  band: Band;
  bandLayout: BandLayout;
  className?: string;
};

export const COLOUR_CLASS: Record<MotifColour, string> = {
  deco: "text-[var(--deco)]",
  ivory: "text-ivory",
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Stable default so the effect's dependencies do not change on every render. */
const NO_HANGERS: readonly Hanger[] = [];

/**
 * A decorative layer behind the tag's or the footer's text. Server-rendered empty (no layout
 * shift); after mount it measures the surface and the elements marked `data-artwork-exclude`,
 * lays the theme's artwork out with `layoutSurface` (place.ts: hero and hangers clear of text,
 * then the pool's surviving slots take the set, biggest first) and fades it in. The parent must
 * be `relative` and the text must sit above it (`relative z-10`). Everything here is aria-hidden
 * and ignores the pointer; the fade is a CSS transition, so reduced motion makes it instant.
 */
export function ArtworkLayer({
  surface,
  theme,
  deco,
  compact = false,
  pool,
  set,
  filler,
  fillerBelow,
  tiers,
  hero,
  hangers = NO_HANGERS,
  band,
  bandLayout,
  className,
}: ArtworkLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const warned = useRef("");
  const [layout, setLayout] = useState<SurfaceLayout | null>(null);
  const [shown, setShown] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const place = () => {
      const box = { width: parent.clientWidth, height: parent.clientHeight };
      // A layer hidden at this breakpoint (display: none) places nothing.
      if (box.width === 0 || box.height === 0 || el.getClientRects().length === 0) {
        setLayout(null);
        return;
      }
      const next = layoutSurface({
        box,
        text: measureExclusions(parent),
        pool,
        set,
        filler,
        fillerBelow,
        tiers,
        hero,
        hangers: compact ? NO_HANGERS : hangers,
        band,
        bandLayout,
      });
      const key = next.missing.join(",");
      if (process.env.NODE_ENV !== "production" && key && warned.current !== key) {
        console.warn(
          `Seasonal artwork: no room on the ${surface} (${theme}${compact ? ", below lg" : ""}) at ${Math.round(box.width)}px for ${key}`,
        );
      }
      warned.current = key;
      setLayout(next);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [
    surface,
    theme,
    compact,
    pool,
    set,
    filler,
    fillerBelow,
    tiers,
    hero,
    hangers,
    band,
    bandLayout,
  ]);

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
      data-surface={surface}
      data-artwork-theme={theme}
      data-placed={layout ? "true" : "false"}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-500 select-none",
        shown ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ "--deco": deco } as CSSProperties}
    >
      {layout?.hero ? (
        <SeasonIcon
          name={layout.hero.icon}
          size={layout.hero.size}
          rotate={layout.hero.rotate}
          opacity={layout.hero.opacity}
          strokeWidth={motifStroke(layout.hero.size)}
          className={cn("absolute", COLOUR_CLASS[layout.hero.colour])}
          style={{ left: layout.hero.left, top: layout.hero.top }}
        />
      ) : null}
      {layout?.motifs.map((m) => (
        <SeasonIcon
          key={`m${m.index}`}
          name={m.icon}
          size={m.size}
          rotate={m.rotate}
          opacity={m.opacity}
          strokeWidth={motifStroke(m.size)}
          className={cn("absolute", COLOUR_CLASS[m.colour])}
          style={{ left: m.left, top: m.top }}
        />
      ))}
      {layout?.hangers.map((h) => (
        <div
          key={`h${h.index}`}
          className={cn("absolute top-0 flex flex-col items-center", COLOUR_CLASS[h.colour])}
          style={{ left: h.left, width: h.size, opacity: h.opacity }}
        >
          <span className="bg-ivory/55 block w-[1.5px]" style={{ height: h.thread }} />
          {h.items.map((item, i) => (
            <SeasonIcon key={i} name={item} size={h.size} strokeWidth={motifStroke(h.size)} />
          ))}
        </div>
      ))}
      {layout?.band.map((pos, i) => (
        <SeasonIcon
          key={`b${i}`}
          name={band.icon}
          size={band.size}
          opacity={band.opacity}
          strokeWidth={motifStroke(band.size)}
          className={cn("absolute", COLOUR_CLASS[band.colour])}
          style={{ left: pos.left, top: pos.top }}
        />
      ))}
    </div>
  );
}
