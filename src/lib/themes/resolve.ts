import { formatInTimeZone } from "date-fns-tz";
import { MELBOURNE_TZ } from "@/lib/time";
import type { ThemeScheduleEntry, ThemeSettings } from "@/lib/validators/settings";
import { getTheme, type Theme } from "./themes";

export type ActiveTheme =
  | { theme: Theme; source: "schedule"; entry: ThemeScheduleEntry }
  | { theme: Theme; source: "manual" }
  | { theme: Theme; source: "default" };

/** Today's Melbourne civil date, "yyyy-MM-dd". */
export function melbourneToday(now: Date = new Date()): string {
  return formatInTimeZone(now, MELBOURNE_TZ, "yyyy-MM-dd");
}

/**
 * Which theme is live right now and why. Order: a schedule entry whose start..end (inclusive
 * civil dates) covers today in Melbourne, the later start winning on overlap (and, for equal
 * starts, the later row); else the manual choice; else everyday. Pure: `now` is injectable.
 */
export function resolveActiveTheme(settings: ThemeSettings, now: Date = new Date()): ActiveTheme {
  const today = melbourneToday(now);
  let winner: ThemeScheduleEntry | null = null;
  for (const entry of settings.schedule) {
    if (entry.start > today || entry.end < today) continue;
    if (!winner || entry.start >= winner.start) winner = entry;
  }
  if (winner) return { theme: getTheme(winner.themeId), source: "schedule", entry: winner };
  if (settings.manual) return { theme: getTheme(settings.manual), source: "manual" };
  return { theme: getTheme(null), source: "default" };
}
