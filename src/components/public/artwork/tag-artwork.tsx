import { getThemeArtwork } from "@/lib/themes/artwork/data";
import { getPageTheme } from "@/lib/themes/active";
import { ArtworkLayer } from "./artwork-layer";

/**
 * The seasonal banner's motifs: hangers from the top edge, a pattern band along the bottom, a
 * large signature motif and a scatter, all clipped by the tag's shape and kept out of the text
 * column (the banner marks it `data-artwork-exclude="column"`).
 */
export async function TagArtwork() {
  const theme = await getPageTheme();
  const art = getThemeArtwork(theme.id);
  const motifs = art.tag.hero ? [art.tag.hero, ...art.tag.scatter] : art.tag.scatter;
  return (
    <ArtworkLayer
      surface="tag"
      theme={theme.id}
      deco={art.deco}
      motifs={motifs}
      hangers={art.tag.hangers}
      band={art.tag.band}
      bandEdge="bottom"
    />
  );
}
