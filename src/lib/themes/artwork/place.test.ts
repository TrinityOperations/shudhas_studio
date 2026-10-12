import { describe, expect, it } from "vitest";
import { HEADER_SLOTS, HEADER_SLOTS_NARROW } from "./data";
import {
  bandHeight,
  bandPositions,
  exclusionFor,
  hangerBox,
  intersects,
  placeHangers,
  placeScatter,
  slotBox,
  type Box,
} from "./place";

const slots = (rows: readonly (readonly [number, number, number, number])[]) =>
  rows.map(([x, y, size, rotate]) => ({ x, y, size, rotate }));

describe("placeScatter", () => {
  it("drops a slot whose box plus the 6px margin touches an exclusion box", () => {
    const box = { width: 1000, height: 100 };
    const zone: Box = { x: 400, y: 0, width: 200, height: 100 };
    const inside = { x: 50, y: 50, size: 20, rotate: 0 };
    const touching = { x: 38.5, y: 50, size: 20, rotate: 0 }; // right edge at 395 → 401 with margin
    const clear = { x: 37.5, y: 50, size: 20, rotate: 0 }; // right edge at 385 → 391 with margin
    expect(placeScatter([inside, touching, clear], box, [zone]).map((p) => p.index)).toEqual([2]);
    expect(placeScatter([inside], box, [zone], 0)).toHaveLength(0);
    expect(placeScatter([clear], box, [])).toEqual([{ ...clear, left: 365, top: 40, index: 0 }]);
  });

  it("returns nothing for a surface with no size (a hidden row)", () => {
    expect(placeScatter(slots(HEADER_SLOTS), { width: 0, height: 0 }, [])).toEqual([]);
  });

  it("1440 header row: the brand column and the actions' text band are kept clear", () => {
    // The desktop top row at 1440: 1400px wide, 80px tall. The brand is centred (mark + name
    // ≈ 300px); the actions' text band is the right 330px around the vertical centre.
    const row = { width: 1400, height: 80 };
    const brand = exclusionFor("brand", { x: 550, y: 20, width: 300, height: 40 }, row);
    const actions = exclusionFor("text", { x: 1070, y: 16, width: 330, height: 48 }, row);
    expect(brand).toEqual({ x: 550, y: 0, width: 300, height: 80 });
    expect(actions).toEqual({ x: 1070, y: 28, width: 330, height: 24 });
    const placed = placeScatter(slots(HEADER_SLOTS), row, [brand, actions]);
    // Every left-side slot survives; on the right only those above and below the band.
    const left = HEADER_SLOTS.filter(([x]) => x < 36).length;
    expect(placed.filter((p) => p.x < 36)).toHaveLength(left);
    const right = placed.filter((p) => p.x > 64);
    expect(right.length).toBeGreaterThan(0);
    for (const p of right) {
      const rect = slotBox(p, row);
      expect(intersects(rect, actions, 6)).toBe(false);
    }
    // A slot at the centre would be dropped.
    expect(placeScatter([{ x: 50, y: 50, size: 12, rotate: 0 }], row, [brand])).toEqual([]);
  });

  it("390 header row: eight small icons sit beside the brand and around the two buttons", () => {
    const row = { width: 390, height: 80 };
    const menu = exclusionFor("text", { x: 12, y: 18, width: 44, height: 44 }, row);
    const brand = exclusionFor("brand", { x: 108, y: 24, width: 174, height: 32 }, row);
    const heart = exclusionFor("text", { x: 334, y: 18, width: 44, height: 44 }, row);
    const placed = placeScatter(slots(HEADER_SLOTS_NARROW), row, [menu, brand, heart]);
    expect(placed.length).toBeGreaterThanOrEqual(6);
    for (const p of placed) {
      const rect = slotBox(p, row);
      expect(intersects(rect, brand, 6)).toBe(false);
      expect(intersects(rect, menu, 6)).toBe(false);
      expect(intersects(rect, heart, 6)).toBe(false);
    }
  });

  it("the tag's text column excludes everything from its top down to the band", () => {
    const tag = { width: 1040, height: 420 };
    const strip = bandHeight(16);
    const column = exclusionFor("column", { x: 232, y: 80, width: 768, height: 260 }, tag, strip);
    expect(column).toEqual({ x: 232, y: 80, width: 768, height: 420 - strip - 80 });
    // A motif low in the column (below the button) is still dropped; one in the band strip or
    // the hanger strip survives; one on the hole side survives.
    const low = { x: 60, y: 85, size: 40, rotate: 0 };
    const band = { x: 60, y: 97, size: 14, rotate: 0 };
    const hanger = { x: 60, y: 6, size: 30, rotate: 0 };
    const hole = { x: 12, y: 50, size: 60, rotate: 0 };
    expect(placeScatter([low, band, hanger, hole], tag, [column]).map((p) => p.index)).toEqual([
      1, 2, 3,
    ]);
  });

  it("hangers are boxes from the top edge and obey the same rule", () => {
    const tag = { width: 1040, height: 420 };
    const hanger = { x: 15, thread: 36, items: ["lantern"], size: 36 };
    expect(hangerBox(hanger, tag)).toEqual({ x: 138, y: 0, width: 36, height: 76 });
    // The box reaches 76px; with the 6px margin it clears a column starting at 90px.
    const column: Box = { x: 100, y: 90, width: 800, height: 300 };
    expect(placeHangers([hanger], tag, [column])).toHaveLength(1);
    const deep = { ...hanger, thread: 96 }; // reaches 136px, past the column's top
    expect(placeHangers([deep], tag, [column])).toHaveLength(0);
  });

  it("bands spread evenly along the chosen edge", () => {
    const positions = bandPositions(4, 16, { width: 400, height: 200 }, "bottom");
    expect(positions.map((p) => p.left)).toEqual([42, 142, 242, 342]);
    expect(positions.every((p) => p.top === 200 - 8 - 16)).toBe(true);
    expect(bandPositions(2, 10, { width: 100, height: 50 }, "top")[0].top).toBe(8);
    expect(bandPositions(3, 10, { width: 0, height: 50 }, "top")).toEqual([]);
  });
});
