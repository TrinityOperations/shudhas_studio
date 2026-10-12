import { getThemeArtwork, HDR } from "@/lib/themes/artwork/data";
import { resolveHeaderTable } from "@/lib/themes/artwork/place";
import type { Theme } from "@/lib/themes/themes";
import { HeaderArtworkLayer } from "./header-artwork-layer";

/**
 * The season's icons behind the header's top row, in the accent and the theme's pop colour:
 * the desktop table from lg, the phone table below it (`narrow`). The layer slides the same
 * icons in from each side as the header collapses, filling the name's room without regrouping.
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
  return (
    <HeaderArtworkLayer
      theme={theme.id}
      pop={art.pop}
      icons={resolveHeaderTable(narrow ? HDR.phoneTop : HDR.top, art)}
      className={className}
    />
  );
}
