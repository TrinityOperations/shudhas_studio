import Link from "next/link";
import { HeaderMark } from "./header-mark";

type Props = {
  studioName: string;
  homeLabel: string;
  /** Phone header uses the smaller mark and name */
  size?: "desktop" | "phone";
};

/**
 * The centred mark + name. The mark is an "S" until Shudha's logo file arrives: [placeholder].
 * When the header collapses (header-chrome.tsx sets data-collapsed) the name only fades: it is
 * never clipped or narrowed. It fades out in the first 150 ms and back in during the last
 * 150 ms of the way up, so the header's icons, which move in to fill its room, never cross
 * visible letters. It also leaves the brand's layout (absolute), placed so it stays
 * exactly where it was: its centre sits (mark + gap) / 2 right of the brand's centre in both
 * states, so collapsed it is centred at the mark's width plus half the 12px gap from the brand's
 * left edge. The brand then shrinks to the mark, which HeaderMark animates to the centre. On
 * desktop the name shows from lg (Eczar 24, 30 from 1400px).
 */
export function LogoMark({ studioName, homeLabel, size = "desktop" }: Props) {
  const desktop = size === "desktop";
  return (
    <Link
      href="/"
      title={homeLabel}
      className="relative z-10 flex items-center gap-3 rounded-full"
      data-testid="site-logo"
      data-artwork-exclude="brand"
    >
      <HeaderMark
        className={`font-heading border-mark text-mark bg-ivory grid shrink-0 place-items-center rounded-full border-[1.5px] leading-none ${
          desktop ? "size-10 text-xl" : "size-8 text-base"
        }`}
      >
        S
      </HeaderMark>
      <span
        data-testid="site-name"
        data-artwork-collapse
        className={`font-heading text-ink max-w-[16rem] overflow-hidden whitespace-nowrap transition-opacity delay-150 duration-150 group-data-[collapsed=true]/header:pointer-events-none group-data-[collapsed=true]/header:absolute group-data-[collapsed=true]/header:top-1/2 group-data-[collapsed=true]/header:-translate-x-1/2 group-data-[collapsed=true]/header:-translate-y-1/2 group-data-[collapsed=true]/header:opacity-0 group-data-[collapsed=true]/header:delay-0 ${
          desktop
            ? "hidden text-2xl group-data-[collapsed=true]/header:left-[46px] min-[1400px]:text-[30px] lg:inline"
            : "text-[22px] group-data-[collapsed=true]/header:left-[38px]"
        }`}
      >
        {studioName}
      </span>
    </Link>
  );
}
