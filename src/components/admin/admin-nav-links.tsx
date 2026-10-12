"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, NAV_ICONS, type NavLink } from "@/components/admin/nav-icons";
import { cn } from "@/lib/utils";

export type NavSection = { heading?: string; links: NavLink[] };

/** Sidebar links in groups; the longest matching prefix is current (Settings vs Theme). */
export function AdminNavLinks({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const current = sections
    .flatMap((s) => s.links)
    .filter((link) => isCurrent(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <div key={i} className="space-y-1">
          {section.heading ? (
            <p className="text-muted-foreground px-3 text-[11px] font-semibold tracking-wider uppercase">
              {section.heading}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {section.links.map((link) => {
              const Icon = NAV_ICONS[link.icon];
              const active = current?.href === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={link.href === "/admin/home-editor" ? false : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "hover:bg-muted focus-visible:ring-ring/50 flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none",
                      active ? "bg-muted text-primary font-medium" : "text-ink-soft",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{link.label}</span>
                    {link.badge ? (
                      <span
                        className="bg-mark ml-auto inline-block min-w-[18px] rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold text-white"
                        aria-label={link.badge.label}
                        data-testid="gallery-badge"
                      >
                        {link.badge.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
