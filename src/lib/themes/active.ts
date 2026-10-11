import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getThemeSettings } from "@/db/queries/settings";
import { getOwner } from "@/lib/auth";
import { resolveActiveTheme, type ActiveTheme } from "./resolve";
import { getTheme, isThemeId, THEME_PREVIEW_HEADER, type Theme } from "./themes";

/** The live theme for this request, resolved from the stored settings (schedule → manual → everyday). */
export const getActiveTheme = cache(async (): Promise<ActiveTheme> => {
  return resolveActiveTheme(await getThemeSettings());
});

/**
 * The theme a public page renders with: the owner's `?theme=` preview when she is signed in
 * (the proxy turns the parameter into a header that only it can set), else the live theme.
 * Visitors never trigger the auth lookup: it runs only when the header is present.
 */
export const getPageTheme = cache(async (): Promise<Theme> => {
  const preview = (await headers()).get(THEME_PREVIEW_HEADER);
  if (isThemeId(preview) && (await getOwner())) return getTheme(preview);
  return (await getActiveTheme()).theme;
});
