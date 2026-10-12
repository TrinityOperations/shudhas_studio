import type { CSSProperties } from "react";
import { SEASON_ICONS, type SeasonIconName } from "@/lib/themes/artwork/icons";
import { cn } from "@/lib/utils";

export const SYMBOL_PREFIX = "season-icon-";

export const SEASON_STROKE = 1.4;

/**
 * The page's icon sprite: one `<symbol>` per icon the active theme can use, rendered once in the
 * public layout so a band of 46 motifs is 46 `<use>` elements, not 46 copies of the path.
 */
export function SeasonIconSprite({ names }: { names: readonly SeasonIconName[] }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="absolute"
      data-testid="season-icon-sprite"
    >
      <defs>
        {names.map((name) => {
          const icon = SEASON_ICONS[name];
          return (
            <symbol key={name} id={`${SYMBOL_PREFIX}${name}`} viewBox="0 0 48 48">
              {icon.s ? (
                <path
                  d={icon.s}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={SEASON_STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {icon.f ? <path d={icon.f} fill="currentColor" stroke="none" /> : null}
            </symbol>
          );
        })}
      </defs>
    </svg>
  );
}

type Props = {
  name: SeasonIconName;
  size: number;
  /** Degrees */
  rotate?: number;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
};

/** One decorative icon from the sprite, in `currentColor`. Never carries a label. */
export function SeasonIcon({ name, size, rotate = 0, opacity, className, style }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("pointer-events-none shrink-0 select-none", className)}
      style={{
        ...style,
        opacity,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
      data-season-icon={name}
    >
      <use href={`#${SYMBOL_PREFIX}${name}`} />
    </svg>
  );
}
