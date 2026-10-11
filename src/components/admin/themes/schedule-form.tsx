"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateThemeSchedule } from "@/actions/settings";
import { FieldMessage } from "@/components/shared/field-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/t";
import { themeNameKey } from "@/lib/themes/describe";
import { DEFAULT_THEME_ID, THEMES } from "@/lib/themes/themes";
import {
  THEME_SCHEDULE_MAX,
  themeScheduleFormSchema,
  type ThemeScheduleFormOutput,
  type ThemeScheduleFormValues,
} from "@/lib/validators/settings";

/** OD-35: seasons by date. A row covering today beats the manual choice (src/lib/themes/resolve.ts). */
export function ScheduleForm({ defaultValues }: { defaultValues: ThemeScheduleFormValues }) {
  const t = useT();
  const router = useRouter();
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const form = useForm<ThemeScheduleFormValues, unknown, ThemeScheduleFormOutput>({
    resolver: zodResolver(themeScheduleFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "schedule" });
  const { errors, isSubmitting } = form.formState;
  const items = THEMES.map((theme) => ({ value: theme.id, label: t(themeNameKey(theme.id)) }));

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const result = await updateThemeSchedule(values.schedule);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    form.reset({ schedule: result.data.schedule });
    toast.success(t("admin.themes.schedule.saved"));
    router.refresh();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="max-w-2xl space-y-6"
      data-testid="theme-schedule"
    >
      <div className="space-y-1">
        <h2 className="font-medium">{t("admin.themes.schedule.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("admin.themes.schedule.hint")}</p>
      </div>
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("admin.themes.schedule.empty")}</p>
      ) : null}
      <ul className="space-y-4">
        {fields.map((item, index) => {
          const rowErrors = errors.schedule?.[index];
          return (
            <li key={item.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  {t("admin.themes.schedule.row", { n: index + 1 })}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                  aria-label={t("admin.themes.schedule.remove", { n: index + 1 })}
                >
                  {t("common.delete")}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={!!rowErrors?.themeId || undefined}>
                  <FieldLabel htmlFor={`schedule.${index}.themeId`}>
                    {t("admin.themes.schedule.theme")}
                  </FieldLabel>
                  <Controller
                    control={form.control}
                    name={`schedule.${index}.themeId`}
                    render={({ field }) => (
                      <Select
                        items={items}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value ?? DEFAULT_THEME_ID)}
                      >
                        <SelectTrigger id={`schedule.${index}.themeId`} onBlur={field.onBlur}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldMessage error={rowErrors?.themeId} />
                </Field>
                <Field data-invalid={!!rowErrors?.start || undefined}>
                  <FieldLabel htmlFor={`schedule.${index}.start`}>
                    {t("admin.themes.schedule.start")}
                  </FieldLabel>
                  <Input
                    id={`schedule.${index}.start`}
                    type="date"
                    {...form.register(`schedule.${index}.start`)}
                  />
                  <FieldMessage error={rowErrors?.start} />
                </Field>
                <Field data-invalid={!!rowErrors?.end || undefined}>
                  <FieldLabel htmlFor={`schedule.${index}.end`}>
                    {t("admin.themes.schedule.end")}
                  </FieldLabel>
                  <Input
                    id={`schedule.${index}.end`}
                    type="date"
                    {...form.register(`schedule.${index}.end`)}
                  />
                  <FieldMessage error={rowErrors?.end} />
                </Field>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={fields.length >= THEME_SCHEDULE_MAX}
          onClick={() => append({ themeId: "eid", start: "", end: "" })}
        >
          {t("admin.themes.schedule.add")}
        </Button>
        <SubmitButton pending={isSubmitting} pendingLabel={t("common.saving")}>
          {t("common.save")}
        </SubmitButton>
      </div>
      {serverError ? <FieldError>{t(serverError)}</FieldError> : null}
    </form>
  );
}
