import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/lib/themes/themes";
import { FACT_ICONS, HDR, POOLS, THEME_ARTWORK } from "./data";
import { isSeasonIconName, SEASON_ICON_NAMES, SEASON_ICONS } from "./icons";
import { artworkIconNames } from "./names";

/** A path is a run of SVG commands and numbers; it starts with a move and never contains NaN. */
const PATH = /^M[\s\S]*$/;
const PATH_CHARS = /^[MmZzLlHhVvCcSsQqTtAa0-9.,\s-]+$/;

describe("season icon registry", () => {
  it("holds 38 icons with a label and at least one parseable path each", () => {
    expect(SEASON_ICON_NAMES).toHaveLength(38);
    for (const name of SEASON_ICON_NAMES) {
      const icon = SEASON_ICONS[name];
      expect(icon.label.length, name).toBeGreaterThan(0);
      expect(icon.s.length + icon.f.length, name).toBeGreaterThan(0);
      for (const path of [icon.s, icon.f]) {
        if (!path) continue;
        expect(path, name).toMatch(PATH);
        expect(path, name).toMatch(PATH_CHARS);
        expect(path, name).not.toContain("NaN");
      }
    }
    expect(isSeasonIconName("crescent")).toBe(true);
    expect(isSeasonIconName("toString")).toBe(false);
  });

  it("every icon a theme references exists, and every theme has artwork", () => {
    const HEX = /^#[0-9A-F]{6}$/;
    for (const id of THEME_IDS) {
      const art = THEME_ARTWORK[id];
      expect(art, id).toBeDefined();
      expect(art.deco).toMatch(HEX);
      expect(art.pop).toMatch(HEX);
      expect(art.headerIcons).toHaveLength(3);
      expect(art.set.length, id).toBeGreaterThanOrEqual(5);
      expect(new Set(art.set).size, `${id} set has duplicates`).toBe(art.set.length);
      for (const name of artworkIconNames(id)) expect(isSeasonIconName(name), name).toBe(true);
    }
    // Everyday is never bare: the kantha flower and needle are among its motifs.
    expect(THEME_ARTWORK.everyday.tag.hero?.icon).toBe("kantha");
    expect(THEME_ARTWORK.everyday.headerIcons).toEqual(["kantha", "needle", "bow"]);
    expect(THEME_ARTWORK.everyday.set).toContain("needle");
    expect(FACT_ICONS).toHaveLength(4);
  });

  it("each theme's pop colour and filler are the approved ones", () => {
    const pops = Object.fromEntries(THEME_IDS.map((id) => [id, THEME_ARTWORK[id].pop]));
    expect(pops).toEqual({
      everyday: "#C8862F",
      eid: "#C9962E",
      "pohela-boishakh": "#D9960F",
      wedding: "#E07B16",
      christmas: "#2F6A44",
      "mothers-day": "#C9617F",
      valentines: "#E0566F",
    });
    const fillers = Object.fromEntries(THEME_IDS.map((id) => [id, THEME_ARTWORK[id].headerFiller]));
    expect(fillers).toEqual({
      everyday: "dotstar",
      eid: "sparkle",
      "pohela-boishakh": "dotstar",
      wedding: "dotstar",
      christmas: "star5",
      "mothers-day": "heart",
      valentines: "heartfill",
    });
  });

  it("sprite names are unique, sorted and limited to what the theme uses", () => {
    const names = artworkIconNames("eid");
    expect(names).toEqual([...new Set(names)].sort());
    expect(names).toContain("lantern");
    expect(names).not.toContain("kite");
    expect(names.length).toBeLessThan(SEASON_ICON_NAMES.length);
  });

  it("the header tables have 24, 24, 6 and 7 icons, each a valid colour, icon and anchor", () => {
    expect([HDR.top, HDR.small, HDR.phoneTop, HDR.phoneSmall].map((t) => t.length)).toEqual([
      24, 24, 6, 7,
    ]);
    for (const table of Object.values(HDR)) {
      for (const [dx, , size, , colour, icon, anchor = "c"] of table) {
        expect(size).toBeGreaterThan(0);
        expect(["a", "p"]).toContain(colour);
        expect([0, 1, 2, "f"]).toContain(icon);
        expect(["c", "l", "r"]).toContain(anchor);
        // Edge-anchored icons are measured in from their edge.
        if (anchor !== "c") expect(dx).toBeGreaterThan(0);
      }
    }
    // The outermost icons on both sides of every table are anchored to the edges.
    for (const table of Object.values(HDR)) {
      expect(table.some(([, , , , , , a]) => a === "l")).toBe(true);
      expect(table.some(([, , , , , , a]) => a === "r")).toBe(true);
    }
  });

  it("the pools sit inside their surface with sizes and colours from the mock-up", () => {
    expect(Object.fromEntries(Object.entries(POOLS).map(([k, v]) => [k, v.length]))).toEqual({
      tag: 25,
      tagPhone: 14,
      foot: 23,
      footPhone: 12,
    });
    for (const pool of Object.values(POOLS)) {
      for (const [x, y, size, , colour] of pool) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
        expect(size).toBeGreaterThanOrEqual(10);
        expect(["w", "d"]).toContain(colour);
      }
    }
  });
});
