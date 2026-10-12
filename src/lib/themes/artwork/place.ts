import {
  COMPACT_HERO,
  HEADER_ICON_SCALE,
  MOTIF_STROKE,
  type Band,
  type Hanger,
  type HeaderAnchor,
  type HeaderColour,
  type HeaderSlot,
  type Motif,
  type MotifColour,
  type OpacityTiers,
  type PoolSlot,
  type ThemeArtwork,
} from "./data";
import type { SeasonIconName } from "./icons";

/**
 * "Never under text": the one rule every decorative motif obeys (docs/design.md, "Seasonal
 * artwork"). Everything here is pure, so the header, tag and footer layers share it and the unit
 * tests run the very same code on measured and stand-in boxes.
 *
 * - Header: icons sit at px offsets from the row's centre or in from an edge. When the header
 *   collapses each side slides in as a group, by half the width the name gives up, so the gap
 *   from the mark stays the gap the icons had from the mark and the name. In each state an icon
 *   is hidden when its centre leaves that state's row or its box touches that state's brand
 *   (mark and name at the top, the mark once collapsed) or an action; the layer clips at the
 *   edges, so a box may cross them. Nothing is reassigned.
 * - Tag and footer: a shared slot pool is filtered first (text, the hero, the hangers), and only
 *   then the theme's set is handed to the survivors, biggest first, so a slot meeting text never
 *   takes a set icon with it.
 */

export type Box = { x: number; y: number; width: number; height: number };

export type Size = { width: number; height: number };

export type Placed<T> = T & { left: number; top: number; index: number };

export function intersects(a: Box, b: Box, margin = 0): boolean {
  return (
    a.x - margin < b.x + b.width &&
    a.x + a.width + margin > b.x &&
    a.y - margin < b.y + b.height &&
    a.y + a.height + margin > b.y
  );
}

// ---------------------------------------------------------------------------------------------
// Header

/** A header icon resolved for a theme; `size` is the rendered size. */
export type HeaderIcon = {
  icon: SeasonIconName;
  dx: number;
  dy: number;
  size: number;
  rotate: number;
  colour: HeaderColour;
  anchor: HeaderAnchor;
};

type HeaderPosition = Pick<HeaderIcon, "dx" | "dy" | "size"> & { anchor?: HeaderAnchor };

/** The icon centre's x in a row `width` wide. */
export function headerCentreX(icon: Pick<HeaderPosition, "dx" | "anchor">, width: number): number {
  if (icon.anchor === "l") return icon.dx;
  if (icon.anchor === "r") return width - icon.dx;
  return width / 2 + icon.dx;
}

export function headerIconSize(size: number): number {
  return Math.round(size * HEADER_ICON_SCALE);
}

/** A header table with the theme's icons and the rendered sizes. */
export function resolveHeaderTable(
  table: readonly HeaderSlot[],
  art: Pick<ThemeArtwork, "headerIcons" | "headerFiller">,
): HeaderIcon[] {
  return table.map(([dx, dy, size, rotate, colour, ref, anchor = "c"]) => ({
    icon: ref === "f" ? art.headerFiller : art.headerIcons[ref],
    dx,
    dy,
    size: headerIconSize(size),
    rotate,
    colour,
    anchor,
  }));
}

/** The top row in one state: its size, the y of the centre the set is anchored to, exclusions. */
export type HeaderFrame = Size & { anchorY: number; exclusions: Box[] };

/** Px around an action's vertical centre that stays clear (its text). */
export const TEXT_BAND_HEIGHT = 24;

/** An action taller than this (px) keeps its whole box clear, not only its text band. */
export const TALL_ACTION = 48;

/**
 * What the layer reads from the row, all of it the same in either state and during the change,
 * so one measurement places both sets and nothing is re-placed mid-collapse.
 */
export type HeaderGeometry = {
  width: number;
  /** The top row's fixed heights at the top of the page and once collapsed */
  heights: { top: number; small: number };
  /** The brand: its centre x, its width with the name (at the top) and the mark's alone */
  brand: { centre: number; full: number; mark: number } | null;
  /** The actions: x, width, height, and the vertical offset of their centre from the content's */
  texts: { x: number; width: number; height: number; offset: number }[];
};

/**
 * Each state's row: its content is centred vertically, so its centre is the row's centre. The
 * icons above and below the actions sit outside their 24px text band; an action taller than
 * `TALL_ACTION` (the Book pill from 1400px) also keeps its whole box clear.
 */
