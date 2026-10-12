import { expect, test, type Locator, type Page } from "@playwright/test";
import { Client } from "pg";
import { HDR, THEME_ARTWORK } from "../src/lib/themes/artwork/data";
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

/** The boxes of the icons inside a layer matching `selector`, in page coordinates. */
async function iconBoxes(layer: Locator, selector = "svg"): Promise<Rect[]> {
  return layer.evaluate(
    (el, sel) =>
      [...el.querySelectorAll(sel)].map((svg) => {
        const r = svg.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
      }),
    selector,
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

/** Each line of the element's text and each of its links, one box each, in page coordinates. */
async function lineBoxes(locator: Locator): Promise<Rect[]> {
  return locator.evaluate((el) => {
    const boxes: DOMRect[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      boxes.push(...[...range.getClientRects()].filter((r) => r.width && r.height));
    }
    for (const a of el.querySelectorAll("a, button")) boxes.push(a.getBoundingClientRect());
    return boxes.map((r) => ({
      x: r.left + scrollX,
      y: r.top + scrollY,
      width: r.width,
      height: r.height,
    }));
  });
}

/** The element's own box (for the collapsed header's mark: the name is hidden but still laid out). */
async function elementBox(locator: Locator): Promise<Rect> {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
  });
}

async function expectClear(
  icons: Locator,
  text: (Locator | Rect)[],
  what: string,
  selector = "svg",
) {
  const boxes = await iconBoxes(icons, selector);
  expect(boxes.length, `${what}: artwork present`).toBeGreaterThan(0);
  for (const t of text) {
    const box = "x" in t ? t : await pageBox(t);
    for (const icon of boxes) {
      expect(overlaps(icon, box), `${what}: an icon sits under ${JSON.stringify(box)}`).toBe(false);
    }
  }
}

/** Every icon in the theme's set appears in the layer (hero, hangers and band count). */
async function expectWholeSet(layer: Locator, theme: string, what: string) {
  const set = THEME_ARTWORK[theme as keyof typeof THEME_ARTWORK].set;
  const names = await layer.evaluate((el) => [
    ...new Set(
      [...el.querySelectorAll("svg[data-season-icon]")].map((s) =>
        s.getAttribute("data-season-icon"),
      ),
    ),
  ]);
  expect(names.length, `${what}: distinct icons`).toBeGreaterThanOrEqual(set.length);
  for (const name of set) expect(names, `${what}: ${name}`).toContain(name);
}

async function checkHome(page: Page, theme: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(`/?theme=${theme}`);
  await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", theme);
  const phone = viewport.width < 1024;
  const what = `${theme} ${viewport.width}`;

  // Header at the top of the page: the top set shows, never under the brand or the actions.
  const header = page.getByTestId("site-header");
  const headerLayer = page.locator('[data-surface="header"]').filter({ visible: true });
  await expect(headerLayer).toHaveAttribute("data-placed", "true");
  await expect(headerLayer).toHaveAttribute("data-artwork-theme", theme);
  const topSet = headerLayer.locator('[data-header-set="top"]');
  const smallSet = headerLayer.locator('[data-header-set="small"]');
  await expect(topSet).toHaveCSS("opacity", "1");
  const brand = page.getByTestId("site-logo").filter({ visible: true });
  const actions = phone
    ? [header.getByTestId("header-menu"), header.locator('a[href="/wishlist"]').nth(1)]
    : [
        header.locator('a[href="/book"]').first(),
        header.locator('a[href="/wishlist"]').first(),
        header.getByRole("button", { name: /language|ভাষা/i }).first(),
      ];
  await expectClear(topSet, [brand, ...actions], `header top ${what}`);

  // Scrolled past the hero: the header collapses and its icons stay, the small set in place.
  await page.evaluate(() => window.scrollTo({ top: 1600, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-collapsed", "true");
  await expect(headerLayer).toHaveCSS("opacity", "1");
  await expect(smallSet).toHaveCSS("opacity", "1");
  await expect(topSet).toHaveCSS("opacity", "0");
  // Every collapsed icon at 390; at 1440 all but the three that touch the Book pill, which is
  // 50px tall from 1400px (an action taller than 48px keeps its whole box clear).
  const expected = { 1440: HDR.small.length - 3, 390: HDR.phoneSmall.length }[viewport.width];
  if (expected) await expect(smallSet.locator("svg")).toHaveCount(expected);
  await page.waitForTimeout(400); // the slide settles
  for (const box of await iconBoxes(smallSet)) {
    expect(box.width, `${what}: a collapsed icon has no size`).toBeGreaterThan(0);
  }
  const mark = await elementBox(brand.locator('[data-placeholder="logo"]'));
  await expectClear(smallSet, [mark, ...actions], `header collapsed ${what}`);

  // Tag: never under a line of its text or the button; every icon in the set.
  const tag = page.getByTestId("seasonal-tag");
  await tag.scrollIntoViewIfNeeded();
  const tagLayer = tag.locator('[data-surface="tag"]').filter({ visible: true });
  await expect(tagLayer).toHaveAttribute("data-placed", "true");
  await expectClear(
    tagLayer,
    await lineBoxes(page.getByTestId("seasonal-tag-text")),
    `tag ${what}`,
  );
  await expectWholeSet(tagLayer, theme, `tag ${what}`);

  // Footer: clear of the link columns and the bottom line; every icon in the set.
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  const footerLayer = footer.locator('[data-surface="footer"]').filter({ visible: true });
  await expect(footerLayer).toHaveAttribute("data-placed", "true");
  const footerText = [
    ...(await footer.locator("nav a, nav h2").all()),
    ...(await footer.locator("[data-artwork-exclude]").last().locator("p").all()),
    footer.locator("[data-artwork-exclude]").first().locator("p").first(),
  ];
  await expectClear(footerLayer, footerText, `footer ${what}`);
  await expectWholeSet(footerLayer, theme, `footer ${what}`);

  // Facts strip icons in the accent colour.
  await expect(page.getByTestId("facts-strip").locator("svg").first()).toBeVisible();
  // Nothing decorative is reachable or named.
  const named = await page
    .locator('[data-testid="artwork-layer"] [aria-label], [data-testid="artwork-layer"] [tabindex]')
    .count();
  expect(named).toBe(0);
}

/**
 * Seasonal artwork (#13 follow-ups): the season's motifs decorate the header, the big tag and
 * the footer, never under text, in Eid, Pohela Boishakh and Everyday; the header's icons stay
 * when it collapses; the tag and footer show every icon in the theme's set; the dashboard has
 * none; the owner's ?theme= preview still works.
 */
test.describe("seasonal artwork", () => {
  test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run");

  test("the seasons decorate the header, tag and footer clear of the text", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
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
      for (const theme of ["eid", "pohela-boishakh", "everyday"]) {
        await checkHome(page, theme, viewport);
      }
      // The phone width on the desktop project too: Eid and Pohela Boishakh at 390.
      if (testInfo.project.name !== "mobile") {
        for (const theme of ["eid", "pohela-boishakh"]) await checkHome(page, theme, PHONE);
      }
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
    const layer = page.locator('[data-surface="header"]').filter({ visible: true });
    await expect(layer).toHaveAttribute("data-artwork-theme", "valentines");
    await expect(layer).toHaveAttribute("data-placed", "true");
    expect(await layer.locator("svg[data-season-icon='heartfill']").count()).toBeGreaterThan(0);
  });
});
