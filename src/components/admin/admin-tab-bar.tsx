"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, NAV_ICONS, type NavLink } from "@/components/admin/nav-icons";
import { cn } from "@/lib/utils";

/**
 * Phone navigation (OD-60 design pass): four tabs pinned to the bottom, padded for the home
 * indicator when installed. Sits under dialogs, sheets and toasts (z-30 against their z-50).
 */
export function AdminTabBar({ label, tabs }: { label: string; tabs: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      data-testid="admin-tab-bar"
      className="bg-background border-line fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const Icon = NAV_ICONS[tab.icon];
          const active = (tab.match ?? [tab.href]).some((p) => isCurrent(pathname, p));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring/50 flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] leading-none font-medium focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" aria-hidden />
                  {tab.badge ? (
                    <span
                      className="bg-mark absolute -top-1.5 -right-2.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 font-semibold text-white"
                      aria-label={tab.badge.label}
                      data-testid="more-badge"
                    >
                      {tab.badge.count}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