export function headerFrames(g: HeaderGeometry): { top: HeaderFrame; small: HeaderFrame } {
  const frame = (height: number, brandWidth: number): HeaderFrame => ({
    width: g.width,
    height,
    anchorY: height / 2,
    exclusions: [
      ...(g.brand ? [{ x: g.brand.centre - brandWidth / 2, y: 0, width: brandWidth, height }] : []),
      ...g.texts.map((t) => ({
        x: t.x,
        y: height / 2 + t.offset - TEXT_BAND_HEIGHT / 2,
        width: t.width,
        height: TEXT_BAND_HEIGHT,
      })),
      ...g.texts
        .filter((t) => t.height > TALL_ACTION)
        .map((t) => ({
          x: t.x,
          y: height / 2 + t.offset - t.height / 2,
          width: t.width,
          height: t.height,
        })),
    ],
  });
  return {
    top: frame(g.heights.top, g.brand?.full ?? 0),
    small: frame(g.heights.small, g.brand?.mark ?? 0),
  };
}

/** The icon's box in the row: its centre at (`headerCentreX`, anchorY + dy). */
export function headerBox(icon: HeaderPosition, frame: HeaderFrame): Box {
  return {
    x: headerCentreX(icon, frame.width) - icon.size / 2,
    y: frame.anchorY + icon.dy - icon.size / 2,
    width: icon.size,
    height: icon.size,
  };
}

/** Shown in this state: centre inside the row (the box may cross an edge) and clear of text. */
export function shownIn(box: Box, frame: HeaderFrame): boolean {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const inside = cx >= 0 && cx <= frame.width && cy >= 0 && cy <= frame.height;
  return inside && !frame.exclusions.some((zone) => intersects(box, zone));
}

/**
 * Where an icon's centre goes once the header has collapsed. The name leaves and the mark
 * travels to the brand's centre, opening the same gap on both sides: half of (name + the gap
 * beside it). Every icon left of that centre slides right by that much, and every icon right
 * of it slides left by that much, so a side keeps its spacing and the gap from the innermost
 * icon to the mark equals the gap it had from the mark (left) or the name (right). Down, the
 * row's height scales, so the centre line stays the centre line.
 */
export function collapsedCentre(
  centre: { x: number; y: number },
  g: HeaderGeometry,
): { x: number; y: number } {
  const y = centre.y * (g.heights.small / g.heights.top);
  if (!g.brand) return { x: centre.x, y };
  const delta = (g.brand.full - g.brand.mark) / 2;
  const side = Math.sign(centre.x - g.brand.centre);
  return { x: centre.x - side * delta, y };
}

/** One header icon in both states: where it sits at the top, how it moves, where it shows. */
export type HeaderPlacement = {
  index: number;
  /** Its centre's y at the top of the page (x comes from its anchor, in CSS) */
  y: number;
  /** The move to its place once collapsed, px */
  shiftX: number;
  shiftY: number;
  /** Shown at the top of the page, and once collapsed */
  top: boolean;
  small: boolean;
};

/**
 * Places the icons for both states from one measurement: each sits on its table position at the
 * top of the page and moves to `collapsedCentre` as the header collapses, shown in each state
 * where it clears that state's brand and actions (an icon shown in one state only fades out or
 * in as it moves). Icons shown in neither state are left out.
 */
export function placeHeaderIcons(
  icons: readonly HeaderPosition[],
  g: HeaderGeometry,
): HeaderPlacement[] {
  const frames = headerFrames(g);
  if (frames.top.width <= 0 || frames.top.height <= 0) return [];
  const placed: HeaderPlacement[] = [];
  icons.forEach((icon, index) => {
    const box = headerBox(icon, frames.top);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const to = collapsedCentre(centre, g);
    const moved = { ...box, x: to.x - box.width / 2, y: to.y - box.height / 2 };
    const shown = { top: shownIn(box, frames.top), small: shownIn(moved, frames.small) };
    if (!shown.top && !shown.small) return;
    placed.push({ index, y: centre.y, shiftX: to.x - centre.x, shiftY: to.y - centre.y, ...shown });
  });
  return placed;
}

// ---------------------------------------------------------------------------------------------
// Tag and footer

/** Margin around a pool slot (each side), so a slot's box is its size + 8 px. */
export const POOL_MARGIN = 4;

/** Margin around a hanger's box against text. */
export const HANGER_MARGIN = 6;

