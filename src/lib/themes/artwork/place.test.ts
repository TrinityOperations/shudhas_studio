import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/lib/themes/themes";
import {
  BAND_LAYOUT,
  HDR,
  POOL_FILLER_BELOW,
  POOL_OPACITY,
  POOLS,
  THEME_ARTWORK,
  type PoolName,
  type PoolSlot,
} from "./data";
import {
  assignPool,
  bandPositions,
  compactHero,
  exclusionFor,
  hangerBox,
  headerBox,
  headerCentreX,
  headerFrames,
  headerOffset,
  heroBox,
  intersects,
  layoutSurface,
  opacityTier,
  placeHangers,
  placeHeader,
  poolSlotBox,
  resolveHeaderTable,
  type Box,
  type HeaderGeometry,
  type Size,
} from "./place";

const everyday = THEME_ARTWORK.everyday;

describe("header placement", () => {
  // Measured on the dev page (13 Oct 2026): the row's fixed heights, the brand's centre, its
  // width with the name and the mark's alone, and the actions' text boxes.
  const at1440: HeaderGeometry = {
    width: 1440,
    heights: { top: 86, small: 64 },
    brand: { centre: 720, full: 258, mark: 40 },
    texts: [
      { x: 1103, width: 44, height: 44, offset: 0 },
      { x: 1155, width: 49, height: 28, offset: 0 },
      { x: 1212, width: 184, height: 50, offset: 0 },
    ],
  };
  const at1024: HeaderGeometry = {
    width: 1024,
    heights: { top: 80, small: 64 },
    brand: { centre: 512, full: 217, mark: 40 },
    texts: [
      { x: 727, width: 44, height: 44, offset: 0 },
      { x: 779, width: 49, height: 28, offset: 0 },
      { x: 836, width: 164, height: 40, offset: 0 },
    ],
  };
  const at390: HeaderGeometry = {
    width: 390,
    heights: { top: 80, small: 64 },
    brand: { centre: 195, full: 195, mark: 32 },
    texts: [
      { x: 12, width: 44, height: 44, offset: 0 },
      { x: 334, width: 44, height: 44, offset: 0 },
    ],
  };
  const top = resolveHeaderTable(HDR.top, everyday);
  const small = resolveHeaderTable(HDR.small, everyday);
  const phoneTop = resolveHeaderTable(HDR.phoneTop, everyday);
  const phoneSmall = resolveHeaderTable(HDR.phoneSmall, everyday);
  const dropped = (icons: typeof top, kept: number[]) =>
    icons.filter((_, i) => !kept.includes(i)).map((icon) => icon.dx);

  it("resolves a table: icons by index or filler, rendered size = round(size × 1.1), anchors", () => {
    expect(top[0]).toEqual({
      icon: "kantha",
      dx: -204,
      dy: 30,
      size: 11,
      rotate: -8,
      colour: "a",
      anchor: "c",
    });
    expect(top[1]).toMatchObject({ icon: "dotstar", size: 8, colour: "p" });
    expect(top[3]).toMatchObject({ icon: "bow", size: 10 });
    expect(top[12]).toMatchObject({ icon: "kantha", dx: 4, size: 15, anchor: "l" });
    expect(top[21]).toMatchObject({ icon: "needle", dx: 6, anchor: "r" });
    expect(small[1]).toMatchObject({ icon: "dotstar", size: 8 });
  });

  it("dx is from the row's centre, or in from an edge; the slide is a share of the offset", () => {
    expect(headerCentreX({ dx: -204, anchor: "c" }, 1440)).toBe(516);
    expect(headerCentreX({ dx: 4, anchor: "l" }, 1440)).toBe(4);
    expect(headerCentreX({ dx: 6, anchor: "r" }, 1440)).toBe(1434);
    expect(headerCentreX({ dx: 6, anchor: "r" }, 1024)).toBe(1018);
    expect(headerOffset({ dx: 4, anchor: "l" }, 1440)).toBe(-716);
    expect(headerOffset({ dx: 6, anchor: "r" }, 1440)).toBe(714);
    expect(headerOffset({ dx: 338, anchor: "c" }, 1440)).toBe(338);
  });

  it("each state has its own fixed row, centred content and brand: mark and name, then the mark", () => {
    const frames = headerFrames(at1440);
    expect(frames.top).toMatchObject({ width: 1440, height: 86, anchorY: 43 });
    expect(frames.small).toMatchObject({ width: 1440, height: 64, anchorY: 32 });
    expect(frames.top.exclusions[0]).toEqual({ x: 591, y: 0, width: 258, height: 86 });
    expect(frames.small.exclusions[0]).toEqual({ x: 700, y: 0, width: 40, height: 64 });
    // Actions: a 24px band round the row's centre in each state (43 at the top, 32 collapsed).
    expect(frames.top.exclusions[1]).toEqual({ x: 1103, y: 31, width: 44, height: 24 });
    expect(frames.small.exclusions[1]).toEqual({ x: 1103, y: 20, width: 44, height: 24 });
    expect(headerBox(top[0], frames.top)).toEqual({ x: 510.5, y: 67.5, width: 11, height: 11 });
  });

  it("1440: all 24 top icons stay; collapsed, the three touching the 50px Book pill go", () => {
    const frames = headerFrames(at1440);
    expect(placeHeader(top, frames.top)).toHaveLength(24);
    expect(dropped(small, placeHeader(small, frames.small))).toEqual([562, 638, 72]);
    // The pill is taller than 48px, so its whole box is kept clear as well as its text band.
    expect(frames.small.exclusions.at(-1)).toEqual({ x: 1212, y: 7, width: 184, height: 50 });
  });

  it("1024: centre-anchored icons beyond ±512 go, edge-anchored ones stay, some sit under actions", () => {
    const frames = headerFrames(at1024);
    const keptTop = placeHeader(top, frames.top);
    expect(dropped(top, keptTop)).toEqual([-548, -606, 286, 560, 640]);
    expect(dropped(small, placeHeader(small, frames.small))).toEqual([
      -536, -592, 284, 332, 562, 638,
    ]);
    const edges = top.flatMap((icon, i) => (icon.anchor === "c" ? [] : [i]));
    expect(edges.every((i) => keptTop.includes(i))).toBe(true);
    expect(headerBox(top[12], frames.top).x).toBeLessThan(0); // the 4px one, half cut off
  });

  it("390: the phone tables keep 5 of 6 at the top and all 7 collapsed", () => {
    const frames = headerFrames(at390);
    expect(placeHeader(phoneTop, frames.top)).toEqual([0, 1, 2, 4, 5]); // 136 meets the heart
    expect(placeHeader(phoneSmall, frames.small)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("no kept icon touches its state's brand or an action's text band", () => {
    for (const [g, sets] of [
      [at1440, [top, small]],
      [at1024, [top, small]],
      [at390, [phoneTop, phoneSmall]],
    ] as const) {
      const frames = headerFrames(g);
      for (const [icons, frame] of [
        [sets[0], frames.top],
        [sets[1], frames.small],
      ] as const) {
        for (const i of placeHeader(icons, frame)) {
          const box = headerBox(icons[i], frame);
          for (const zone of frame.exclusions) expect(intersects(box, zone)).toBe(false);
        }
      }
    }
  });

  it("an icon is dropped when its centre leaves the row, not when its box crosses an edge", () => {
    const frame = { width: 400, height: 80, anchorY: 40, exclusions: [] };
    const icons = [
      { dx: 2, dy: 0, size: 14, anchor: "l" as const }, // box crosses the left edge: stays
      { dx: -2, dy: 0, size: 14, anchor: "l" as const }, // centre outside: goes
      { dx: 3, dy: 36, size: 14, anchor: "r" as const }, // box crosses the bottom: stays
      { dx: 3, dy: 41, size: 14, anchor: "r" as const }, // centre below the row: goes
      { dx: 204, dy: 0, size: 10 }, // centre past the right edge: goes
    ];
    expect(placeHeader(icons, frame)).toEqual([0, 2]);
    const brand = { x: 180, y: 0, width: 40, height: 80 };
    const near = (dx: number) => ({ dx, dy: 0, size: 10 });
    expect(placeHeader([near(-25)], { ...frame, exclusions: [brand] })).toEqual([0]); // 175 < 180
    expect(placeHeader([near(-24)], { ...frame, exclusions: [brand] })).toEqual([]); // touches
    expect(placeHeader(top, { ...frame, width: 0 })).toEqual([]);
  });
});

describe("pool rules", () => {
  const box = { width: 1000, height: 400 };

  it("a slot's box is its size plus 4px each side; the hero's is its size, no margin", () => {
    expect(poolSlotBox([50, 50, 20, 0, "w"], box)).toEqual({
      x: 486,
      y: 186,
      width: 28,
      height: 28,
    });
    expect(heroBox({ x: 50, y: 50, size: 100 }, box)).toEqual({
      x: 450,
      y: 150,
      width: 100,
      height: 100,
    });
  });

  it("opacity tiers: ≥ 40, ≥ 24, smaller", () => {
    expect([54, 40, 39, 24, 23, 10].map(opacityTier)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it("assigns biggest first: the set once in order, then cycles, filler under the limit", () => {
    const slot = (size: number): PoolSlot => [0, 0, size, 0, "w"];
    const survivors = [slot(14), slot(30), slot(18), slot(30), slot(54), slot(12), slot(20)].map(
      (s, index) => ({ slot: s, index }),
    );
    const assigned = assignPool(survivors, ["a", "b", "c"] as never, "f" as never, 16);
    expect(assigned.map((a) => [a.index, a.icon])).toEqual([
      [4, "a"], // 54
      [1, "b"], // 30, earlier in the pool
      [3, "c"], // 30
      [6, "a"], // 20: cycles
      [2, "b"], // 18
      [0, "f"], // 14 < 16: filler
      [5, "f"], // 12
    ]);
    // With fewer survivors than the set, the small ones still take set icons.
    expect(
      assignPool(survivors.slice(0, 2), ["a", "b", "c"] as never, "f" as never, 16).map(
        (a) => a.icon,
      ),
    ).toEqual(["a", "b"]);
  });

  it("drops slots under text, the hero and the hangers before assigning, so no icon is lost", () => {
    const text: Box[] = [{ x: 0, y: 0, width: 400, height: 400 }];
    const layout = layoutSurface({
      box,
      text,
      pool: [
        [10, 50, 30, 0, "w"], // under the text
        [60, 50, 20, 0, "d"], // under the hero
        [95, 10, 16, 0, "w"], // under the hanger
        [70, 90, 18, 0, "w"],
        [50, 90, 14, 0, "d"],
      ],
      set: ["kite", "fan"],
      filler: "dotstar",
      fillerBelow: 16,
      tiers: POOL_OPACITY.tag,
      hero: { icon: "alpona", x: 62, y: 50, size: 80, rotate: 0, colour: "deco", opacity: 0.9 },
      hangers: [{ x: 95, thread: 20, items: ["lantern"], size: 30, colour: "deco", opacity: 1 }],
      band: { icon: "alpona", size: 16, count: 10, colour: "ivory", opacity: 0.3 },
      bandLayout: { edge: "bottom", inset: 16, padding: 100 },
    });
    expect(layout.hero?.icon).toBe("alpona");
    expect(layout.hangers).toHaveLength(1);
    expect(layout.motifs.map((m) => [m.index, m.icon, m.colour, m.opacity])).toEqual([
      [3, "kite", "ivory", 0.55],
      [4, "fan", "deco", 0.85],
    ]);
    expect(layout.missing).toEqual([]);
    expect(layout.band).toHaveLength(10);
  });

  it("a hero or hanger that meets text is dropped and frees its slots; a missing icon is reported", () => {
    const layout = layoutSurface({
      box,
      text: [{ x: 500, y: 0, width: 200, height: 400 }],
      pool: [[62, 20, 20, 0, "w"]],
      set: ["kite", "fan"],
      filler: "dotstar",
      fillerBelow: 16,
      tiers: POOL_OPACITY.footer,
      hero: { icon: "alpona", x: 55, y: 50, size: 80, rotate: 0, colour: "deco", opacity: 0.9 },
      hangers: [{ x: 60, thread: 20, items: ["lantern"], size: 30, colour: "deco", opacity: 1 }],
      band: null,
      bandLayout: { edge: "top", inset: 14, padding: 24 },
    });
    expect(layout.hero).toBeNull();
    expect(layout.hangers).toEqual([]);
    expect(layout.motifs).toHaveLength(0); // the slot itself is under the text
    expect(layout.missing).toEqual(["kite", "fan"]);
  });

  it("below lg the tag's hero is 45% at the top right and the footer's 50% in place", () => {
    expect(compactHero("tag", THEME_ARTWORK.eid.tag.hero)).toMatchObject({
      size: 81,
      x: 92,
      y: 10,
    });
    expect(compactHero("footer", THEME_ARTWORK.eid.footer.hero)).toMatchObject({
      size: 60,
      x: 92,
      y: 30,
    });
    expect(compactHero("tag", null)).toBeNull();
  });

  it("hangers are boxes from the top edge and clear text by 6px", () => {
    const tag = { width: 1040, height: 420 };
    const hanger = { x: 15, thread: 36, items: ["lantern"], size: 36 };
    expect(hangerBox(hanger, tag)).toEqual({ x: 138, y: 0, width: 36, height: 76 });
    const column: Box = { x: 100, y: 90, width: 800, height: 300 };
    expect(placeHangers([hanger], tag, [column])).toHaveLength(1);
    expect(placeHangers([{ ...hanger, thread: 96 }], tag, [column])).toHaveLength(0);
  });

  it("the brand excludes the full row height; an action's text a 24px band", () => {
    const row = { width: 1400, height: 80 };
    expect(exclusionFor("brand", { x: 550, y: 20, width: 300, height: 40 }, row)).toEqual({
      x: 550,
      y: 0,
      width: 300,
      height: 80,
    });
    expect(exclusionFor("text", { x: 1070, y: 16, width: 330, height: 48 }, row)).toEqual({
      x: 1070,
      y: 28,
      width: 330,
      height: 24,
    });
  });

  it("bands spread evenly between their end padding, inset from their edge", () => {
    const bottom = { edge: "bottom", inset: 16, padding: 100 } as const;
    const positions = bandPositions(4, 16, { width: 600, height: 200 }, bottom);
    expect(positions.map((p) => p.left)).toEqual([142, 242, 342, 442]);
    expect(positions.every((p) => p.top === 200 - 16 - 16)).toBe(true);
    const top = { edge: "top", inset: 14, padding: 24 } as const;
    expect(bandPositions(2, 10, { width: 100, height: 50 }, top)[0]).toEqual({ left: 32, top: 14 });
    expect(bandPositions(3, 10, { width: 200, height: 50 }, bottom)).toEqual([]);
  });
});

/**
 * The guard: every icon in a theme's set appears at least once on the tag and on the footer
 * (hero, hangers and band count), for every theme at 1440, 1280, 1024, 768 and 390, through the
 * same `layoutSurface` the layers run.
 */
describe("every icon in the set, every time", () => {
  const WIDTHS = [1440, 1280, 1024, 768, 390] as const;
  type Edges = readonly [left: number, top: number, right: number, bottom: number];
  const pct =
    (box: Size) =>
    ([l, t, r, b]: Edges): Box => ({
      x: (l / 100) * box.width,
      y: (t / 100) * box.height,
      width: ((r - l) / 100) * box.width,
      height: ((b - t) / 100) * box.height,
    });

  // The mock-up's stand-in text boxes, % of the canvas boxes the pools were drawn on.
  const CANVAS: Record<PoolName, { height: number; text: Edges[] }> = {
    tag: {
      height: 440,
      text: [
        [27, 13, 85, 84],
        [0, 38, 15, 56],
      ],
    },
    tagPhone: {
      height: 330,
      text: [
        [15, 13, 95, 83],
        [0, 40, 21, 54],
      ],
    },
    foot: {
      height: 352,
      text: [
        [5, 19, 28, 50],
        [30, 19, 40, 70],
        [49.5, 19, 58.5, 70],
        [68.5, 19, 79, 70],
        [4, 82, 22, 96],
        [86, 82, 96, 96],
      ],
    },
    footPhone: {
      height: 850,
      text: [
        [4, 6, 85, 20],
        [4, 20, 52, 90],
        [4, 90, 96, 99],
      ],
    },
  };

  type Rect = readonly [x: number, y: number, width: number, height: number];
  const rect = ([x, y, width, height]: Rect): Box => ({ x, y, width, height });

  // Measured on the dev page (13 Oct 2026, the Eid banner copy) as the layers read them: the
  // tag's text by its lines and its button, the footer's brand block and link columns by their
  // content, its bottom line by its lines. Boxes are [x, y, width, height] in px.
  const MEASURED: Record<
    (typeof WIDTHS)[number],
    { tag: Size & { boxes: Rect[] }; foot: Size & { boxes: Rect[] } }
  > = {
    1440: {
      tag: {
        width: 1040,
        height: 459,
        boxes: [
          [505, 81, 98, 21],
          [305, 103, 497, 85],
          [278, 163, 552, 85],
          [400, 223, 308, 85],
          [484, 343, 139, 19],
          [458, 328, 191, 51],
        ],
      },
      foot: {
        width: 1440,
        height: 329,
        boxes: [
          [104, 48, 317, 84],
          [498, 57, 100, 152],
          [791, 57, 128, 152],
          [1083, 57, 144, 152],
          [104, 289, 231, 18],
          [1249, 289, 47, 18],
          [1299, 289, 4, 18],
          [1307, 292, 29, 14],
        ],
      },
    },
    1280: {
      tag: {
        width: 1040,
        height: 451,
        boxes: [
          [505, 81, 98, 21],
          [315, 103, 477, 82],
          [289, 161, 530, 82],
          [406, 218, 296, 82],
          [484, 336, 139, 19],
          [458, 321, 191, 51],
        ],
      },
      foot: {
        width: 1280,
        height: 329,
        boxes: [
          [24, 48, 317, 84],
          [418, 57, 100, 152],
          [711, 57, 128, 152],
          [1003, 57, 144, 152],
          [24, 289, 231, 18],
          [1169, 289, 47, 18],
          [1219, 289, 4, 18],
          [1227, 292, 29, 14],
        ],
      },
    },
    1024: {
      tag: {
        width: 976,
        height: 417,
        boxes: [
          [473, 81, 98, 21],
          [331, 106, 382, 65],
          [243, 152, 558, 65],
          [471, 198, 103, 65],
          [452, 301, 139, 19],
          [426, 286, 191, 51],
        ],
      },
      foot: {
        width: 1024,
        height: 329,
        boxes: [
          [24, 48, 232, 108],
          [336, 57, 100, 152],
          [571, 57, 128, 152],
          [805, 57, 144, 152],
          [24, 289, 231, 18],
          [913, 289, 47, 18],
          [963, 289, 4, 18],
          [971, 292, 29, 14],
        ],
      },
    },
    768: {
      tag: {
        width: 736,
        height: 335,
        boxes: [
          [319, 57, 98, 21],
          [40, 83, 656, 57],
          [239, 123, 258, 57],
          [298, 219, 139, 19],
          [272, 204, 191, 51],
        ],
      },
      foot: {
        width: 768,
        height: 851,
        boxes: [
          [24, 48, 317, 84],
          [24, 191, 100, 152],
          [24, 385, 128, 152],
          [24, 580, 144, 152],
          [24, 812, 231, 18],
          [657, 811, 47, 18],
          [707, 811, 4, 18],
          [715, 814, 29, 14],
        ],
      },
    },
    390: {
      tag: {
        width: 358,
        height: 415,
        boxes: [
          [130, 57, 98, 21],
          [51, 83, 255, 57],
          [47, 123, 264, 57],
          [64, 163, 230, 57],
          [105, 203, 147, 57],
          [109, 299, 139, 19],
          [83, 284, 191, 51],
        ],
      },
      foot: {
        width: 390,
        height: 851,
        boxes: [
          [24, 48, 317, 84],
          [24, 191, 100, 152],
          [24, 385, 128, 152],
          [24, 580, 144, 152],
          [24, 812, 231, 18],
          [279, 811, 47, 18],
          [329, 811, 4, 18],
          [337, 814, 29, 14],
        ],
      },
    },
  };

  const bandLayout = (surface: "tag" | "footer", compact: boolean) => {
    const l = BAND_LAYOUT[surface];
    return {
      edge: l.edge,
      inset: l.inset,
      padding: compact ? l.padding.compact : l.padding.wide,
    };
  };

  function layouts(
    id: (typeof THEME_IDS)[number],
    vw: number,
    boxes: { tag: Size; tagText: Box[]; foot: Size; footText: Box[] },
  ) {
    const art = THEME_ARTWORK[id];
    const compact = vw < 1024;
    const common = { set: art.set, filler: art.headerFiller };
    const fillerBelow = compact ? POOL_FILLER_BELOW.compact : POOL_FILLER_BELOW.wide;
    const tag = layoutSurface({
      ...common,
      box: boxes.tag,
      text: boxes.tagText,
      pool: POOLS[compact ? "tagPhone" : "tag"],
      fillerBelow,
      tiers: POOL_OPACITY.tag,
      hero: compact ? compactHero("tag", art.tag.hero) : art.tag.hero,
      hangers: compact ? [] : art.tag.hangers,
      band: compact ? { ...art.tag.band, count: BAND_LAYOUT.tag.compactCount } : art.tag.band,
      bandLayout: bandLayout("tag", compact),
    });
    const foot = layoutSurface({
      ...common,
      box: boxes.foot,
      text: boxes.footText,
      pool: POOLS[compact ? "footPhone" : "foot"],
      fillerBelow,
      tiers: POOL_OPACITY.footer,
      hero: compact ? compactHero("footer", art.footer.hero) : art.footer.hero,
      hangers: compact ? [] : art.footer.hangers,
      band: compact
        ? { ...art.footer.band, count: BAND_LAYOUT.footer.compactCount }
        : art.footer.band,
      bandLayout: bandLayout("footer", compact),
    });
    return { tag, foot };
  }

  for (const id of THEME_IDS) {
    it(`${id}: with the mock-up's text boxes and the real 560px block`, () => {
      const art = THEME_ARTWORK[id];
      for (const vw of WIDTHS) {
        const compact = vw < 1024;
        const tagCanvas = CANVAS[compact ? "tagPhone" : "tag"];
        const footCanvas = CANVAS[compact ? "footPhone" : "foot"];
        const tag = { width: Math.min(1040, vw - (compact ? 32 : 48)), height: tagCanvas.height };
        const foot = { width: vw, height: footCanvas.height };
        // The 560px block from lg, centred between the tag's 140px and 72px side padding, from
        // its top (80px) down to the band strip.
        const strip = art.tag.band.size + 16;
        const x = 140 + (tag.width - 140 - 72 - 560) / 2;
        const block = { x, y: 80, width: 560, height: tag.height - strip - 80 };
        const { tag: t, foot: f } = layouts(id, vw, {
          tag,
          tagText: [...tagCanvas.text.map(pct(tag)), ...(compact ? [] : [block])],
          foot,
          footText: footCanvas.text.map(pct(foot)),
        });
        expect(t.missing, `tag ${vw}`).toEqual([]);
        expect(f.missing, `footer ${vw}`).toEqual([]);
      }
    });

    it(`${id}: with the boxes measured on the page`, () => {
      for (const vw of WIDTHS) {
        const m = MEASURED[vw];
        const tagText = m.tag.boxes.map(rect);
        const footText = m.foot.boxes.map(rect);
        const { tag, foot } = layouts(id, vw, { tag: m.tag, tagText, foot: m.foot, footText });
        expect(tag.missing, `tag ${vw}`).toEqual([]);
        expect(foot.missing, `footer ${vw}`).toEqual([]);
        // Never under text: no placed motif, hero or hanger meets a text box.
        for (const [layout, text, box] of [
          [tag, tagText, m.tag],
          [foot, footText, m.foot],
        ] as const) {
          const drawn = [
            ...layout.motifs.map((mo) => ({
              x: mo.left,
              y: mo.top,
              width: mo.size,
              height: mo.size,
            })),
            ...(layout.hero ? [heroBox(layout.hero, box)] : []),
            ...layout.hangers.map((h) => hangerBox(h, box)),
          ];
          for (const d of drawn) for (const zone of text) expect(intersects(d, zone)).toBe(false);
        }
      }
    });
  }
});
