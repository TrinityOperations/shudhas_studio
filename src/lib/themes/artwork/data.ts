import type { ThemeId } from "@/lib/themes/themes";
import type { SeasonIconName } from "./icons";

/**
 * Per-theme artwork (docs/design.md, "Seasonal artwork"), from the approved mock-up. Themes
 * themselves (`themes.ts`) stay about colour and copy; everything decorative lives here.
 *
 * - Header: four position tables in px from the centre of the header's top row (`HDR`), the same
 *   for every theme; a theme brings its three header icons, the filler and the pop colour.
 * - Tag and footer: shared slot pools in % of the surface (`POOLS`). The layer drops the slots
 *   that meet text, the hero or a hanger, then hands the theme's `set` to the survivors, biggest
 *   first (place.ts), so every icon in the set appears. Each theme keeps its own hero, hangers
 *   and pattern band.
 *
 * Every import here is type-only, so the Playwright specs can read the tables too.
 */

export type MotifColour = "deco" | "ivory";

/** One large motif (a surface's hero). */
export type Motif = {
  icon: SeasonIconName;
  /** Centre, % of the surface width */
  x: number;
  /** Centre, % of the surface height */
  y: number;
  size: number;
  rotate: number;
  colour: MotifColour;
  opacity: number;
};

/** A thread from the top edge with icons stacked down it. */
export type Hanger = {
  x: number;
  /** Thread length in px before the first item */
  thread: number;
  items: SeasonIconName[];
  size: number;
  colour: MotifColour;
  opacity: number;
};

/** One icon repeated along an edge. */
export type Band = {
  icon: SeasonIconName;
  size: number;
  count: number;
  colour: MotifColour;
  opacity: number;
};

export type SurfaceArtwork = {
  hero: Motif | null;
  hangers: Hanger[];
  band: Band;
};

export type ThemeArtwork = {
  /** Second colour for motifs on the accent, upper-case `#RRGGBB` */
  deco: string;
  /** Second colour for the header icons on paper, upper-case `#RRGGBB` */
  pop: string;
  /** The header tables' icons 0, 1 and 2 */
  headerIcons: readonly [SeasonIconName, SeasonIconName, SeasonIconName];
  /** The header tables' "f" icon, and the small pool slots past the set on the tag and footer */
  headerFiller: SeasonIconName;
  /** Icons that must all appear on the tag and on the footer */
  set: readonly SeasonIconName[];
  tag: SurfaceArtwork;
  footer: SurfaceArtwork;
};

/** Header icon colour: the theme's accent or its pop colour. */
export type HeaderColour = "a" | "p";
/** Index into the theme's `headerIcons`, or "f" for its `headerFiller`. */
export type HeaderIconRef = 0 | 1 | 2 | "f";
/** What `dx` is measured from: the row's centre (default), its left edge or its right edge. */
export type HeaderAnchor = "c" | "l" | "r";

/**
 * A header icon: its centre's horizontal offset in px (from the row's centre, or in from the
 * left or right edge with the anchor), its vertical offset from the row's centre, its size
 * before `HEADER_ICON_SCALE`, rotation in degrees, colour, icon and anchor.
 */
export type HeaderSlot = readonly [
  dx: number,
  dy: number,
  size: number,
  rotate: number,
  colour: HeaderColour,
  icon: HeaderIconRef,
  anchor?: HeaderAnchor,
];

export type HeaderTable = "top" | "small" | "phoneTop" | "phoneSmall";

/**
 * The header's two icon sets per width: `top` while the page is at the top, `small` once the
 * header has collapsed (keeping their distance from the mark, nearest about 200px); the phone
 * tables below lg. The scatter covers the whole row, edge to edge and top to bottom (dy up to
 * ±34 at the top, ±24 collapsed), with the outermost icons anchored to the edges ("l", "r") so
 * they sit there at every width; the layer clips at the row's edges, so an edge icon may be
 * half cut off. Both sets of a width are rendered and cross-faded with a slide.
 */