/** Room per stacked item on a hanger's thread, beyond its size, when keeping slots clear. */
export const HANGER_GAP = 4;

/** A tag or footer motif's stroke: its size / 22, kept between 1.4 and 3 px. */
export function motifStroke(size: number): number {
  const { divisor, min, max } = MOTIF_STROKE;
  return Math.min(max, Math.max(min, size / divisor));
}

const percentOf = (value: number, of: number) => (value / 100) * of;

/** A square of `size` (plus `margin` each side) around a centre given in % of the box. */
function squareAt(x: number, y: number, size: number, box: Size, margin = 0): Box {
  return {
    x: percentOf(x, box.width) - size / 2 - margin,
    y: percentOf(y, box.height) - size / 2 - margin,
    width: size + 2 * margin,
    height: size + 2 * margin,
  };
}

/** The hero's box: a square of its size around its centre, no margin. */
export function heroBox(hero: Pick<Motif, "x" | "y" | "size">, box: Size): Box {
  return squareAt(hero.x, hero.y, hero.size, box);
}

/** A pool slot's box: its size plus `POOL_MARGIN` on each side. */
export function poolSlotBox(slot: PoolSlot, box: Size): Box {
  const [x, y, size] = slot;
  return squareAt(x, y, size, box, POOL_MARGIN);
}

export type HangerSlot = { x: number; thread: number; size: number; items: readonly unknown[] };

/** The box a hanger occupies: from the top edge down the thread and its stacked items. */
export function hangerBox(hanger: HangerSlot, box: Size): Box {
  return {
    x: percentOf(hanger.x, box.width) - hanger.size / 2,
    y: 0,
    width: hanger.size,
    height: hanger.thread + hanger.items.length * (hanger.size + HANGER_GAP),
  };
}

export function placeHangers<T extends HangerSlot>(
  hangers: readonly T[],
  box: Size,
  exclusions: readonly Box[],
  margin = HANGER_MARGIN,
): Placed<T>[] {
  if (box.width <= 0 || box.height <= 0) return [];
  const placed: Placed<T>[] = [];
  hangers.forEach((hanger, index) => {
    const rect = hangerBox(hanger, box);
    if (exclusions.some((zone) => intersects(rect, zone, margin))) return;
    placed.push({ ...hanger, left: rect.x, top: 0, index });
  });
  return placed;
}

/** Where a pattern band runs: its edge, the inset from it and the room left clear at each end. */
export type BandLayout = { edge: "top" | "bottom"; inset: number; padding: number };

/** Top-left corners of `count` icons spread evenly along an edge, `padding` clear at each end. */
export function bandPositions(
  count: number,
  size: number,
  box: Size,
  layout: BandLayout,
): { left: number; top: number }[] {
  const span = box.width - 2 * layout.padding;
  if (span <= 0 || count <= 0) return [];
  const step = span / count;
  const top = layout.edge === "top" ? layout.inset : box.height - layout.inset - size;
  return Array.from({ length: count }, (_, i) => ({
    left: layout.padding + step * (i + 0.5) - size / 2,
    top,
  }));
}

/** Size tier for opacity: 0 for ≥ 40 px, 1 for ≥ 24 px, 2 for smaller. */
export function opacityTier(size: number): 0 | 1 | 2 {
  if (size >= 40) return 0;
  if (size >= 24) return 1;
  return 2;
}

const POOL_COLOUR: Record<PoolSlot[4], MotifColour> = { w: "ivory", d: "deco" };

/** A pool slot that survived, with its icon and opacity. */
export type PoolMotif = {
  index: number;
  icon: SeasonIconName;
  size: number;
  rotate: number;
  colour: MotifColour;
  opacity: number;
  left: number;
  top: number;
};

/**
 * Hands icons to the surviving slots, biggest first (ties keep pool order): the first N get the
 * set in order, one each; the rest cycle the set, except that one smaller than `fillerBelow`
 * gets the filler.
 */
export function assignPool(
  survivors: readonly { index: number; slot: PoolSlot }[],
  set: readonly SeasonIconName[],
  filler: SeasonIconName,
  fillerBelow: number,
): { index: number; slot: PoolSlot; icon: SeasonIconName }[] {
  const ordered = [...survivors].sort((a, b) => b.slot[2] - a.slot[2] || a.index - b.index);
  return ordered.map((s, rank) => ({
    ...s,
    icon: rank < set.length ? set[rank] : s.slot[2] < fillerBelow ? filler : set[rank % set.length],
  }));
}

