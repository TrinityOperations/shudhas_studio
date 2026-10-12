import { getThemeArtwork, HDR } from "@/lib/themes/artwork/data";
import { resolveHeaderTable } from "@/lib/themes/artwork/place";
import type { Theme } from "@/lib/themes/themes";
import { HeaderArtworkLayer } from "./header-artwork-layer";

/**
 * The season's icons behind the header's top row, in the accent and the theme's pop colour:
 * the desktop tables from lg, the phone tables below it (`narrow`). Both sets of a width go to
 * the layer, which cross-fades them as the header collapses, so the icons stay.
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
      top={resolveHeaderTable(narrow ? HDR.phoneTop : HDR.top, art)}
      small={resolveHeaderTable(narrow ? HDR.phoneSmall : HDR.small, art)}
      className={className}
    />
  );
}
