import {
  getThemeArtwork,
  HEADER_SCATTER,
  HEADER_SLOTS,
  HEADER_SLOTS_NARROW,
} from "@/lib/themes/artwork/data";
import type { Theme } from "@/lib/themes/themes";
import { cn } from "@/lib/utils";
import { ArtworkLayer, type ArtworkMotif } from "./artwork-layer";

/**
 * The faint scatter of the season's icons behind the header's top row: the theme's header icons
 * on the larger slots, its filler on the small ones, in the accent colour. Fades with the
 * wordmark when the header collapses (the `group/header` data attribute).
 */
export function HeaderScatter({
  theme,
  narrow = false,
  className,
}: {
  theme: Theme;
  narrow?: boolean;
  className?: string;
}) {
  const art = getThemeArtwork(theme.id);
  const slots = narrow ? HEADER_SLOTS_NARROW : HEADER_SLOTS;
  let next = 0;
  const motifs: ArtworkMotif[] = slots.map(([x, y, size, rotate]) => ({
    icon: size >= 14 ? art.headerIcons[next++ % art.headerIcons.length] : art.headerFiller,
    x,
    y,
    size,
    rotate,
    colour: "accent",
    opacity: HEADER_SCATTER.opacity,
  }));
  return (
    <ArtworkLayer
      surface="header"
      theme={theme.id}
      motifs={motifs}
      className={cn("group-data-[collapsed=true]/header:opacity-0", className)}
    />
  );
}
