import { expect, test, type Page } from "@playwright/test";

/**
 * The public header's collapse (#13, docs/design.md "Header"): the page never moves, the change
 * has hysteresis, the name only fades (never clipped), the mark moves to the centre, the season's
 * icons cross-fade with a slide (in WebKit too) and reduced motion makes it all instant.
 * 1440 on the chromium project, 390 on mobile and webkit.
 */

/** How far below the header line the hero's bottom must be before the header expands. */
const EXPAND_GAP = 48;
/** Into the 300 ms change, where everything should be on its way. */
const MID = 150;

function viewportFor(project: string) {
  return project === "chromium" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
}

async function open(page: Page, project: string) {
  await page.setViewportSize(viewportFor(project));
  await page.goto("/");
  await page.waitForSelector('[data-surface="header"][data-placed="true"]', { state: "attached" });
  await expect(page.getByTestId("site-header")).toHaveAttribute("data-collapsed", "false");
}

async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}

/** The scroll position at which the hero's bottom meets the header line (the box's bottom). */
async function boundary(page: Page): Promise<number> {
  return page.evaluate(() => {
    const box = document.querySelector('[data-testid="site-header"]')!.getBoundingClientRect();
    const hero = document.querySelector("[data-hero-sentinel]")!.getBoundingClientRect();
    return Math.round(hero.bottom + window.scrollY - box.height);
  });
}

type Step = { y: number; collapsed: boolean; below: number };

/**
 * Scrolls from `from` to `to` in 2px steps, two animation frames per step, recording the state
 * and how far the hero's bottom is below the header line.
 */
async function sweep(page: Page, from: number, to: number): Promise<Step[]> {
  return page.evaluate(
    async ({ from, to }) => {
      const frames = () =>
        new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const header = document.querySelector<HTMLElement>('[data-testid="site-header"]')!;
      const hero = document.querySelector("[data-hero-sentinel]")!;
      const step = to > from ? 2 : -2;
      const steps: Step[] = [];
      for (let y = from; step > 0 ? y <= to : y >= to; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await frames();
        steps.push({
          y,
          collapsed: header.dataset.collapsed === "true",
          below: hero.getBoundingClientRect().bottom - header.getBoundingClientRect().height,
        });
      }
      return steps;
    },
    { from, to },
  );
}

const flips = (steps: Step[]) =>
  steps.filter((s, i) => i > 0 && s.collapsed !== steps[i - 1].collapsed);

/**
 * Collapses the header by scrolling past the hero and samples, in the page, the name, the mark
 * and every header icon's transform at the start, `at` ms after the state changes, and once
 * settled (600 ms).
 */
async function sampleCollapse(page: Page, to: number, at: number) {
  return page.evaluate(
    async ({ to, at }) => {
      const header = document.querySelector<HTMLElement>('[data-testid="site-header"]')!;
      const visible = (sel: string) =>
        [...document.querySelectorAll<HTMLElement>(sel)].find((el) => el.getClientRects().length)!;
      const matrix = (el: Element) => {
        const t = getComputedStyle(el).transform;
        if (t === "none") return [1, 0, 0, 1, 0, 0];
        return t
          .replace(/^matrix\(|\)$/g, "")
          .split(",")
          .map(Number);
      };
      const snapshot = () => {
        const logo = visible('[data-testid="site-logo"]');
        const mark = logo.querySelector('[data-placeholder="logo"]')!.getBoundingClientRect();
        const name = logo.querySelector<HTMLElement>('[data-testid="site-name"]')!;
        const column = visible("[data-header-content]").getBoundingClientRect();
        const layer = visible('[data-surface="header"]');
        return {
          nameWidth: name.getBoundingClientRect().width,
          nameOpacity: getComputedStyle(name).opacity,
          markX: mark.left + mark.width / 2,
          columnX: column.left + column.width / 2,
          icons: [...layer.querySelectorAll("svg")].map(matrix),
        };
      };
      const start = snapshot();
      const changed = new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (header.dataset.collapsed === "true") {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(header, { attributes: true, attributeFilter: ["data-collapsed"] });
      });
      window.scrollTo({ top: to, behavior: "instant" });
      await changed;
      await new Promise((resolve) => setTimeout(resolve, at));
      const mid = snapshot();
      await new Promise((resolve) => setTimeout(resolve, 600 - at));
      return { start, mid, end: snapshot() };
    },
    { to, at },
  );
}