export const HDR: Record<HeaderTable, readonly HeaderSlot[]> = {
  top: [
    [-204, 30, 10, -8, "a", 0],
    [-236, -28, 7, 0, "p", "f"],
    [-274, 8, 14, 9, "p", 1],
    [-322, -34, 9, -12, "a", 2],
    [-352, 26, 7, 0, "p", "f"],
    [-404, -6, 13, 14, "a", 1],
    [-452, 32, 11, -8, "p", 0],
    [-490, -30, 7, 0, "a", "f"],
    [-548, 4, 14, 5, "a", 2],
    [-606, -24, 10, -10, "p", 0],
    [96, 28, 8, 0, "p", "f", "l"],
    [46, -20, 13, 10, "a", 1, "l"],
    [4, 22, 14, -6, "p", 0, "l"],
    [206, -30, 13, 12, "p", 1],
    [240, 24, 7, 0, "a", "f"],
    [286, -10, 11, -14, "a", 2],
    [336, 30, 14, 6, "p", 0],
    [410, -32, 8, 0, "a", "f"],
    [470, 30, 7, 0, "p", "f"],
    [560, -32, 9, 8, "p", 2],
    [640, 32, 8, 0, "a", "f"],
    [6, -26, 12, -8, "a", 1, "r"],
    [40, 33, 7, 0, "p", "f", "r"],
    [70, -34, 9, 0, "p", 2, "r"],
  ],
  small: [
    [-198, -20, 11, 6, "p", 1],
    [-230, 18, 7, 0, "a", "f"],
    [-268, -4, 13, -10, "a", 0],
    [-310, 22, 9, 12, "p", 2],
    [-346, -22, 6, 0, "p", "f"],
    [-392, 10, 13, -8, "a", 1],
    [-440, -18, 10, 6, "p", 0],
    [-482, 20, 7, 0, "a", "f"],
    [-536, -8, 13, -12, "p", 2],
    [-592, 16, 10, 10, "a", 0],
    [100, -18, 8, 0, "a", "f", "l"],
    [52, 14, 12, -8, "p", 2, "l"],
    [4, -16, 13, 8, "a", 1, "l"],
    [204, 18, 12, -12, "a", 0],
    [238, -20, 7, 0, "p", "f"],
    [284, 6, 11, 10, "p", 1],
    [332, -18, 13, -6, "a", 2],
    [412, 22, 8, 0, "p", "f"],
    [468, -22, 7, 0, "a", "f"],
    [562, 22, 9, -8, "a", 2],
    [638, -22, 8, 0, "p", "f"],
    [6, 16, 12, 10, "p", 0, "r"],
    [40, -23, 7, 0, "a", "f", "r"],
    [72, 23, 9, 0, "a", 1, "r"],
  ],
  phoneTop: [
    [-112, 8, 10, -8, "a", 0],
    [-133, -12, 7, 0, "p", "f"],
    [114, -10, 10, 10, "p", 1],
    [136, 10, 7, 0, "a", "f"],
    [12, 26, 6, 0, "p", "f", "l"],
    [14, -26, 6, 0, "a", "f", "r"],
  ],
  phoneSmall: [
    [-110, 7, 10, -8, "a", 0],
    [-130, -10, 7, 0, "p", "f"],
    [-97, -12, 6, 0, "p", 2],
    [112, -9, 10, 10, "p", 1],
    [134, 9, 7, 0, "a", "f"],
    [12, -24, 6, 0, "a", "f", "l"],
    [14, 24, 6, 0, "p", "f", "r"],
  ],
};

/** Rendered header icon size = round(table size × this). */
export const HEADER_ICON_SCALE = 1.1;
/** The header icons' stroke (px, non-scaling); every other motif keeps the sprite's 1.4. */
export const HEADER_STROKE = 1.8;

/** Pool slot colour: "w" ivory, "d" the theme's deco. */
export type PoolColour = "w" | "d";
/** A pool slot: centre in % of the surface, size in px, rotation in degrees, colour. */
export type PoolSlot = readonly [
  x: number,
  y: number,
  size: number,
  rotate: number,
  colour: PoolColour,
];

export type PoolName = "tag" | "tagPhone" | "foot" | "footPhone";

/**
 * Shared slot pools, the same for every theme: `tag` and `foot` from lg up, `tagPhone` and
 * `footPhone` below it. Drawn on canvases of 1040 × 440 (tag), 358 × 330 (tag, phone),
 * 1440 × 352 (footer) and 390 × 850 (footer, phone); at run time the measured box is used.
 */
