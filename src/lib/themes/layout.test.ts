import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The public layout wraps header, main and footer in an element that carries the theme; the
 * dashboard layout never does (it keeps Bengal green). Vitest runs in node without a DOM and the
 * nested components are async server components, so the test calls the layout functions and
 * walks the element trees they return instead of rendering them.
 */
const mocks = vi.hoisted(() => ({
  getPageTheme: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock("@/db/queries/settings", () => ({
  getGeneralSettings: vi.fn(async () => ({ studioName: "Studio", tagline: "", taglineBn: "" })),
  getAnnouncementSettings: vi.fn(async () => ({ enabled: false, messages: [] })),
  getContactSettings: vi.fn(async () => ({ whatsappNumber: "", email: "" })),
  getSocialSettings: vi.fn(async () => ({ instagram: "", facebook: "" })),
}));
vi.mock("@/lib/i18n", () => ({ getT: vi.fn(async () => (key: string) => key) }));
vi.mock("@/lib/themes/active", () => ({ getPageTheme: mocks.getPageTheme }));
vi.mock("@/lib/auth", () => ({ requireOwner: mocks.requireOwner }));
vi.mock("@/components/admin/admin-nav", () => ({ AdminNav: () => null }));
vi.mock("@/components/public/layout/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/components/public/layout/site-footer", () => ({ SiteFooter: () => null }));
vi.mock("@/components/public/layout/whatsapp-button", () => ({ WhatsAppButton: () => null }));

import PublicLayout from "@/app/(public)/layout";
import AdminLayout from "@/app/admin/(dashboard)/layout";
import { getTheme } from "./themes";

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

const layoutProps = { children: createElement("p", null, "page"), params: Promise.resolve({}) };

beforeEach(() => {
  mocks.getPageTheme.mockResolvedValue(getTheme("eid"));
  mocks.requireOwner.mockResolvedValue({ id: "owner", email: "owner@example.com" });
});

describe("where the seasonal theme is applied", () => {
  it("the public layout's wrapper carries data-theme and the accent variable", async () => {
    const tree = await PublicLayout(layoutProps);
    expect(tree.type).toBe("div");
    expect(tree.props["data-theme"]).toBe("eid");
    expect(tree.props.style).toEqual({ "--brand-accent": "#2D4356" });
    const tags = [...elements(tree)].map((el) => el.type);
    expect(tags).toContain("main");
  });

  it("the dashboard layout carries no theme anywhere", async () => {
    const tree = await AdminLayout(layoutProps);
    for (const el of elements(tree)) {
      expect(el.props["data-theme"]).toBeUndefined();
      expect(el.props.style).toBeUndefined();
    }
    expect(mocks.getPageTheme).not.toHaveBeenCalled();
  });
});
