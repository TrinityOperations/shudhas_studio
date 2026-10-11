import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { ownerEmail, ownerPassword, signInAsOwner } from "./helpers";

const EVERYDAY = "rgb(30, 74, 58)"; // #1E4A3A
const EID = "rgb(45, 67, 86)"; // #2D4356
const CHRISTMAS = "rgb(110, 43, 43)"; // #6E2B2B
const VALENTINES = "rgb(138, 46, 69)"; // #8A2E45

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T | null> {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return null;
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Computed accent on the public page: the footer and the header's primary button. */
async function accentOf(page: Page, path: string) {
  await page.goto(path);
  const footer = await page
    .locator("footer")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  const button = await page
    .locator('header a[href="/book"]')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  const attr = await page.locator("[data-theme]").first().getAttribute("data-theme");
  return { footer, button, attr };
}

function melbourneToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * PW-90, PW-91, OD-35: one click changes the live colour, the schedule wins over the click, the
 * owner's ?theme= preview applies for her only, and the picker works by keyboard.
 */
test.describe("seasonal theme", () => {
  test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run");

  test("a visitor's ?theme= is ignored", async ({ page }) => {
    const plain = await accentOf(page, "/");
    const preview = await accentOf(page, "/?theme=valentines");
    expect(preview.footer).toBe(plain.footer);
    expect(preview.button).toBe(plain.button);
    expect(preview.attr).toBe(plain.attr);
    // The chromium project never chooses Valentine's below, so this holds while it runs.
    expect(preview.footer).not.toBe(VALENTINES);
  });

  test("the owner picks, previews, schedules and clears a theme", async ({
    page,
    context,
  }, testInfo) => {
    // Shared setting: only the chromium project drives the theme row.
    test.skip(testInfo.project.name !== "chromium", "one project owns the theme row");
    test.setTimeout(120_000);
    const previous = await withDb(async (c) => {
      const r = await c.query<{ value: unknown }>(
        `select value from site_settings where key = 'theme'`,
      );
      return r.rows[0]?.value ?? null;
    });
    const manualInDb = async () =>
      withDb(async (c) => {
        const r = await c.query<{ value: { manual: string | null } }>(
          `select value from site_settings where key = 'theme'`,
        );
        return r.rows[0]?.value.manual ?? null;
      });
    // The radio itself is visually hidden; its card label is the click target.
    const pick = async (id: string) => {
      await page.locator(`label[for="theme-${id}"]`).click();
      await expect(page.locator(`#theme-${id}`)).toBeChecked();
    };
    const saved = async () => {
      await expect(page.getByText(/^theme saved$/i)).toBeVisible();
      await expect(page.getByText(/^theme saved$/i)).toBeHidden({ timeout: 15_000 });
    };

    try {
      await signInAsOwner(page);
      await page.goto("/admin/settings/theme");
      await expect(page.getByRole("heading", { level: 1, name: /seasonal theme/i })).toBeVisible();

      // One click: Eid.
      await pick("eid");
      await saved();
      await expect(page.getByTestId("theme-live")).toContainText(/eid, chosen by you/i);
      expect(await manualInDb()).toBe("eid");
      const visitor = await context.browser()!.newPage();
      const live = await accentOf(visitor, "/");
      expect(live).toEqual({ footer: EID, button: EID, attr: "eid" });
      // The dashboard keeps Bengal green; the editor shows the live theme.
      await page.goto("/admin");
      await expect(page.locator("[data-theme]")).toHaveCount(0);
      await page.goto("/admin/home-editor");
      await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", "eid");

      // Owner preview: ?theme= applies for her request only, nothing is written.
      const preview = await accentOf(page, "/?theme=valentines");
      expect(preview).toEqual({ footer: VALENTINES, button: VALENTINES, attr: "valentines" });
      expect(await manualInDb()).toBe("eid");
      expect((await accentOf(visitor, "/?theme=valentines")).footer).toBe(EID);

      // Keyboard: arrow from Eid to the next card; several steps write once, after the last.
      await page.goto("/admin/settings/theme");
      await page.getByRole("radio", { name: /^eid/i }).focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("radio", { name: /^wedding/i })).toBeChecked();
      await saved();
      expect(await manualInDb()).toBe("wedding");
      await expect(page.getByTestId("theme-live")).toContainText(/wedding season, chosen by you/i);

      // Schedule: a season covering today beats the click.
      const today = melbourneToday();
      await page.getByRole("button", { name: /add a season/i }).click();
      await page.getByLabel(/^theme$/i).click();
      await page.getByRole("option", { name: /christmas/i }).click();
      await page.getByLabel(/first day/i).fill(today);
      await page.getByLabel(/last day/i).fill(today);
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText(/schedule saved/i)).toBeVisible();
      await expect(page.getByTestId("theme-live")).toContainText(
        /christmas and new year, from the schedule/i,
      );
      expect((await accentOf(visitor, "/")).footer).toBe(CHRISTMAS);

      // End before start is refused inline.
      await page.getByLabel(/last day/i).fill("2020-01-01");
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText(/last day must be on or after/i)).toBeVisible();
      await page.getByRole("button", { name: /remove season 1/i }).click();
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText(/schedule saved/i)).toBeVisible();

      // Automatic clears the click: back to everyday.
      await pick("auto");
      await saved();
      expect(await manualInDb()).toBeNull();
      await expect(page.getByTestId("theme-live")).toContainText(/^live now: everyday$/i);
      const back = await accentOf(visitor, "/");
      expect(back).toEqual({ footer: EVERYDAY, button: EVERYDAY, attr: "everyday" });
      await visitor.close();
    } finally {
      await withDb(async (c) => {
        if (previous === null) await c.query(`delete from site_settings where key = 'theme'`);
        else
          await c.query(
            `insert into site_settings (key, value) values ('theme', $1) on conflict (key) do update set value = excluded.value`,
            [JSON.stringify(previous)],
          );
      });
    }
  });
});