export const POOLS: Record<PoolName, readonly PoolSlot[]> = {
  tag: [
    [15, 22, 54, -12, "w"],
    [23, 36, 30, 10, "d"],
    [13, 68, 40, -8, "d"],
    [22, 56, 22, 8, "w"],
    [19, 84, 32, 12, "w"],
    [25, 12, 18, 0, "d"],
    [10, 86, 14, 0, "w"],
    [25, 74, 16, -10, "d"],
    [11, 28, 16, 0, "d"],
    [33, 7, 20, 0, "d"],
    [44, 5, 14, 0, "w"],
    [55, 8, 18, 10, "d"],
    [66, 5, 14, 0, "w"],
    [77, 8, 20, -8, "d"],
    [34, 90, 16, 0, "w"],
    [47, 89, 22, -6, "d"],
    [60, 90, 14, 0, "w"],
    [73, 89, 18, 8, "d"],
    [90, 12, 30, -6, "w"],
    [96, 28, 18, 0, "d"],
    [88, 40, 22, 10, "w"],
    [95, 55, 28, 0, "d"],
    [88, 68, 40, -8, "w"],
    [96, 82, 20, 10, "d"],
    [89, 88, 16, 0, "w"],
  ],
  tagPhone: [
    [20, 5, 18, -8, "w"],
    [36, 7, 12, 0, "d"],
    [52, 4, 16, 0, "w"],
    [68, 7, 12, 10, "d"],
    [84, 5, 18, 0, "w"],
    [94, 9, 12, 0, "d"],
    [22, 87, 14, 0, "d"],
    [38, 88, 16, -8, "w"],
    [54, 87, 12, 0, "d"],
    [70, 88, 16, 8, "w"],
    [86, 87, 14, 0, "d"],
    [9, 24, 16, 0, "d"],
    [10, 72, 16, -8, "w"],
    [10, 86, 10, 0, "w"],
  ],
  foot: [
    [86, 22, 40, -10, "d"],
    [95, 14, 20, 0, "w"],
    [83, 48, 24, 8, "w"],
    [92, 56, 34, 0, "d"],
    [86, 74, 18, 0, "w"],
    [97, 36, 16, 0, "d"],
    [44.5, 24, 30, -8, "d"],
    [45, 50, 20, 10, "w"],
    [43, 70, 24, 0, "w"],
    [63.5, 26, 26, 8, "w"],
    [64, 52, 34, -6, "d"],
    [62, 72, 16, 0, "w"],
    [8, 64, 28, -6, "d"],
    [16, 72, 20, 8, "w"],
    [24, 60, 16, 0, "w"],
    [32, 88, 16, 0, "w"],
    [44, 87, 22, -8, "d"],
    [56, 88, 14, 0, "w"],
    [68, 87, 20, 6, "d"],
    [78, 88, 14, 0, "w"],
    [36, 12, 14, 0, "w"],
    [55, 12, 14, 0, "d"],
    [74, 12, 14, 0, "w"],
  ],
  footPhone: [
    [90, 12, 22, -8, "d"],
    [70, 26, 16, 0, "w"],
    [90, 30, 26, 10, "d"],
    [78, 40, 18, 0, "w"],
    [66, 50, 14, 0, "d"],
    [92, 52, 30, -6, "w"],
    [76, 62, 22, 8, "d"],
    [93, 70, 16, 0, "w"],
    [66, 76, 14, 0, "w"],
    [84, 82, 26, 0, "d"],
    [94, 87, 14, 0, "w"],
    [72, 86, 16, -8, "d"],
  ],
};

/** A pool slot past the set and smaller than this (px) gets the filler instead. */
export const POOL_FILLER_BELOW = { wide: 16, compact: 12 } as const;

/** Opacity by colour and size tier (tier 0: size ≥ 40, tier 1: ≥ 24, tier 2: smaller). */
export type OpacityTiers = Record<MotifColour, readonly [number, number, number]>;

export const POOL_OPACITY: Record<"tag" | "footer", OpacityTiers> = {
  tag: { ivory: [0.6, 0.75, 0.55], deco: [0.9, 0.95, 0.85] },
  footer: { ivory: [0.22, 0.3, 0.35], deco: [0.45, 0.55, 0.6] },
};

