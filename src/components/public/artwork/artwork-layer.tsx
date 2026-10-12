"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Band, Hanger, Motif, MotifColour } from "@/lib/themes/artwork/data";
import { measureExclusions } from "@/lib/themes/artwork/measure";
import {
  bandHeight,
  bandPositions,
  HANGER_GAP,
  placeHangers,
  placeScatter,
  type Placed,
} from "@/lib/themes/artwork/place";
import { cn } from "@/lib/utils";
import { SeasonIcon } from "./season-icon";

export type ArtworkColour = MotifColour | "accent";

/** A motif in any of the three colours (the header scatter uses the accent). */
export type ArtworkMotif = Omit<Motif, "colour"> & { colour: ArtworkColour };

export type ArtworkLayerProps = {
  /** Which surface this is, for tests and the theme preview check */
  surface: "header" | "tag" | "footer";
  theme: string;
  /** The theme's deco colour; ivory and accent come from the tokens */
  deco?: string;
  motifs: readonly ArtworkMotif[];
  hangers?: readonly Hanger[];
  band?: Band;
  bandEdge?: "top" | "bottom";
  className?: string;
};

type Layout = {
  motifs: Placed<ArtworkMotif>[];
  hangers: Placed<Hanger>[];
  band: { left: number; top: number }[];
};

const COLOUR_CLASS: Record<ArtworkColour, string> = {
  deco: "text-[var(--deco)]",
  ivory: "text-ivory",
  accent: "text-primary",
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Stable default so the effect's dependencies do not change on every render. */
const NO_HANGERS: readonly Hanger[] = [];

/**
 * A decorative layer behind a surface's text. Server-rendered empty (no layout shift); after
 * mount it measures the surface and the elements marked `data-artwork-exclude`, keeps the motifs
 * that sit clear of them (place.ts) and fades them in. The parent must be `relative` and the
 * text must sit above it (`relative z-10`). Everything here is aria-hidden and ignores the
 * pointer; the fade is a CSS transition, so reduced motion makes it instant.
 */
export function ArtworkLayer({
  surface,
  theme,
  deco,
  motifs,
  hangers = NO_HANGERS,
  band,
  bandEdge = "bottom",
  className,
}: ArtworkLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [shown, setShown] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const place = () => {
      const size = { width: parent.clientWidth, height: parent.clientHeight };
      // A layer hidden at this breakpoint (display: none) places nothing.
      if (size.width === 0 || size.height === 0 || el.getClientRects().length === 0) {
        setLayout(null);
        return;
      }
      const strip = band ? bandHeight(band.size) : 0;
      const exclusions = measureExclusions(parent, bandEdge === "bottom" ? strip : 0);
      setLayout({
        motifs: placeScatter(motifs, size, exclusions),
        hangers: placeHangers(hangers, size, exclusions),
        band: band ? bandPositions(band.count, band.size, size, bandEdge) : [],
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [motifs, hangers, band, bandEdge]);

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
      style={deco ? ({ "--deco": deco } as CSSProperties) : undefined}
    >
      {layout?.motifs.map((m) => (
        <SeasonIcon
          key={`m${m.index}`}
          name={m.icon}
          size={m.size}
          rotate={m.rotate}
          opacity={m.opacity}
          className={cn("absolute", COLOUR_CLASS[m.colour])}
          style={{ left: m.left, top: m.top }}
        />
      ))}
      {layout?.hangers.map((h) => (
        <div
          key={`h${h.index}`}
          className={cn("absolute top-0 flex flex-col items-center", COLOUR_CLASS[h.colour])}
          style={{ left: h.left, width: h.size, opacity: h.opacity, gap: HANGER_GAP }}
        >
          <span className="block w-px bg-current" style={{ height: h.thread }} />
          {h.items.map((item, i) => (
            <SeasonIcon key={i} name={item} size={h.size} />
          ))}
        </div>
      ))}
      {band && layout
        ? layout.band.map((pos, i) => (
            <SeasonIcon
              key={`b${i}`}
              name={band.icon}
              size={band.size}
              opacity={band.opacity}
              className={cn("absolute", COLOUR_CLASS[band.colour])}
              style={{ left: pos.left, top: pos.top }}
            />
          ))
        : null}
    </div>
  );
}
