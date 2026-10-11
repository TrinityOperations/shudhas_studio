import type { Locale } from "@/lib/i18n/locale";
import type { MessageKey, T } from "@/lib/i18n/t";
import { formatCivilDate } from "@/lib/time";
import type { ActiveTheme } from "./resolve";
import type { ThemeId } from "./themes";

export function themeNameKey(id: ThemeId): MessageKey {
  return `admin.themes.name.${id}` as MessageKey;
}

/** "Eid, from the schedule until 30 Mar 2026" / "Wedding season, chosen by you" / "Everyday". */
export function describeActiveTheme(active: ActiveTheme, t: T, locale: Locale): string {
  const name = t(themeNameKey(active.theme.id));
  if (active.source === "schedule") {
    return t("admin.themes.live.schedule", {
      name,
      date: formatCivilDate(active.entry.end, t, locale),
    });
  }
  if (active.source === "manual") return t("admin.themes.live.manual", { name });
  return t("admin.themes.live.default", { name });
}
