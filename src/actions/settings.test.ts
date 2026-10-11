import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  values: vi.fn(),
  insert: vi.fn(),
  revalidatePath: vi.fn(),
  getThemeSettings: vi.fn(),
  getSeasonalBannerSettings: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireOwner: mocks.requireOwner }));
vi.mock("@/db", () => ({ db: { insert: mocks.insert } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/db/queries/settings", () => ({
  getThemeSettings: mocks.getThemeSettings,
  getSeasonalBannerSettings: mocks.getSeasonalBannerSettings,
}));

import { defaultSeasonalBannerSettings } from "@/lib/validators/settings";
import {
  applyBannerText,
  setThemeChoice,
  updateGeneralSettings,
  updateThemeSchedule,
} from "./settings";

describe("updateGeneralSettings", () => {
  beforeEach(() => {
    mocks.requireOwner.mockResolvedValue({ id: "owner", email: "owner@example.com" });
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.insert.mockReturnValue({ values: mocks.values });
  });

  it("returns field errors for invalid input and never touches auth or the database", async () => {
    const result = await updateGeneralSettings({ studioName: "  ", tagline: "", taglineBn: "" });
    expect(result).toMatchObject({ ok: false, error: "errors.invalidInput" });
    if (result.ok) throw new Error("expected failure");
    expect(result.fieldErrors?.studioName).toEqual(["errors.required"]);
    expect(mocks.requireOwner).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("requires the owner before writing", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(
      updateGeneralSettings({ studioName: "Studio", tagline: "", taglineBn: "" }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("trims, upserts the general row and revalidates the whole site", async () => {
    const result = await updateGeneralSettings({
      studioName: "  Shudha's Studio ",
      tagline: " Be a reason ",
      taglineBn: "",
    });
    expect(result).toEqual({
      ok: true,
      data: { studioName: "Shudha's Studio", tagline: "Be a reason", taglineBn: "" },
    });
    expect(mocks.values).toHaveBeenCalledWith({
      key: "general",
      value: { studioName: "Shudha's Studio", tagline: "Be a reason", taglineBn: "" },
    });
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});

describe("seasonal theme actions (OD-35)", () => {
  const schedule = [{ themeId: "eid" as const, start: "2026-03-20", end: "2026-03-30" }];

  beforeEach(() => {
    mocks.requireOwner.mockResolvedValue({ id: "owner", email: "owner@example.com" });
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.getThemeSettings.mockResolvedValue({ manual: "wedding", schedule });
    mocks.getSeasonalBannerSettings.mockResolvedValue({
      ...defaultSeasonalBannerSettings,
      enabled: true,
      buttonLabel: "Book now",
      href: "/book",
    });
  });

  it("setThemeChoice rejects an unknown id before auth or the database", async () => {
    expect(await setThemeChoice("halloween")).toMatchObject({ ok: false });
    expect(mocks.requireOwner).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("setThemeChoice requires the owner", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(setThemeChoice("eid")).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("setThemeChoice writes the choice, keeps the schedule and revalidates the whole site", async () => {
    expect(await setThemeChoice("eid")).toEqual({ ok: true, data: { manual: "eid", schedule } });
    expect(mocks.values).toHaveBeenCalledWith({
      key: "theme",
      value: { manual: "eid", schedule },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("setThemeChoice(null) clears the choice (automatic)", async () => {
    expect(await setThemeChoice(null)).toEqual({ ok: true, data: { manual: null, schedule } });
  });

  it("updateThemeSchedule returns field errors for a bad row and never writes", async () => {
    const result = await updateThemeSchedule([
      { themeId: "eid", start: "2026-04-02", end: "2026-04-01" },
    ]);
    expect(result).toMatchObject({ ok: false, error: "errors.invalidInput" });
    expect(mocks.requireOwner).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("updateThemeSchedule requires the owner", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(updateThemeSchedule([])).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("updateThemeSchedule writes the schedule, keeps the manual choice and revalidates", async () => {
    const next = [{ themeId: "christmas" as const, start: "2026-12-01", end: "2027-01-02" }];
    expect(await updateThemeSchedule(next)).toEqual({
      ok: true,
      data: { manual: "wedding", schedule: next },
    });
    expect(mocks.values).toHaveBeenCalledWith({
      key: "theme",
      value: { manual: "wedding", schedule: next },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("applyBannerText changes only the label and headline of the seasonal banner", async () => {
    const text = {
      label: "Eid collection",
      labelBn: "ঈদ",
      headline: "Order early",
      headlineBn: "",
    };
    const result = await applyBannerText(text);
    expect(result).toMatchObject({
      ok: true,
      data: { ...text, enabled: true, buttonLabel: "Book now" },
    });
    expect(mocks.values).toHaveBeenCalledWith({
      key: "seasonal_banner",
      value: expect.objectContaining({
        ...text,
        enabled: true,
        buttonLabel: "Book now",
        href: "/book",
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("applyBannerText rejects over-long text before auth", async () => {
    const result = await applyBannerText({
      label: "x".repeat(61),
      labelBn: "",
      headline: "",
      headlineBn: "",
    });
    expect(result).toMatchObject({ ok: false });
    expect(mocks.requireOwner).not.toHaveBeenCalled();
  });
});
