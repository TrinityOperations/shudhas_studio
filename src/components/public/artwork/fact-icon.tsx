import { FACT_ICONS } from "@/lib/themes/artwork/data";
import { SeasonIcon } from "./season-icon";

/** The line icon before each studio fact in the moving bar, in the accent colour. */
export function FactIcon({ index, size = 22 }: { index: number; size?: number }) {
  const name = FACT_ICONS[index % FACT_ICONS.length];
  return <SeasonIcon name={name} size={size} className="text-primary" />;
}