const between = (a: number, x: number, b: number) =>
  Math.min(a, b) + 0.5 < x && x < Math.max(a, b) - 0.5;

test.describe("header collapse", () => {
  test("one change each way, with 48px of hysteresis on the way back", async ({
    page,
  }, testInfo) => {
    await open(page, testInfo.project.name);
    const at = await boundary(page);
    await scrollTo(page, at - 80);
    const down = await sweep(page, at - 80, at + 80);
    expect(down[0].collapsed).toBe(false);
    const downFlips = flips(down);
    expect(downFlips, JSON.stringify(downFlips)).toHaveLength(1);
    expect(downFlips[0].collapsed).toBe(true);
    // Never before the hero's bottom has passed the header line.
    expect(down.filter((s) => s.collapsed && s.below >= 0)).toEqual([]);

    const up = await sweep(page, at + 80, at - 80);
    const upFlips = flips(up);
    expect(upFlips, JSON.stringify(upFlips)).toHaveLength(1);
    expect(upFlips[0].collapsed).toBe(false);
    // Only once the hero's bottom is at least 48px below the line.
    expect(upFlips[0].below).toBeGreaterThanOrEqual(EXPAND_GAP);
    expect(up.filter((s) => !s.collapsed && s.below < EXPAND_GAP)).toEqual([]);
  });

  test("the page below never moves and the header box keeps its height", async ({
    page,
  }, testInfo) => {
    await open(page, testInfo.project.name);
    const at = await boundary(page);
    const measure = () =>
      page.evaluate(() => ({
        facts:
          document.querySelector('[data-testid="facts-strip"]')!.getBoundingClientRect().top +
          window.scrollY,
        box: document.querySelector('[data-testid="site-header"]')!.getBoundingClientRect().height,
      }));
    await scrollTo(page, at - 80);
    await page.waitForTimeout(400);
    const expanded = await measure();
    await scrollTo(page, at + 80);
    await expect(page.getByTestId("site-header")).toHaveAttribute("data-collapsed", "true");
    await page.waitForTimeout(400);
    expect(await measure()).toEqual(expanded);
    await scrollTo(page, at - 80);
    await expect(page.getByTestId("site-header")).toHaveAttribute("data-collapsed", "false");
    await page.waitForTimeout(400);
    expect(await measure()).toEqual(expanded);
  });

  test("the name only fades, the mark moves to the centre, the icons slide on the way", async ({
    page,
  }, testInfo) => {
    await open(page, testInfo.project.name);
    const at = await boundary(page);
    await scrollTo(page, at - 80);
    await page.waitForTimeout(400);
    const { start, mid, end } = await sampleCollapse(page, at + 80, MID);

    // Never clipped: the same width throughout, faded out at the end.
    expect(Math.abs(mid.nameWidth - start.nameWidth)).toBeLessThan(0.5);
    expect(Math.abs(end.nameWidth - start.nameWidth)).toBeLessThan(0.5);
    expect(end.nameOpacity).toBe("0");
    // The mark ends centred in the brand's column and is on its way at 150 ms.
    expect(Math.abs(end.markX - end.columnX)).toBeLessThanOrEqual(1);
    expect(
      between(start.markX, mid.markX, end.markX),
      JSON.stringify([start, mid, end].map((s) => s.markX)),
    ).toBe(true);
    // At least one icon is mid-slide: its translation strictly between start and end.
    const moving = start.icons.filter((m, i) => between(m[4], mid.icons[i][4], end.icons[i][4]));
    expect(moving.length, "icons mid-slide at 150 ms").toBeGreaterThan(0);
  });

  test("reduced motion: every icon is in its collapsed place by 50 ms", async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, testInfo.project.name);
    const at = await boundary(page);
    await scrollTo(page, at - 80);
    await page.waitForTimeout(400);
    const { start, mid, end } = await sampleCollapse(page, at + 80, 50);
    const differs = (a: number[], b: number[]) => a.some((v, i) => Math.abs(v - b[i]) > 0.01);
    expect(
      start.icons.some((m, i) => differs(m, end.icons[i])),
      "icons change state",
    ).toBe(true);
    const late = mid.icons.filter((m, i) => differs(m, end.icons[i]));
    expect(late, "icons still moving at 50 ms").toEqual([]);
    expect(Math.abs(mid.markX - end.markX)).toBeLessThanOrEqual(1);
  });
});
