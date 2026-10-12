import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The nav is an async server component whose children are client components, so the test calls
 * it and walks the element tree it returns (like src/lib/themes/layout.test.ts), then renders the
 * client pieces on their own with a mocked pathname.
 */
const mocks = vi.hoisted(() => ({
  countPendingGallery: vi.fn(),
  pathname: "/admin/bookings",
}));

vi.mock("@/db/queries/gallery", () => ({ countPendingGallery: mocks.countPendingGallery }));
vi.mock("@/db/queries/settings", () => ({
  getGeneralSettings: vi.fn(async () => ({ studioName: "Shudha's Studio", tagline: "" })),
}));
vi.mock("@/lib/i18n", () => ({
  getT: vi.fn(
    async () => (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  ),
}));
vi.mock("@/lib/auth", () => ({
  requireOwner: vi.fn(async () => ({ id: "owner", email: "owner@example.com" })),
}));
vi.mock("@/components/admin/sign-out-button", () => ({ SignOutButton: () => null }));
vi.mock("@/components/admin/push/service-worker", () => ({
  ServiceWorkerRegistration: () => null,
}));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("next/link", () => ({
  default: ({ href, prefetch, ...rest }: Record<string, unknown>) =>
    createElement("a", { href, ...rest, "data-prefetch": prefetch === false ? "off" : undefined }),
}));

import AdminLayout from "@/app/admin/(dashboard)/layout";
import { AdminNav } from "./admin-nav";
import { AdminNavLinks } from "./admin-nav-links";
import { AdminTabBar } from "./admin-tab-bar";

type Props = Record<string, unknown> & { children?: ReactNode };

function* elements(node: ReactNode): Generator<ReactElement<Props>> {
  if (Array.isArray(node)) {
    for (const child of node) yield* elements(child);
    return;
  }
  if (!isValidElement<Props>(node)) return;
  yield node;
  yield* elements(node.props.children);
}

beforeEach(() => {
  mocks.countPendingGallery.mockResolvedValue(2);
  mocks.pathname = "/admin/bookings";
});

describe("AdminNav", () => {
  it("describes four tabs for phones and the grouped sidebar links, with the gallery badge on both", async () => {
    const tree = await AdminNav({ email: "owner@example.com" });
    const all = [...elements(tree)];

    const tabBar = all.find((el) => el.type === AdminTabBar);
    expect(tabBar).toBeDefined();
    const tabs = tabBar!.props.tabs as { href: string; badge?: { count: number } }[];
    expect(tabs.map((t) => t.href)).toEqual([
      "/admin/bookings",
      "/admin/products",
      "/admin/availability",
      "/admin/more",
    ]);
    expect(tabs[3].badge).toEqual({ count: 2, label: 'admin.gallery.badge:{"count":2}' });

    const sidebar = all.find((el) => el.type === AdminNavLinks);
    expect(sidebar).toBeDefined();
    const sections = sidebar!.props.sections as {
      heading?: string;
      links: { href: string; badge?: { count: number } }[];
    }[];
    expect(sections.map((s) => s.links.map((l) => l.href))).toEqual([
      ["/admin", "/admin/bookings", "/admin/products", "/admin/availability", "/admin/gallery"],
      ["/admin/home-editor", "/admin/settings/theme", "/admin/settings"],
    ]);
    expect(sections[1].heading).toBe("admin.nav.site");
    expect(sections[0].links[4].badge?.count).toBe(2);

    // Bengal green always: nothing in the nav carries a theme or an inline style.
    for (const el of all) {
      expect(el.props["data-theme"]).toBeUndefined();
      expect(el.props.style).toBeUndefined();
    }
  });

  it("has no badge anywhere when nothing is pending", async () => {
    mocks.countPendingGallery.mockResolvedValue(0);
    const tree = await AdminNav({ email: "owner@example.com" });
    const all = [...elements(tree)];
    const tabs = all.find((el) => el.type === AdminTabBar)!.props.tabs as { badge?: unknown }[];
    expect(tabs.every((t) => t.badge === undefined)).toBe(true);
  });
});

describe("AdminTabBar", () => {
  const tabs = [
    { href: "/admin/bookings", label: "Bookings", icon: "bookings" as const },
    { href: "/admin/products", label: "Products", icon: "products" as const },
    { href: "/admin/availability", label: "Availability", icon: "availability" as const },
    {
      href: "/admin/more",
      label: "More",
      icon: "more" as const,
      badge: { count: 2, label: "2 photos waiting" },
      match: ["/admin/more", "/admin/gallery", "/admin/settings"],
    },
  ];

  it("renders four links and marks the current one", () => {
    const html = renderToStaticMarkup(createElement(AdminTabBar, { label: "Main", tabs }));
    expect(html.match(/<a /g)).toHaveLength(4);
    expect(html).toContain('href="/admin/bookings" aria-current="page"');
    expect(html).not.toContain('href="/admin/products" aria-current');
    expect(html).toContain('data-testid="more-badge"');
  });

  it("lights the More tab on the pages it lists", () => {
    mocks.pathname = "/admin/settings/theme";
    const html = renderToStaticMarkup(createElement(AdminTabBar, { label: "Main", tabs }));
    expect(html).toContain('href="/admin/more" aria-current="page"');
  });
});

describe("AdminNavLinks", () => {
  it("makes only the longest matching prefix current, so Theme and Settings never both light up", () => {
    mocks.pathname = "/admin/settings/theme";
    const sections = [
      {
        links: [
          { href: "/admin", label: "Dashboard", icon: "dashboard" as const },
          { href: "/admin/settings/theme", label: "Theme", icon: "theme" as const },
          { href: "/admin/settings", label: "Settings", icon: "settings" as const },
        ],
      },
    ];
    const html = renderToStaticMarkup(createElement(AdminNavLinks, { sections }));
    expect(html).toContain('href="/admin/settings/theme" aria-current="page"');
    expect(html).not.toContain('href="/admin/settings" aria-current');
    expect(html).not.toContain('href="/admin" aria-current');
  });
});

describe("dashboard layout", () => {
  it("puts the skip link first, keeps the worker registration and still carries no theme", async () => {
    const tree = await AdminLayout({
      children: createElement("p", null, "page"),
      params: Promise.resolve({}),
    });
    const all = [...elements(tree)];
    expect(all[1].type).toBe("a");
    expect(all[1].props.href).toBe("#main");
    expect(all.some((el) => el.type === AdminNav)).toBe(true);
    const main = all.find((el) => el.type === "main");
    expect(main?.props.id).toBe("main");
    expect(String(main?.props.className)).toContain("safe-area-inset-bottom");
    for (const el of all) {
      expect(el.props["data-theme"]).toBeUndefined();
      expect(el.props.style).toBeUndefined();
    }
  });
});
