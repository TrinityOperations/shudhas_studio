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
 * The seasonal banner's motifs: hangers from the top edge, a pattern band along the bottom, the
 * large signature motif and the shared slot pool carrying every icon in the theme's set, all
 * clipped by the tag's shape and kept off the text (the banner marks its block
 * `data-artwork-exclude="lines"`: each line and the button). One layer from lg up, one below
 * it with the phone pool, no hangers, a smaller hero and a shorter band; each places nothing
 * while hidden.
 */
export async function TagArtwork() {
  const theme = await getPageTheme();
  const art = getThemeArtwork(theme.id);
  const shared = {
    surface: "tag",
    theme: theme.id,
    deco: art.deco,
    set: art.set,
    filler: art.headerFiller,
    tiers: POOL_OPACITY.tag,
  } as const;
  const layout = BAND_LAYOUT.tag;
  const bandLayout = (compact: boolean) => ({
    edge: layout.edge,
    inset: layout.inset,
    padding: compact ? layout.padding.compact : layout.padding.wide,
  });
  return (
    <>
      <ArtworkLayer
        {...shared}
        pool={POOLS.tag}
        fillerBelow={POOL_FILLER_BELOW.wide}
        hero={art.tag.hero}
        hangers={art.tag.hangers}
        band={art.tag.band}
        bandLayout={bandLayout(false)}
        className="hidden lg:block"
      />
      <ArtworkLayer
        {...shared}
        compact
        pool={POOLS.tagPhone}
        fillerBelow={POOL_FILLER_BELOW.compact}
        hero={compactHero("tag", art.tag.hero)}
        band={{ ...art.tag.band, count: layout.compactCount }}
        bandLayout={bandLayout(true)}
        className="lg:hidden"
      />
    </>
  );
}
