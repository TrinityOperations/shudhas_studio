import { PackageIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders icon, title, hint and action, and keeps the test id for Playwright", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        icon: PackageIcon,
        title: "No products yet",
        hint: "Add your first product.",
        action: createElement("a", { href: "/admin/products/new" }, "New product"),
        "data-testid": "products-empty",
      }),
    );
    expect(html).toContain('data-testid="products-empty"');
    expect(html).toContain("<svg");
    expect(html).toContain("No products yet");
    expect(html).toContain("Add your first product.");
    expect(html).toContain('href="/admin/products/new"');
  });

  it("leaves out the hint and action when they are not given", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, { icon: PackageIcon, title: "Nothing here" }),
    );
    expect(html).toContain("Nothing here");
    expect(html).not.toContain('data-slot="empty-description"');
    expect(html).not.toContain('data-slot="empty-content"');
  });
});
