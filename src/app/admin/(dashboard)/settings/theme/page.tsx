import type { Metadata } from "next";
import { ScheduleForm } from "@/components/admin/themes/schedule-form";
import { ThemePicker } from "@/components/admin/themes/theme-picker";
import { getThemeSettings } from "@/db/queries/settings";
import { requireOwner } from "@/lib/auth";
import { getLocale, getT } from "@/lib/i18n";
import { describeActiveTheme } from "@/lib/themes/describe";
import { resolveActiveTheme } from "@/lib/themes/resolve";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.themes.title") };
}

/** OD-35: the seasonal theme picker and schedule. */
export default async function ThemePage() {
  await requireOwner();
  const [t, locale, settings] = await Promise.all([getT(), getLocale(), getThemeSettings()]);
  const active = resolveActiveTheme(settings);
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.themes.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("admin.themes.description")}</p>
        <p className="pt-2 text-sm font-medium" data-testid="theme-live" aria-live="polite">
          {t("admin.themes.live")} {describeActiveTheme(active, t, locale)}
        </p>
      </header>
      <ThemePicker manual={settings.manual} />
      <ScheduleForm defaultValues={{ schedule: settings.schedule }} />
    </section>
  );
}
