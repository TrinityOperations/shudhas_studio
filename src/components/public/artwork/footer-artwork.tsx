import { getThemeArtwork } from "@/lib/themes/artwork/data";
import { getPageTheme } from "@/lib/themes/active";
import { ArtworkLayer } from "./artwork-layer";

/** The footer's fainter motifs and a pattern band along its top edge, clear of the link columns. */
export async function FooterArtwork() {
  const theme = await getPageTheme();
  const art = getThemeArtwork(theme.id);
  return (
    <ArtworkLayer
      surface="footer"
      theme={theme.id}
      deco={art.deco}
      motifs={art.footer.scatter}
      hangers={art.footer.hangers}
      band={art.footer.band}
      bandEdge="top"
    />
  );
}
