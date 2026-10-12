import { expect, test, type Locator, type Page } from "@playwright/test";
import { Client } from "pg";
import { ownerEmail, ownerPassword, signInAsOwner } from "./helpers";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

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

async function readSetting(key: string): Promise<unknown> {
  return withDb(async (c) => {
    const r = await c.query<{ value: unknown }>(`select value from site_settings where key = $1`, [
      key,
    ]);
    return r.rows[0]?.value ?? null;
  });
}

async function writeSetting(key: string, value: unknown) {
  await withDb((c) =>
    c.query(
      `insert into site_settings (key, value) values ($1, $2)
       on conflict (key) do update set value = excluded.value`,
      [key, JSON.stringify(value)],
    ),
  );
}

type Rect = { x: number; y: number; width: number; height: number };

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** Every placed icon's box inside a layer, in page coordinates. */
async function iconBoxes(layer: Locator): Promise<Rect[]> {
  return layer.evaluate((el) =>
    [...el.querySelectorAll("svg")].map((svg) => {
      const r = svg.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
    }),
  );
}

/** The box around what the element shows (its text and inline content), not its block box. */
async function pageBox(locator: Locator): Promise<Rect> {
  return locator.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width && r.height);
    const r = rects.length ? rects[0] : el.getBoundingClientRect();
    let [left, top, right, bottom] = [r.left, r.top, r.right, r.bottom];
    for (const q of rects) {
      left = Math.min(left, q.left);
      top = Math.min(top, q.top);
      right = Math.max(right, q.right);
      bottom = Math.max(bottom, q.bottom);
    }
    return { x: left + scrollX, y: top + scrollY, width: right - left, height: bottom - top };
  });
}

async function expectClear(layer: Locator, text: Locator[], what: string) {
  await expect(layer).toHaveAttribute("data-placed", "true");
  const icons = await iconBoxes(layer);
  expect(icons.length, `${what}: artwork present`).toBeGreaterThan(0);
  for (const t of text) {
    const box = await pageBox(t);
    for (const icon of icons) {
      expect(overlaps(icon, box), `${what}: an icon sits under ${JSON.stringify(box)}`).toBe(false);
    }
  }
}

async function checkHome(page: Page, theme: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(`/?theme=${theme}`);
  await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", theme);
  const phone = viewport.width < 1024;

  // Header: icons placed, never under the brand or the actions.
  const headerLayer = page.locator('[data-surface="header"]').nth(phone ? 1 : 0);
  const brand = page.getByTestId("site-logo").nth(phone ? 1 : 0);
  const header = page.getByTestId("site-header");
  const actions = phone
    ? [header.getByTestId("header-menu"), header.locator('a[href="/wishlist"]').nth(1)]
    : [
        header.locator('a[href="/book"]').first(),
        header.locator('a[href="/wishlist"]').first(),
        header.getByRole("button", { name: /language|ভাষা/i }).first(),
      ];
  await expectClear(headerLayer, [brand, ...actions], `header ${viewport.width}`);
  await expect(headerLayer).toHaveAttribute("data-artwork-theme", theme);

  // Tag: motifs present (hangers, band or scatter), never under the text column.
  const tag = page.getByTestId("seasonal-tag");
  await tag.scrollIntoViewIfNeeded();
  const tagLayer = tag.locator('[data-surface="tag"]');
  await expectClear(tagLayer, [page.getByTestId("seasonal-tag-text")], `tag ${viewport.width}`);

  // Footer: motifs present, clear of the link columns and the bottom line.
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  const footerLayer = footer.locator('[data-surface="footer"]');
  const footerText = [
    ...(await footer.locator("nav a, nav h2").all()),
    ...(await footer.locator("[data-artwork-exclude]").last().locator("p").all()),
    footer.locator("[data-artwork-exclude]").first().locator("p").first(),
  ];
  await expectClear(footerLayer, footerText, `footer ${viewport.width}`);

  // Facts strip icons in the accent colour.
  await expect(page.getByTestId("facts-strip").locator("svg").first()).toBeVisible();
  // Nothing decorative is reachable or named.
  const named = await page
    .locator('[data-testid="artwork-layer"] [aria-label], [data-testid="artwork-layer"] [tabindex]')
    .count();
  expect(named).toBe(0);
}

/**
 * Seasonal artwork (#13 follow-up): the season's motifs decorate the header, the big tag and
 * the footer, never under text, in Eid and Everyday; the dashboard has none; the owner's
 * ?theme= preview still works.
 */
test.describe("seasonal artwork", () => {
  test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run");

  test("Eid and Everyday decorate the header, tag and footer clear of the text", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const previousBanner = await readSetting("seasonal_banner");
    test.skip(!previousBanner, "DATABASE_URL is needed to turn the banner on");
    try {
      // The banner must be on for the tag to render.
      await writeSetting("seasonal_banner", {
        ...(previousBanner as object),
        enabled: true,
        label: "Eid collection",
        headline: "Order early for Eid gifts. Consultations fill up in the last two weeks.",
        buttonLabel: "Book a consultation",
        href: "/book",
      });
      // The theme row belongs to themes.spec.ts (it runs in parallel), so the themes come from
      // the owner's ?theme= preview, which the artwork reads like the rest of the page.
      await signInAsOwner(page);
      const viewport = testInfo.project.name === "mobile" ? PHONE : DESKTOP;
      for (const theme of ["eid", "everyday"]) await checkHome(page, theme, viewport);
      // The other width too, once: the rule holds at 390 on the desktop project.
      if (testInfo.project.name !== "mobile") await checkHome(page, "eid", PHONE);
    } finally {
      if (previousBanner) await writeSetting("seasonal_banner", previousBanner);
    }
  });

  test("the dashboard has no artwork and the owner's ?theme= preview still decorates", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "one project is enough");
    await signInAsOwner(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator('[data-testid="artwork-layer"]').count()).toBe(0);
    expect(await page.locator('[data-testid="season-icon-sprite"]').count()).toBe(0);
    expect(await page.locator("[data-theme]").count()).toBe(0);

    await page.setViewportSize(DESKTOP);
    await page.goto("/?theme=valentines");
    await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", "valentines");
    const layer = page.locator('[data-surface="header"]').first();
    await expect(layer).toHaveAttribute("data-artwork-theme", "valentines");
    await expect(layer).toHaveAttribute("data-placed", "true");
    expect(await layer.locator("svg[data-season-icon='heartfill']").count()).toBeGreaterThan(0);
  });
});