/**
 * Below lg there are no hangers; the tag's hero is drawn at 45% of its size at the top right,
 * the footer's at 50% in its own place. Both still keep the pool's slots off them.
 */
export const COMPACT_HERO = {
  tag: { scale: 0.45, x: 92, y: 10 },
  footer: { scale: 0.5 },
} as const;

/**
 * Stroke of the tag's and footer's motifs (non-scaling, px): their size / 22, kept between 1.4
 * and 3, so the large ones are drawn bolder, as in the mock-up.
 */
export const MOTIF_STROKE = { divisor: 22, min: 1.4, max: 3 } as const;

/**
 * Pattern bands as the mock-up draws them: `inset` px in from their edge, `padding` px clear at
 * each end, icons spread evenly between; below lg the tag's band has 12 icons and the footer's 16.
 */
export const BAND_LAYOUT = {
  tag: { edge: "bottom", inset: 16, padding: { wide: 100, compact: 40 }, compactCount: 12 },
  footer: { edge: "top", inset: 14, padding: { wide: 24, compact: 24 }, compactCount: 16 },
} as const;

/** The facts strip's icons, in the order of `home.facts.1..4`. */
export const FACT_ICONS: readonly SeasonIconName[] = ["handmade", "nib", "chat", "parcel"];
/** The facts strip's icon: 22px below lg (26px from lg, set in FactIcon's class), stroke 1.6. */
export const FACT_ICON = { size: 22, stroke: 1.6 } as const;

const garland = (count: number): SeasonIconName[] =>
  Array.from({ length: count }, () => "marigold" as const);

const hero = (
  icon: SeasonIconName,
  size: number,
  x: number,
  y: number,
  colour: MotifColour,
  opacity: number,
  rotate = 0,
): Motif => ({ icon, size, x, y, rotate, colour, opacity });

const band = (
  icon: SeasonIconName,
  size: number,
  count: number,
  opacity: number,
  colour: MotifColour = "ivory",
): Band => ({ icon, size, count, colour, opacity });

