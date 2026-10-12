import { exclusionFor, type Box, type ExclusionMode, type Size } from "./place";

export const EXCLUDE_ATTR = "data-artwork-exclude";

const MODES: ExclusionMode[] = ["full", "content", "brand", "text", "column"];

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

/**
 * The box around what a visitor can read or press inside `el`: the union of its text runs and
 * its links and buttons, rather than the block box, so a footer column's exclusion is as wide as
 * its longest line, not its grid cell.
 */
function contentRect(el: HTMLElement): DOMRect | null {
  let rect: DOMRect | null = null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) if (r.width && r.height) rect = union(rect, r);
  }
  for (const control of el.querySelectorAll<HTMLElement>("a, button")) {
    const r = control.getBoundingClientRect();
    if (r.width && r.height) rect = union(rect, r);
  }
  return rect;
}

/**
 * Reads the exclusion boxes a surface declares with `data-artwork-exclude="<mode>"` on its text
 * elements, relative to the surface's box. Browser only (the layer calls it after mount).
 */
export function measureExclusions(surface: HTMLElement, bandStrip = 0): Box[] {
  const origin = surface.getBoundingClientRect();
  const size: Size = { width: origin.width, height: origin.height };
  const boxes: Box[] = [];
  for (const el of surface.querySelectorAll<HTMLElement>(`[${EXCLUDE_ATTR}]`)) {
    const mode = el.getAttribute(EXCLUDE_ATTR) as ExclusionMode;
    if (!MODES.includes(mode)) continue;
    const r = mode === "content" ? contentRect(el) : el.getBoundingClientRect();
    if (!r || (r.width === 0 && r.height === 0)) continue;
    const rel: Box = {
      x: r.left - origin.left,
      y: r.top - origin.top,
      width: r.width,
      height: r.height,
    };
    boxes.push(exclusionFor(mode, rel, size, bandStrip));
  }
  return boxes;
}