export type SurfaceInput = {
  box: Size;
  /** Measured text boxes (measure.ts) */
  text: readonly Box[];
  pool: readonly PoolSlot[];
  set: readonly SeasonIconName[];
  filler: SeasonIconName;
  fillerBelow: number;
  tiers: OpacityTiers;
  hero: Motif | null;
  hangers: readonly Hanger[];
  band: Band | null;
  bandLayout: BandLayout;
};

export type SurfaceLayout = {
  hero: Placed<Motif> | null;
  hangers: Placed<Hanger>[];
  motifs: PoolMotif[];
  band: { left: number; top: number }[];
  /** Set icons that appear nowhere on the surface (hero, hangers and band count) */
  missing: SeasonIconName[];
};

/**
 * One surface's artwork: the hero and hangers that clear the text, then the pool slots that
 * clear the text, the hero and the hangers, with the set handed out over them.
 */
export function layoutSurface(input: SurfaceInput): SurfaceLayout {
  const { box, text } = input;
  if (box.width <= 0 || box.height <= 0) {
    return { hero: null, hangers: [], motifs: [], band: [], missing: [...input.set] };
  }
  const heroRect = input.hero ? heroBox(input.hero, box) : null;
  const hero =
    input.hero && heroRect && !text.some((zone) => intersects(heroRect, zone))
      ? { ...input.hero, left: heroRect.x, top: heroRect.y, index: 0 }
      : null;
  const hangers = placeHangers(input.hangers, box, text);
  const taken = [
    ...text,
    ...(hero && heroRect ? [heroRect] : []),
    ...hangers.map((h) => hangerBox(h, box)),
  ];
  const survivors = input.pool
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !taken.some((zone) => intersects(poolSlotBox(slot, box), zone)));
  const motifs = assignPool(survivors, input.set, input.filler, input.fillerBelow).map(
    ({ slot: [x, y, size, rotate, c], index, icon }) => {
      const colour = POOL_COLOUR[c];
      return {
        index,
        icon,
        size,
        rotate,
        colour,
        opacity: input.tiers[colour][opacityTier(size)],
        left: percentOf(x, box.width) - size / 2,
        top: percentOf(y, box.height) - size / 2,
      };
    },
  );
  const shown = new Set<SeasonIconName>([
    ...motifs.map((m) => m.icon),
    ...(hero ? [hero.icon] : []),
    ...hangers.flatMap((h) => h.items),
    ...(input.band ? [input.band.icon] : []),
  ]);
  return {
    hero,
    hangers,
    motifs,
    band: input.band ? bandPositions(input.band.count, input.band.size, box, input.bandLayout) : [],
    missing: input.set.filter((name) => !shown.has(name)),
  };
}

/** The hero below lg: the tag's at 45% of its size at the top right, the footer's at 50%. */
export function compactHero(surface: "tag" | "footer", hero: Motif | null): Motif | null {
  if (!hero) return null;
  if (surface === "tag") {
    const { scale, x, y } = COMPACT_HERO.tag;
    return { ...hero, size: Math.round(hero.size * scale), x, y };
  }
  return { ...hero, size: Math.round(hero.size * COMPACT_HERO.footer.scale) };
}

// ---------------------------------------------------------------------------------------------
// Exclusions

/** How a measured element becomes an exclusion box (see measure.ts). */
export type ExclusionMode =
  /** The element's box */
  | "full"
  /** The box around the element's text and controls only (a footer column, not its grid cell) */
  | "content"
  /** The element's horizontal extent for the full height of the surface (the header's brand) */
  | "brand"
  /** The element's horizontal extent, 24px around its vertical centre (a button's text) */
  | "text"
  /** One box per line of the element's text and per link or button (measure.ts) */
  | "lines";

/** The exclusion box for one measured element (every mode but "lines", which gives several). */
export function exclusionFor(mode: Exclude<ExclusionMode, "lines">, el: Box, surface: Size): Box {
  switch (mode) {
    case "full":
    case "content":
      return el;
    case "brand":
      return { x: el.x, y: 0, width: el.width, height: surface.height };
    case "text": {
      const centre = el.y + el.height / 2;
      return {
        x: el.x,
        y: centre - TEXT_BAND_HEIGHT / 2,
        width: el.width,
        height: TEXT_BAND_HEIGHT,
      };
    }
  }
}
