import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/lib/themes/themes";
import { FACT_ICONS, HEADER_SLOTS, HEADER_SLOTS_NARROW, THEME_ARTWORK } from "./data";
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
    for (const id of THEME_IDS) {
      const art = THEME_ARTWORK[id];
      expect(art, id).toBeDefined();
      expect(art.deco).toMatch(/^#[0-9A-F]{6}$/);
      expect(art.headerIcons.length).toBeGreaterThan(0);
      for (const name of artworkIconNames(id)) expect(isSeasonIconName(name), name).toBe(true);
      // Everyday is never bare: the kantha flower and needle are its motifs.
      if (id === "everyday") {
        expect(art.tag.hero?.icon).toBe("kantha");
        expect(art.tag.scatter.map((m) => m.icon)).toContain("needle");
      }
    }
    expect(FACT_ICONS).toHaveLength(4);
  });

  it("sprite names are unique, sorted and limited to what the theme uses", () => {
    const names = artworkIconNames("eid");
    expect(names).toEqual([...new Set(names)].sort());
    expect(names).toContain("lantern");
    expect(names).not.toContain("kite");
    expect(names.length).toBeLessThan(SEASON_ICON_NAMES.length);
  });

  it("header slots stay inside the row and out of the brand column", () => {
    for (const [x, y, size] of HEADER_SLOTS) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
      expect(size).toBeGreaterThanOrEqual(10);
      expect(size).toBeLessThanOrEqual(22);
      expect(x < 36 || x > 64, `slot at ${x}% sits in the brand column`).toBe(true);
    }
    expect(HEADER_SLOTS_NARROW).toHaveLength(8);
  });
});
