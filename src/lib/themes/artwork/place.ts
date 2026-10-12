/**
 * "Never under text": the one rule every decorative scatter obeys (docs/design.md, "Seasonal
 * artwork"). Positions in the artwork data are percentages of the box they decorate; this
 * module turns them into pixel boxes and drops any whose icon box, grown by the margin, meets an
 * exclusion box (the brand, an actions' text band, the tag's text column, the footer's link
 * columns). Pure, so the header, tag and footer share it and it is unit-tested on its own.
 */

export type Box = { x: number; y: number; width: number; height: number };

export type Size = { width: number; height: number };

/** A motif slot: centre in % of the box, size in px. */
export type ScatterSlot = { x: number; y: number; size: number; rotate: number };

export type Placed<T> = T & { left: number; top: number; index: number };

export const SCATTER_MARGIN = 6;

export function intersects(a: Box, b: Box, margin = 0): boolean {
  return (
    a.x - margin < b.x + b.width &&
    a.x + a.width + margin > b.x &&
    a.y - margin < b.y + b.height &&
    a.y + a.height + margin > b.y
  );
}

/** The pixel box of a slot inside a box of the given size. */
export function slotBox(slot: ScatterSlot, box: Size): Box {
  return {
    x: (slot.x / 100) * box.width - slot.size / 2,
    y: (slot.y / 100) * box.height - slot.size / 2,
    width: slot.size,
    height: slot.size,
  };
}

/**
 * Keeps the slots whose icon box (plus `margin`) touches no exclusion box. `left`/`top` are the
 * icon's top-left in px inside the box; `index` is the slot's position in the input, so a caller
 * can cycle icons deterministically.
 */
export function placeScatter<T extends ScatterSlot>(
  slots: readonly T[],
  box: Size,
  exclusions: readonly Box[],
  margin = SCATTER_MARGIN,
): Placed<T>[] {
  if (box.width <= 0 || box.height <= 0) return [];
  const placed: Placed<T>[] = [];
  slots.forEach((slot, index) => {
    const rect = slotBox(slot, box);
    if (exclusions.some((zone) => intersects(rect, zone, margin))) return;
    placed.push({ ...slot, left: rect.x, top: rect.y, index });
  });
  return placed;
}

/** Gap between stacked items on a hanger's thread. */
export const HANGER_GAP = 4;

export type HangerSlot = { x: number; thread: number; size: number; items: readonly unknown[] };

/** The box a hanger occupies: from the top edge down the thread and its stacked items. */
export function hangerBox(hanger: HangerSlot, box: Size): Box {
  return {
    x: (hanger.x / 100) * box.width - hanger.size / 2,
    y: 0,
    width: hanger.size,
    height: hanger.thread + hanger.items.length * (hanger.size + HANGER_GAP),
  };
}

export function placeHangers<T extends HangerSlot>(
  hangers: readonly T[],
  box: Size,
  exclusions: readonly Box[],
  margin = SCATTER_MARGIN,
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

/** Inset of a pattern band from its edge. */
export const BAND_INSET = 8;

/** Height of the strip a band occupies along its edge (used to end the tag's text exclusion). */
export function bandHeight(size: number): number {
  return size + BAND_INSET * 2;
}

/** Centres of `count` icons spread evenly along an edge of the box. */
export function bandPositions(
  count: number,
  size: number,
  box: Size,
  edge: "top" | "bottom",
): { left: number; top: number }[] {
  if (box.width <= 0 || count <= 0) return [];
  const step = box.width / count;
  const top = edge === "top" ? BAND_INSET : box.height - BAND_INSET - size;
  return Array.from({ length: count }, (_, i) => ({ left: step * (i + 0.5) - size / 2, top }));
}

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
  /** The element's horizontal extent from its top to the band strip (the tag's text column) */
  | "column";

export const TEXT_BAND_HEIGHT = 24;

export function exclusionFor(mode: ExclusionMode, el: Box, surface: Size, bandStrip = 0): Box {
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
    case "column":
      return {
        x: el.x,
        y: el.y,
        width: el.width,
        height: Math.max(0, surface.height - bandStrip - el.y),
      };
  }
}
