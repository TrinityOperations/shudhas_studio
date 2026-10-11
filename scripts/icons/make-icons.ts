/**
 * Renders the dashboard's app icons (OD-60) into public/icons/ and commits the PNGs:
 *
 *   pnpm tsx scripts/icons/make-icons.ts
 *
 * The mark is the Eczar "S" from the site header, white on Bengal green (--brand-accent in
 * src/app/globals.css). sharp's SVG renderer only sees fonts installed on the machine, so the
 * glyph outline is embedded below as an SVG path rather than drawn with a font: it was exported
 * once from Eczar Regular (OFL, Google Fonts) with opentype.js in a throwaway directory
 * (`font.charToGlyph("S").getPath(0, 0, font.unitsPerEm).toPathData(1)`), which is not a
 * dependency of this project. Regenerate the path the same way if the mark ever changes.
 *
 * Files: icon-192/512 ("any", green disc on transparent), icon-maskable-192/512 (full-bleed
 * green, mark inside the safe zone), apple-touch-icon (180, full-bleed) and badge-96 (white mark
 * on transparent, Android's monochrome status-bar badge).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const GREEN = "#1E4A3A";
const WHITE = "#FFFFFF";
const OUT_DIR = path.join(process.cwd(), "public", "icons");

/** Eczar Regular "S", 1000 units per em, y down, baseline at y = 0 (the glyph sits above it). */
const S_PATH =
  "M267 20L267 20Q235 20 194 12.5Q153 5 116-10.5Q79-26 56-49L56-49L79-154Q114-105 159-81Q204-57 " +
  "250.5-50.5Q297-44 335-48L335-48Q365-64 379-93Q393-122 393-150L393-150Q393-185 374-209Q355-233 " +
  "321.5-252Q288-271 243-292L243-292Q200-313 158-337.5Q116-362 88-398.5Q60-435 60-489L60-489Q60-548 " +
  "93.5-588.5Q127-629 180.5-649.5Q234-670 293-670L293-670Q325-670 355.5-665Q386-660 412-653Q438-646 " +
  "458-639L458-639L407-541Q366-585 310-597Q254-609 201-601L201-601Q177-587 165-561.5Q153-536 " +
  "153-510L153-510Q153-477 172.5-454.5Q192-432 225.5-413.5Q259-395 302-375L302-375Q349-353 " +
  "391.5-327.5Q434-302 461-265.5Q488-229 488-172L488-172Q488-111 456.5-68Q425-25 375-2.5Q325 20 267 " +
  "20ZM120-218L139-49L56-49Q55-66 55-94Q55-122 58-155Q61-188 " +
  "66-218L66-218L120-218ZM448-470L394-470L378-620L458-639Q460-623 459.5-594.5Q459-566 " +
  "456.5-533.5Q454-501 448-470L448-470Z";
/** Glyph bounds in those units: x 55..488, y -670..20. */
const S_BOX = { x: 55, y: -670, width: 433, height: 690 };

type Shape = "disc" | "square" | "none";

/** An SVG with the mark centred; `scale` is the mark's height as a fraction of the canvas. */
function svg(size: number, shape: Shape, scale: number, markColour: string): string {
  const markHeight = size * scale;
  const k = markHeight / S_BOX.height;
  const markWidth = S_BOX.width * k;
  const tx = (size - markWidth) / 2 - S_BOX.x * k;
  const ty = (size - markHeight) / 2 - S_BOX.y * k;
  const background =
    shape === "disc"
      ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${GREEN}"/>`
      : shape === "square"
        ? `<rect width="${size}" height="${size}" fill="${GREEN}"/>`
        : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${background}<path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(5)})" d="${S_PATH}" fill="${markColour}"/></svg>`;
}

const ICONS: { file: string; size: number; shape: Shape; scale: number; colour: string }[] = [
  { file: "icon-192.png", size: 192, shape: "disc", scale: 0.5, colour: WHITE },
  { file: "icon-512.png", size: 512, shape: "disc", scale: 0.5, colour: WHITE },
  // Maskable: platforms crop up to 10% per side, so the mark stays well inside the centre.
  { file: "icon-maskable-192.png", size: 192, shape: "square", scale: 0.42, colour: WHITE },
  { file: "icon-maskable-512.png", size: 512, shape: "square", scale: 0.42, colour: WHITE },
  { file: "apple-touch-icon.png", size: 180, shape: "square", scale: 0.5, colour: WHITE },
  { file: "badge-96.png", size: 96, shape: "none", scale: 0.8, colour: WHITE },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const icon of ICONS) {
    const png = await sharp(Buffer.from(svg(icon.size, icon.shape, icon.scale, icon.colour)))
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, icon.file), png);
    console.log(`${icon.file} ${png.length} bytes`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
