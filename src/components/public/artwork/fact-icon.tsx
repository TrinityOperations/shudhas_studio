import { FACT_ICON, FACT_ICONS } from "@/lib/themes/artwork/data";
import { SeasonIcon } from "./season-icon";

/**
 * The line icon before each studio fact in the moving bar, in the accent colour: 22px below lg
 * and 26px from lg, stroke 1.6, as in the mock-up.
 */
export function FactIcon({ index }: { index: number }) {
  const name = FACT_ICONS[index % FACT_ICONS.length];
  return (
    <SeasonIcon
      name={name}
      size={FACT_ICON.size}
      strokeWidth={FACT_ICON.stroke}
      className="text-primary lg:size-[26px]"
    />
  );
}
