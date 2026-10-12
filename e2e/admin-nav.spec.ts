import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { ownerEmail, ownerPassword, signInAsOwner } from "./helpers";

const PHONE = { width: 390, height: 844 };
const PAGES = ["/admin", "/admin/bookings", "/admin/products", "/admin/gallery", "/admin/more"];
const PENDING_NAME = "E2E Nav Badge";

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

/** A pending gallery row straight in the table (no files are needed to count it). */
async function insertPendingPhoto(): Promise<string | null> {
  return withDb(async (client) => {
    await client.query(`delete from gallery_submissions where first_name = $1`, [PENDING_NAME]);
    const result = await client.query<{ id: string }>(
      `insert into gallery_submissions
         (first_name, note, image_path, thumb_path, consent_given, status)
       values ($1, $2, $3, $4, true, 'pending') returning id`,
      [PENDING_NAME, "nav badge", "e2e/nav/full.webp", "e2e/nav/thumb.webp"],
    );
    return result.rows[0].id;
  });
}

async function noHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(widths.scroll, `${page.url()} scrolls sideways`).toBeLessThanOrEqual(widths.inner);
}

test.describe("dashboard navigation (OD-60 design pass)", () => {
  test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run");

  // `next dev` floats its dev-tools button bottom-left, exactly over the first tab at 390; a
  // production build has none. Hide it so the clicks below land on the tab bar.
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head.append(style);
      });
    });
  });

  test("phones get a four-tab bar whose current tab follows the page", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await signInAsOwner(page);
    const bar = page.getByTestId("admin-tab-bar");
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("admin-sidebar")).toBeHidden();
    const links = bar.getByRole("link");
    await expect(links).toHaveCount(4);
    await expect(links).toHaveText([/bookings/i, /products/i, /availability/i, /more/i]);
    for (let i = 0; i < 4; i++) {
      const box = (await links.nth(i).boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    // The dashboard home belongs to no tab.
    await expect(bar.locator("[aria-current='page']")).toHaveCount(0);

    await bar.getByRole("link", { name: /bookings/i }).click();
    await expect(page).toHaveURL(/\/admin\/bookings$/);
    await expect(bar.getByRole("link", { name: /bookings/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await bar.getByRole("link", { name: /products/i }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await expect(bar.getByRole("link", { name: /products/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(bar.getByRole("link", { name: /bookings/i })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    // The wordmark in the top bar goes back to the dashboard home.
    await page.getByTestId("admin-top-bar").getByRole("link").click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("More lists the rest of the dashboard and the gallery badge follows pending photos", async ({
    page,
  }) => {
    const id = await insertPendingPhoto();
    test.skip(!id, "DATABASE_URL is needed to plant a pending photo");
    try {
      await page.setViewportSize(PHONE);
      await signInAsOwner(page);
      await expect(page.getByTestId("more-badge")).toBeVisible();

      await page.getByTestId("admin-tab-bar").getByRole("link", { name: /more/i }).click();
      await expect(page).toHaveURL(/\/admin\/more$/);
      const list = page.getByTestId("more-list");
      await expect(list.getByRole("link", { name: /gallery/i })).toHaveAttribute(
        "href",
        "/admin/gallery",
      );
      await expect(list.getByRole("link", { name: /home page editor/i })).toHaveAttribute(
        "href",
        "/admin/home-editor",
      );
      await expect(list.getByRole("link", { name: /theme/i })).toHaveAttribute(
        "href",
        "/admin/settings/theme",
      );
      await expect(list.getByRole("link", { name: /^settings$/i })).toHaveAttribute(
        "href",
        "/admin/settings",
      );
      await expect(page.getByTestId("more-gallery-badge")).toBeVisible();
      await expect(page.locator("main").getByText(ownerEmail!)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();

      // Desktop: the sidebar carries the same count.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/admin");
      await expect(page.getByTestId("admin-tab-bar")).toBeHidden();
      const sidebar = page.getByTestId("admin-sidebar");
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByTestId("gallery-badge")).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(sidebar.getByRole("link", { name: /home page editor/i })).toBeVisible();
      await expect(sidebar.getByRole("button", { name: /sign out/i })).toBeVisible();
    } finally {
      await withDb((client) => client.query(`delete from gallery_submissions where id = $1`, [id]));
    }
  });

  test("the tab bar is reachable by keyboard alone", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "keyboard focus order is checked once");
    await page.setViewportSize(PHONE);
    await signInAsOwner(page);
    // From the top of the document: skip link, wordmark, then the page; the tab bar comes last.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /skip to content/i })).toBeFocused();
    const bar = page.getByTestId("admin-tab-bar");
    const first = bar.getByRole("link").first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(bar.getByRole("link", { name: /products/i })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(bar.getByRole("link", { name: /more/i })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/admin\/more$/);
  });

  test("nothing scrolls sideways at 390", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await signInAsOwner(page);
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await noHorizontalOverflow(page);
    }
  });
});
