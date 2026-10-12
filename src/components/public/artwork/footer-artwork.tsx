import {
  BAND_LAYOUT,
  getThemeArtwork,
  POOL_FILLER_BELOW,
  POOL_OPACITY,
  POOLS,
} from "@/lib/themes/artwork/data";
import { compactHero } from "@/lib/themes/artwork/place";
import { getPageTheme } from "@/lib/themes/active";
import { ArtworkLayer } from "./artwork-layer";

/**
 * The footer's fainter motifs: its large motif, hangers, a pattern band along the top edge and
 * the shared slot pool carrying every icon in the theme's set, clear of the link columns and
 * the bottom line. One layer from lg up, one below it with the phone pool and a shorter band.
 */
export async function FooterArtwork() {
  const theme = await getPageTheme();
  const art = getThemeArtwork(theme.id);
  const shared = {
    surface: "footer",
    theme: theme.id,
    deco: art.deco,
    set: art.set,
    filler: art.headerFiller,
    tiers: POOL_OPACITY.footer,
  } as const;
  const layout = BAND_LAYOUT.footer;
  const bandLayout = (compact: boolean) => ({
    edge: layout.edge,
    inset: layout.inset,
    padding: compact ? layout.padding.compact : layout.padding.wide,
  });
  return (
    <>
      <ArtworkLayer
        {...shared}
        pool={POOLS.foot}
        fillerBelow={POOL_FILLER_BELOW.wide}
        hero={art.footer.hero}
        hangers={art.footer.hangers}
        band={art.footer.band}
        bandLayout={bandLayout(false)}
        className="hidden lg:block"
      />
      <ArtworkLayer
        {...shared}
        compact
        pool={POOLS.footPhone}
        fillerBelow={POOL_FILLER_BELOW.compact}
        hero={compactHero("footer", art.footer.hero)}
        band={{ ...art.footer.band, count: layout.compactCount }}
        bandLayout={bandLayout(true)}
        className="lg:hidden"
      />
    </>
  );
}
