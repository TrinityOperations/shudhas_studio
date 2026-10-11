import { describe, expect, it } from "vitest";
import { themeRootProps } from "./apply";
import { getTheme } from "./themes";

describe("themeRootProps", () => {
  it("carries the id as data-theme and the accent as the CSS variable", () => {
    expect(themeRootProps(getTheme("eid"))).toEqual({
      "data-theme": "eid",
      style: { "--brand-accent": "#2D4356" },
    });
  });
});
