import {
  CalendarDaysIcon,
  ClockIcon,
  EllipsisIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PaletteIcon,
  PenLineIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons by name so a server component can describe a link and a client component can draw it
 * (component functions do not cross the server → client boundary).
 */
export const NAV_ICONS = {
  dashboard: LayoutDashboardIcon,
  bookings: CalendarDaysIcon,
  products: PackageIcon,
  availability: ClockIcon,
  gallery: ImagesIcon,
  more: EllipsisIcon,
  homeEditor: PenLineIcon,
  theme: PaletteIcon,
  settings: SettingsIcon,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;

export type NavBadge = { count: number; label: string };

export type NavLink = {
  href: string;
  label: string;
  icon: NavIconName;
  /** A count beside the label (the gallery's pending photos) with its accessible wording */
  badge?: NavBadge;
  /** Paths that make this link current; defaults to its own href */
  match?: string[];
};

/** `/admin` is current only on the home page; every other prefix owns its subtree. */
export function isCurrent(pathname: string, prefix: string): boolean {
  return prefix === "/admin" ? pathname === "/admin" : pathname.startsWith(prefix);
}
