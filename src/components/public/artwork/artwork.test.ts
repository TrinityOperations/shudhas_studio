import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n", () => ({
  getT: vi.fn(async () => (key: string) => key),
  getLocale: vi.fn(async () => "en"),
}));
vi.mock("@/lib/themes/active", () => ({
  getPageTheme: vi.fn(async () => ({ id: "eid", accent: "#2D4356" })),
}));

import { SeasonalBanner } from "@/components/public/home/seasonal-banner";
import { ArtworkLayer } from "./artwork-layer";
import { FactIcon } from "./fact-icon";
import { SeasonIcon, SeasonIconSprite } from "./season-icon";
import { TagArtwork } from "./tag-artwork";

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

describe("artwork markup", () => {
  it("every artwork svg is aria-hidden, unfocusable and has no accessible name", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(SeasonIconSprite, { names: ["crescent", "lantern"] }),
        createElement(SeasonIcon, { name: "crescent", size: 20, rotate: -12, opacity: 0.34 }),
        createElement(FactIcon, { index: 1 }),
      ),
    );
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(3);
    for (const svg of svgs) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).not.toMatch(/aria-label|<title|role=/);
    }
    expect(html).toContain('id="season-icon-crescent"');
    expect(html).toContain('href="#season-icon-crescent"');
    expect(html).toContain('href="#season-icon-nib"');
    expect(html).toContain('vector-effect="non-scaling-stroke"');
    expect(html).toContain("rotate(-12deg)");
  });

  it("the layer server-renders empty and aria-hidden, so there is no layout shift", () => {
    const html = renderToStaticMarkup(
      createElement(ArtworkLayer, {
        surface: "tag",
        theme: "eid",
        deco: "#E3B867",
        motifs: [
          { icon: "sparkle", x: 80, y: 16, size: 26, rotate: 0, colour: "deco", opacity: 1 },
        ],
        band: { icon: "star8", size: 18, count: 30, colour: "ivory", opacity: 0.18 },
      }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-placed="false"');
    expect(html).toContain("pointer-events-none");
    expect(html).not.toContain("<svg");
  });

  it("the tag's text block contains no artwork and the layer sits beside it", async () => {
    const tree = await SeasonalBanner({
      banner: {
        enabled: true,
        label: "Eid collection",
        labelBn: "",
        headline: "Order early",
        headlineBn: "",
        buttonLabel: "Book",
        buttonLabelBn: "",
        href: "/book",
      },
    });
    const all = [...elements(tree)];
    const text = all.find((el) => el.props["data-artwork-exclude"] === "column");
    expect(text).toBeDefined();
    expect([...elements(text!.props.children)].some((el) => el.type === TagArtwork)).toBe(false);
    const tag = all.find((el) => el.props["data-testid"] === "seasonal-tag");
    expect([...elements(tag!.props.children)].some((el) => el.type === TagArtwork)).toBe(true);
    // The artwork reads the page theme and passes the deco colour, hangers and band for Eid.
    const layer = await TagArtwork();
    expect(layer.type).toBe(ArtworkLayer);
    expect(layer.props.theme).toBe("eid");
    expect(layer.props.deco).toBe("#E3B867");
    expect(layer.props.hangers).toHaveLength(3);
    expect(layer.props.band.icon).toBe("star8");
  });
});
