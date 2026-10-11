"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { applyBannerText, setThemeChoice } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/t";
import { themeRootProps } from "@/lib/themes/apply";
import { themeNameKey } from "@/lib/themes/describe";
import { THEME_PREVIEW_PARAM, THEMES, type Theme, type ThemeId } from "@/lib/themes/themes";
import { cn } from "@/lib/utils";

/** Arrowing across the radios changes the value on every step; the write waits for the last one. */
const WRITE_DELAY_MS = 400;
const AUTO = "auto";

/**
 * OD-35: one card per theme plus "Automatic". A card is a native radio, so the group is one Tab
 * stop and the arrow keys move between cards; the choice is saved on its own, no Save button.
 */
export function ThemePicker({ manual }: { manual: ThemeId | null }) {
  const t = useT();
  const router = useRouter();
  const [choice, setChoice] = useState<ThemeId | null>(manual);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useRef<ThemeId | null>(manual);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const choose = (next: ThemeId | null) => {
    setChoice(next);
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (next === saved.current) return;
      setSaving(true);
      const result = await setThemeChoice(next);
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saved.current = result.data.manual;
      toast.success(t("admin.themes.saved"));
      router.refresh();
    }, WRITE_DELAY_MS);
  };

  const applyText = async (theme: Theme) => {
    if (!theme.banner) return;
    const result = await applyBannerText(theme.banner);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    toast.success(t("admin.themes.usedText"));
  };

  return (
    <fieldset
      className="space-y-3"
      aria-busy={saving || undefined}
      data-testid="theme-picker"
      data-saving={saving ? "true" : "false"}
    >
      <legend className="font-medium">{t("admin.themes.pick")}</legend>
      <p className="text-muted-foreground text-sm">{t("admin.themes.pickHint")}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Card
            id={AUTO}
            checked={choice === null}
            onChoose={() => choose(null)}
            title={t("admin.themes.auto")}
            hint={t("admin.themes.autoHint")}
          />
        </li>
        {THEMES.map((theme) => (
          <li key={theme.id}>
            <Card
              id={theme.id}
              checked={choice === theme.id}
              onChoose={() => choose(theme.id)}
              title={t(themeNameKey(theme.id))}
              theme={theme}
              footer={
                <div className="flex flex-wrap gap-2">
                  {theme.banner ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyText(theme)}
                    >
                      {t("admin.themes.useText")}
                    </Button>
                  ) : null}
                  <a
                    href={`/?${THEME_PREVIEW_PARAM}=${theme.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-8 items-center text-sm underline underline-offset-4"
                  >
                    {t("admin.themes.previewLink")}
                  </a>
                </div>
              }
            />
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {t(error)}
        </p>
      ) : null}
    </fieldset>
  );
}

function Card({
  id,
  checked,
  onChoose,
  title,
  hint,
  theme,
  footer,
}: {
  id: string;
  checked: boolean;
  onChoose: () => void;
  title: string;
  hint?: string;
  theme?: Theme;
  footer?: React.ReactNode;
}) {
  const t = useT();
  const inputId = `theme-${id}`;
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-3 rounded-lg border bg-white p-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--brand-accent)",
        checked ? "border-ink ring-ink ring-1" : "border-line",
      )}
      data-testid="theme-card"
      data-theme-id={id}
      data-checked={checked ? "true" : "false"}
    >
      <input
        type="radio"
        name="theme"
        id={inputId}
        value={id}
        checked={checked}
        onChange={onChoose}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col gap-3 after:absolute after:inset-0"
      >
        {theme ? <Preview theme={theme} /> : <AutoPreview />}
        <span className="flex items-center justify-between gap-2">
          <span className="font-medium">{title}</span>
          {checked ? (
            <span className="bg-ink rounded-full px-2 py-0.5 text-xs text-white">
              {t("admin.themes.chosen")}
            </span>
          ) : null}
        </span>
        {hint ? <span className="text-muted-foreground text-sm">{hint}</span> : null}
      </label>
      {footer ? <div className="relative z-10">{footer}</div> : null}
    </div>
  );
}

/** A primary button, a banner tag and a footer strip, in the theme's own accent. */
function Preview({ theme }: { theme: Theme }) {
  const t = useT();
  return (
    <div
      {...themeRootProps(theme)}
      aria-hidden
      className="bg-paper border-line overflow-hidden rounded-md border"
    >
      <div className="flex items-center gap-3 p-3">
        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium">
          {t("common.bookAppointment")}
        </span>
        <span className="tag tag-quiet text-xs">{t("admin.themes.previewTag")}</span>
      </div>
      <div className="bg-primary h-4" />
    </div>
  );
}

function AutoPreview() {
  const t = useT();
  return (
    <div aria-hidden className="bg-paper border-line overflow-hidden rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium">
          {t("common.bookAppointment")}
        </span>
        <span className="tag tag-quiet text-xs">{t("admin.themes.previewTag")}</span>
      </div>
      <div className="bg-primary h-4" />
    </div>
  );
}
