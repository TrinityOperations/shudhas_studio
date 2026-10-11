import { expect, test } from "@playwright/test";
import { ownerEmail, ownerPassword, signInAsOwner } from "./helpers";

const SHELL_CACHE = "admin-shell-v1";
const SHELL_ENTRIES = [
  "/admin/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/badge-96.png",
];

/**
 * OD-60: the dashboard is installable and survives going offline with a shell only. The
 * service worker is scoped to /admin and caches nothing but the offline page and the icons.
 * Push delivery is tested on real phones (docs/slices/14-pwa-push.md), not here.
 */
test.describe("dashboard PWA", () => {
  test("the manifest is served, scoped to /admin, without a session", async ({ request }) => {
    const response = await request.get("/admin/manifest.webmanifest");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/manifest+json");
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: "Shudha's Studio",
      short_name: "Shudha's",
      scope: "/admin",
      start_url: "/admin",
      display: "standalone",
      theme_color: "#1E4A3A",
      background_color: "#FBF9F6",
    });
    expect(
      manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes}/${i.purpose}`),
    ).toEqual(["192x192/any", "512x512/any", "192x192/maskable", "512x512/maskable"]);
    const offline = await request.get("/admin/offline");
    expect(offline.status()).toBe(200);
    const sw = await request.get("/sw.js");
    expect(sw.status()).toBe(200);
    expect(sw.headers()["cache-control"]).toContain("no-cache");
  });

  test("the public site has no service worker and no manifest", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
    await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveCount(0);
    const registration = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return r ? r.scope : null;
    });
    expect(registration).toBeNull();
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(false);
  });

  test("the dashboard registers a /admin worker that caches only the shell and serves it offline", async ({
    page,
    context,
  }, testInfo) => {
    test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run");
    test.skip(testInfo.project.name !== "chromium", "service workers run in the chromium project");

    await signInAsOwner(page);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/admin/manifest.webmanifest",
    );
    await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute(
      "content",
      "yes",
    );

    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toMatch(/\/admin$/);
    // Wait for the install step to fill the shell cache.
    await expect
      .poll(async () => page.evaluate(() => caches.keys()), { timeout: 15_000 })
      .toEqual([SHELL_CACHE]);

    await page.goto("/admin/bookings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/admin/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const cached = await page.evaluate(async (name) => {
      const names = await caches.keys();
      const cache = await caches.open(name);
      const entries = (await cache.keys()).map((req) => new URL(req.url).pathname).sort();
      return { names, entries };
    }, SHELL_CACHE);
    expect(cached.names).toEqual([SHELL_CACHE]);
    expect(cached.entries).toEqual([...SHELL_ENTRIES].sort());

    await context.setOffline(true);
    try {
      await page.goto("/admin/bookings");
      await expect(page.getByTestId("offline-shell")).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
    await page.goto("/admin/bookings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("offline-shell")).toHaveCount(0);

    // Leave no worker behind for the other specs sharing this browser profile.
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      if (r) await r.unregister();
      for (const key of await caches.keys()) await caches.delete(key);
    });
  });
});
