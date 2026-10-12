import { FACT_ICONS, getThemeArtwork, type SurfaceArtwork } from "./data";
import type { SeasonIconName } from "./icons";
import type { ThemeId } from "@/lib/themes/themes";

function surfaceNames(surface: SurfaceArtwork): SeasonIconName[] {
  return [
    ...(surface.hero ? [surface.hero.icon] : []),
    ...surface.scatter.map((m) => m.icon),
    ...surface.hangers.flatMap((h) => h.items),
    surface.band.icon,
  ];
}

/** Every icon a page in this theme can use: the sprite holds exactly these, nothing more. */
export function artworkIconNames(themeId: ThemeId): SeasonIconName[] {
  const art = getThemeArtwork(themeId);
  const names = new Set<SeasonIconName>([
    ...art.headerIcons,
    art.headerFiller,
    ...surfaceNames(art.tag),
    ...surfaceNames(art.footer),
    ...FACT_ICONS,
  ]);
  return [...names].sort();
}
