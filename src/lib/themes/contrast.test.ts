import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, relativeLuminance } from "./contrast";

describe("contrast helper", () => {
  it("parses #RRGGBB with or without the hash, in any case", () => {
    expect(parseHex("#1E4A3A")).toEqual([30, 74, 58]);
    expect(parseHex("ffffff")).toEqual([255, 255, 255]);
    expect(() => parseHex("#fff")).toThrow();
    expect(() => parseHex("green")).toThrow();
  });

  it("computes WCAG relative luminance", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 6);
    // sRGB mid grey (#808080) is about 0.2159 under the WCAG formula.
    expect(relativeLuminance("#808080")).toBeCloseTo(0.2159, 3);
  });

  it("computes contrast ratios symmetrically", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 6);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 6);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
    // #777777 on white is the classic "just under AA" pair (4.48:1).
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
});