export const THEME_ARTWORK: Record<ThemeId, ThemeArtwork> = {
  everyday: {
    deco: "#E8C9A0",
    pop: "#C8862F",
    headerIcons: ["kantha", "needle", "bow"],
    headerFiller: "dotstar",
    set: ["tag", "bow", "kantha", "needle", "dotstar"],
    tag: {
      hero: hero("kantha", 230, 93, 18, "deco", 0.9),
      hangers: [],
      band: band("kantha", 16, 30, 0.2),
    },
    footer: {
      hero: hero("kantha", 170, 94, 78, "ivory", 0.14, 10),
      hangers: [],
      band: band("kantha", 14, 40, 0.16),
    },
  },
  eid: {
    deco: "#E3B867",
    pop: "#C9962E",
    headerIcons: ["crescent", "star5", "lantern"],
    headerFiller: "sparkle",
    set: ["crescent", "sparkle", "lantern", "star8", "mosque", "star5"],
    tag: {
      hero: hero("crescent", 180, 89, 36, "deco", 0.95),
      hangers: [
        { x: 15, thread: 36, items: ["lantern"], size: 36, colour: "deco", opacity: 1 },
        { x: 21, thread: 96, items: ["lantern"], size: 30, colour: "ivory", opacity: 1 },
        { x: 27, thread: 58, items: ["lantern"], size: 26, colour: "deco", opacity: 1 },
      ],
      band: band("star8", 18, 30, 0.18),
    },
    footer: {
      hero: hero("crescent", 120, 92, 30, "deco", 0.45, -8),
      hangers: [
        { x: 76, thread: 26, items: ["lantern"], size: 26, colour: "ivory", opacity: 0.28 },
      ],
      band: band("star8", 14, 46, 0.14),
    },
  },
  "pohela-boishakh": {
    deco: "#F2C14E",
    pop: "#D9960F",
    headerIcons: ["alpona", "kite", "sun"],
    headerFiller: "dotstar",
    set: ["kite", "alpona", "fan", "owl", "dhol", "sun"],
    tag: {
      hero: hero("alpona", 250, 95, 30, "deco", 0.9),
      hangers: [],
      band: band("alpona", 16, 30, 0.3),
    },
    footer: {
      hero: hero("alpona", 210, 94, 78, "deco", 0.26),
      hangers: [],
      band: band("alpona", 14, 46, 0.2),
    },
  },
  wedding: {
    deco: "#F0A93B",
    pop: "#E07B16",
    headerIcons: ["marigold", "rings", "paan"],
    headerFiller: "dotstar",
    set: ["marigold", "paisley", "paan", "rings", "palki"],
    tag: {
      hero: null,
      hangers: [
        { x: 14, thread: 6, items: garland(4), size: 26, colour: "deco", opacity: 1 },
        { x: 19, thread: 6, items: garland(6), size: 26, colour: "deco", opacity: 1 },
        { x: 24, thread: 6, items: garland(3), size: 26, colour: "ivory", opacity: 0.85 },
        { x: 84, thread: 6, items: garland(3), size: 26, colour: "ivory", opacity: 0.85 },
        { x: 89, thread: 6, items: garland(6), size: 26, colour: "deco", opacity: 1 },
        { x: 94, thread: 6, items: garland(4), size: 26, colour: "deco", opacity: 1 },
      ],
      band: band("paisley", 18, 30, 0.2),
    },
    footer: {
      hero: hero("palki", 110, 92, 76, "ivory", 0.16),
      hangers: [
        { x: 84, thread: 4, items: garland(3), size: 22, colour: "deco", opacity: 0.55 },
        { x: 88, thread: 4, items: garland(5), size: 22, colour: "deco", opacity: 0.55 },
        { x: 92, thread: 4, items: garland(2), size: 22, colour: "deco", opacity: 0.55 },
      ],
      band: band("paisley", 14, 46, 0.14),
    },
  },
  christmas: {
    deco: "#E3B867",
    pop: "#2F6A44",
    headerIcons: ["star5", "bauble", "gumleaf"],
    headerFiller: "star5",
    set: ["tree", "bauble", "star5", "gumleaf", "firework"],
    tag: {
      hero: hero("tree", 150, 92, 58, "ivory", 0.85),
      hangers: [
        { x: 74, thread: 40, items: ["bauble"], size: 32, colour: "deco", opacity: 1 },
        { x: 80, thread: 92, items: ["bauble"], size: 26, colour: "ivory", opacity: 1 },
        { x: 86, thread: 20, items: ["star5"], size: 26, colour: "deco", opacity: 1 },
      ],
      band: band("dotstar", 16, 30, 0.25),
    },
    footer: {
      hero: hero("tree", 120, 93, 74, "ivory", 0.16),
      hangers: [],
      band: band("dotstar", 14, 46, 0.2),
    },
  },
  "mothers-day": {
    deco: "#F3D9E1",
    pop: "#C9617F",
    headerIcons: ["chrysanthemum", "heart", "sprig"],
    headerFiller: "heart",
    set: ["chrysanthemum", "heart", "envelope", "sprig", "bow"],
    tag: {
      hero: hero("chrysanthemum", 260, 96, 10, "ivory", 0.85),
      hangers: [],
      band: band("heart", 14, 34, 0.22),
    },
    footer: {
      hero: hero("chrysanthemum", 190, 94, 80, "ivory", 0.14),
      hangers: [],
      band: band("heart", 12, 50, 0.16),
    },
  },
  valentines: {
    deco: "#F7C6D0",
    pop: "#E0566F",
    headerIcons: ["heartfill", "rose", "twohearts"],
    headerFiller: "heartfill",
    set: ["heartfill", "twohearts", "rose", "envheart", "heart"],
    tag: {
      hero: hero("heart", 210, 90, 44, "deco", 0.9),
      hangers: [],
      band: band("heartfill", 12, 36, 0.22),
    },
    footer: {
      hero: hero("heart", 160, 93, 70, "ivory", 0.14, -8),
      hangers: [],
      band: band("heartfill", 10, 56, 0.16),
    },
  },
};

export function getThemeArtwork(id: ThemeId): ThemeArtwork {
  return THEME_ARTWORK[id];
}
