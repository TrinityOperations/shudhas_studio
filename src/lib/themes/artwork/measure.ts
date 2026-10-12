import {
  exclusionFor,
  type Box,
  type ExclusionMode,
  type HeaderGeometry,
  type Size,
} from "./place";

export const EXCLUDE_ATTR = "data-artwork-exclude";
/** On the header's brand: the name, which leaves the brand's layout when the header collapses. */
export const COLLAPSE_ATTR = "data-artwork-collapse";
/** On the header's brand: the mark, all that the brand holds once the header has collapsed. */
export const MARK_ATTR = "data-artwork-mark";
/** On the header's content rows (desktop grid, phone row) inside the padded top row. */
export const HEADER_CONTENT_ATTR = "data-header-content";

const MODES: ExclusionMode[] = ["full", "content", "brand", "text", "lines"];

function union(a: DOMRect | null, b: DOMRect): DOMRect {
  if (!a) return b;
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  return new DOMRect(
    left,
    top,
    Math.max(a.right, b.right) - left,
    Math.max(a.bottom, b.bottom) - top,
  );
}

/** Every line box of `el`'s text, then the box of each of its links and buttons. */
function lineRects(el: HTMLElement): DOMRect[] {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) if (r.width && r.height) rects.push(r);
  }
  for (const control of el.querySelectorAll<HTMLElement>("a, button")) {
    const r = control.getBoundingClientRect();
    if (r.width && r.height) rects.push(r);
  }
  return rects;
}

/**
 * The box around what a visitor can read or press inside `el`: the union of its text runs and
 * its links and buttons, rather than the block box, so a footer column's exclusion is as wide as
 * its longest line, not its grid cell.
 */
function contentRect(el: HTMLElement): DOMRect | null {
  return lineRects(el).reduce<DOMRect | null>(union, null);
}

const isShown = (el: Element) => el.getClientRects().length > 0;

/**
 * Reads the exclusion boxes a surface declares with `data-artwork-exclude="<mode>"` on its text
 * elements, relative to the surface's box. Browser only (the layers call it after mount).
 * "lines" gives one box per line of text and per link or button (the tag's centred text, the
 * footer's bottom line), so the room beside short lines stays usable.
 */
export function measureExclusions(surface: HTMLElement): Box[] {
  const origin = surface.getBoundingClientRect();
  const size: Size = { width: origin.width, height: origin.height };
  const relative = (r: DOMRect): Box => ({
    x: r.left - origin.left,
    y: r.top - origin.top,
    width: r.width,
    height: r.height,
  });
  const boxes: Box[] = [];
  for (const el of surface.querySelectorAll<HTMLElement>(`[${EXCLUDE_ATTR}]`)) {
    const mode = el.getAttribute(EXCLUDE_ATTR) as ExclusionMode;
    if (!MODES.includes(mode)) continue;
    if (mode === "lines") {
      boxes.push(...lineRects(el).map(relative));
      continue;
    }
    const r = mode === "content" ? contentRect(el) : el.getBoundingClientRect();
    if (!r || (r.width === 0 && r.height === 0)) continue;
    boxes.push(exclusionFor(mode, relative(r), size));
  }
  return boxes;
}

function cssPx(style: CSSStyleDeclaration, name: string): number {
  return Number.parseFloat(style.getPropertyValue(name));
}

/**
 * Reads the header's top row for `headerFrames` (place.ts). Every number is the same in either
 * state and during the collapse: the row's two fixed heights from globals.css, the brand's centre
 * (it is centred in both states), the mark's width, the gap and the name's width (layout widths,
 * which the mark's move and the name's fade do not change), and the actions' boxes. Rounded to
 * whole pixels so sub-pixel noise never re-places anything. Returns null while the row's content
 * is hidden (the other breakpoint's layer).
 */
export function measureHeader(row: HTMLElement): HeaderGeometry | null {
  const content = [...row.querySelectorAll<HTMLElement>(`[${HEADER_CONTENT_ATTR}]`)].find(isShown);
  if (!content) return null;
  const origin = row.getBoundingClientRect();
  const style = getComputedStyle(row);
  const heights = {
    top: cssPx(style, "--header-top-height"),
    small: cssPx(style, "--header-top-collapsed-height"),
  };
  if (Number.isNaN(heights.top) || Number.isNaN(heights.small)) return null;

  const c = content.getBoundingClientRect();
  const contentCentre = c.top + c.height / 2;
  const brandEl = content.querySelector<HTMLElement>(`[${EXCLUDE_ATTR}="brand"]`);
  let brand: HeaderGeometry["brand"] = null;
  if (brandEl && isShown(brandEl)) {
    const b = brandEl.getBoundingClientRect();
    const mark = brandEl.querySelector<HTMLElement>(`[${MARK_ATTR}]`);
    const name = brandEl.querySelector<HTMLElement>(`[${COLLAPSE_ATTR}]`);
    const markWidth = mark?.offsetWidth ?? Math.round(b.width);
    const nameWidth = name && isShown(name) ? name.offsetWidth : 0;
    const gap = nameWidth ? Number.parseFloat(getComputedStyle(brandEl).columnGap) || 0 : 0;
    brand = {
      centre: Math.round(b.left + b.width / 2 - origin.left),
      full: Math.round(markWidth + gap + nameWidth),
      mark: Math.round(markWidth),
    };
  }
  const texts = [...content.querySelectorAll<HTMLElement>(`[${EXCLUDE_ATTR}="text"]`)]
    .filter(isShown)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.left - origin.left),
        width: Math.round(r.width),
        height: Math.round(r.height),
        offset: Math.round(r.top + r.height / 2 - contentCentre),
      };
    });
  return { width: Math.round(origin.width), heights, brand, texts };
}
