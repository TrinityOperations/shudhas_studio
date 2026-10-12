import { describe, expect, it } from "vitest";
import { AA_NORMAL_TEXT, contrastRatio } from "./contrast";
import { DEFAULT_THEME_ID, getTheme, isThemeId, THEME_IDS, THEMES } from "./themes";

const WHITE = "#FFFFFF";
/** The neutrals in globals.css (docs/design.md, "Colour"). */
const PAPER = "#F5EFE4";
const IVORY = "#FBF8F2";
const LINEN = "#EFE7D8";
const MIST = "#EDF0EA";
const MUTED = "#6B635B";
/** Ivory text on every accent (buttons, the tag, the footer) stays at AAA. */
const AAA_NORMAL_TEXT = 7;

describe("theme definitions", () => {
  it("have unique ids and the everyday fallback first", () => {
    expect(new Set(THEME_IDS).size).toBe(THEMES.length);
    expect(THEMES[0].id).toBe(DEFAULT_THEME_ID);
    expect(getTheme("nope").id).toBe(DEFAULT_THEME_ID);
    expect(getTheme(null).id).toBe(DEFAULT_THEME_ID);
    expect(getTheme("eid").accent).toBe("#2D4356");
    expect(isThemeId("eid")).toBe(true);
    expect(isThemeId("EID")).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });

  it.each(THEMES.map((theme) => [theme.id, theme.accent] as const))(
    "%s (%s) passes WCAG AA against white and paper, and AAA for ivory text",
    (_id, accent) => {
      expect(accent).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrastRatio(accent, WHITE)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      expect(contrastRatio(accent, PAPER)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      expect(contrastRatio(accent, IVORY)).toBeGreaterThanOrEqual(AAA_NORMAL_TEXT);
    },
  );

  it("muted text keeps AA on paper, linen, ivory and mist", () => {
    for (const ground of [PAPER, LINEN, IVORY, MIST]) {
      expect(contrastRatio(MUTED, ground), ground).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    }
  });

  it("keeps suggested banner text within the banner's limits, in both languages", () => {
    for (const theme of THEMES) {
      if (!theme.banner) continue;
      expect(theme.banner.label.length).toBeLessThanOrEqual(60);
      expect(theme.banner.labelBn.length).toBeLessThanOrEqual(60);
      expect(theme.banner.headline.length).toBeLessThanOrEqual(160);
      expect(theme.banner.headlineBn.length).toBeLessThanOrEqual(160);
    }
  });
});
