import type { CSSProperties } from "react";
import type { Theme } from "./themes";

export type ThemeRootProps = {
  "data-theme": Theme["id"];
  style: CSSProperties;
};

/**
 * The attributes a wrapper element carries so everything inside takes the theme: `data-theme`
 * re-maps the derived shadcn variables (globals.css, `:root, [data-theme]`) and the inline
 * variable sets the accent itself. Used by the public layout, the home page editor and the
 * picker's previews.
 */
export function themeRootProps(theme: Theme): ThemeRootProps {
  return {
    "data-theme": theme.id,
    style: { "--brand-accent": theme.accent } as CSSProperties,
  };
}
