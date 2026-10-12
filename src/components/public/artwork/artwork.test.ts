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
import { FACT_ICONS, HDR, THEME_ARTWORK, type SurfaceArtwork } from "@/lib/themes/artwork/data";
import type { SeasonIconName } from "@/lib/themes/artwork/icons";
import { artworkIconNames } from "@/lib/themes/artwork/names";
import { resolveHeaderTable } from "@/lib/themes/artwork/place";
import { THEME_IDS } from "@/lib/themes/themes";
import { ArtworkLayer } from "./artwork-layer";
import { FactIcon } from "./fact-icon";
import { HeaderArtworkLayer } from "./header-artwork-layer";
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
        createElement(SeasonIcon, {
          name: "lantern",
          size: 13,
          rotate: 9,
          strokeWidth: 1.8,
          style: { transform: "translate(-50%, -50%)" },
        }),
        createElement(FactIcon, { index: 1 }),
      ),
    );
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(4);
    for (const svg of svgs) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).not.toMatch(/aria-label|<title|role=/);
    }
    expect(html).toContain('id="season-icon-crescent"');
    expect(html).toContain('href="#season-icon-crescent"');
    expect(html).toContain('href="#season-icon-nib"');
    expect(html).toContain('vector-effect="non-scaling-stroke"');
    // The sprite's paths take their stroke from each icon: 1.4 by default, 1.8 in the header.
    expect(html).not.toMatch(/<path[^>]*stroke-width/);
    expect(svgs[1]).toContain('stroke-width="1.4"');
    expect(svgs[2]).toContain('stroke-width="1.8"');
    expect(svgs[3]).toContain('stroke-width="1.6"'); // the facts strip's icon
    expect(svgs[1]).toContain("rotate(-12deg)");
    // A caller's transform comes first, the rotation after it.
    expect(svgs[2]).toContain("transform:translate(-50%, -50%) rotate(9deg)");
  });

  it("the layers server-render empty and aria-hidden, so there is no layout shift", () => {
    const art = THEME_ARTWORK.eid;
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(ArtworkLayer, {
          surface: "tag",
          theme: "eid",
          deco: art.deco,
          pool: [[80, 16, 26, 0, "d"]],
          set: art.set,
          filler: art.headerFiller,
          fillerBelow: 16,
          tiers: { ivory: [1, 1, 1], deco: [1, 1, 1] },
          hero: art.tag.hero,
          band: art.tag.band,
          bandLayout: { edge: "bottom", inset: 16, padding: 100 },
        }),
        createElement(HeaderArtworkLayer, {
          theme: "eid",
          pop: art.pop,
          icons: resolveHeaderTable(HDR.top, art),
        }),
      ),
    );
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(html.match(/data-placed="false"/g)).toHaveLength(2);
    expect(html).toContain('data-surface="header"');
    expect(html).toContain("pointer-events-none");
    expect(html).not.toContain("<svg");
  });

  it("the tag's text block contains no artwork; one layer from lg, one below it", async () => {
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
    const text = all.find((el) => el.props["data-artwork-exclude"] === "lines");
    expect(text).toBeDefined();
    expect([...elements(text!.props.children)].some((el) => el.type === TagArtwork)).toBe(false);
    const tag = all.find((el) => el.props["data-testid"] === "seasonal-tag");
    expect([...elements(tag!.props.children)].some((el) => el.type === TagArtwork)).toBe(true);
    // The artwork reads the page theme: Eid's set, deco, hangers and band from lg; below lg
    // the phone pool, no hangers and the hero at 45% at the top right.
    const layers = [...elements(await TagArtwork())].filter((el) => el.type === ArtworkLayer);
    expect(layers).toHaveLength(2);
    const [wide, compact] = layers.map((el) => el.props);
    expect(wide).toMatchObject({ theme: "eid", deco: "#E3B867", className: "hidden lg:block" });
    expect(wide.set).toEqual(THEME_ARTWORK.eid.set);
    expect(wide.hangers).toHaveLength(3);
    expect((wide.band as { icon: string }).icon).toBe("star8");
    expect(compact).toMatchObject({ compact: true, className: "lg:hidden" });
    expect(wide.bandLayout).toEqual({ edge: "bottom", inset: 16, padding: 100 });
    expect(compact.bandLayout).toEqual({ edge: "bottom", inset: 16, padding: 40 });
    expect(compact.band).toMatchObject({ icon: "star8", count: 12 });
    expect(compact.hangers).toBeUndefined();
    expect(compact.hero).toMatchObject({ icon: "crescent", size: 81, x: 92, y: 10 });
  });

  it("the sprite holds exactly the icons the layers can draw, nothing else", () => {
    const surface = (s: SurfaceArtwork) => [
      ...(s.hero ? [s.hero.icon] : []),
      ...s.hangers.flatMap((h) => h.items),
      s.band.icon,
    ];
    for (const id of THEME_IDS) {
      const art = THEME_ARTWORK[id];
      const drawable = new Set<SeasonIconName>([
        ...Object.values(HDR).flatMap((table) => resolveHeaderTable(table, art).map((i) => i.icon)),
        ...art.set, // the pools show the set
        art.headerFiller, // and the filler
        ...surface(art.tag),
        ...surface(art.footer),
        ...FACT_ICONS,
      ]);
      expect(artworkIconNames(id), id).toEqual([...drawable].sort());
    }
    expect(artworkIconNames("eid")).not.toContain("kite");
  });
});
