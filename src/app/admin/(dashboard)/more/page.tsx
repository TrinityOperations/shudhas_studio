import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { galleryBadge } from "@/components/admin/admin-nav";
import { NAV_ICONS, type NavLink } from "@/components/admin/nav-icons";
import { PageHeader } from "@/components/admin/page-header";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { countPendingGallery } from "@/db/queries/gallery";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.more.title") };
}

/** The phone tab bar's fourth tab: a plain list of links, so it works without JavaScript. */
export default async function MorePage() {
  const owner = await requireOwner();
  const [t, pending] = await Promise.all([getT(), countPendingGallery()]);
  const links: NavLink[] = [
    { href: "/admin", label: t("common.dashboard"), icon: "dashboard" },
    {
      href: "/admin/gallery",
      label: t("common.gallery"),
      icon: "gallery",
      badge: galleryBadge(t, pending),
    },
    { href: "/admin/home-editor", label: t("admin.nav.homeEditor"), icon: "homeEditor" },
    { href: "/admin/settings/theme", label: t("admin.settings.nav.theme"), icon: "theme" },
    { href: "/admin/settings", label: t("common.settings"), icon: "settings" },
  ];

  return (
    <section className="space-y-6">
      <PageHeader title={t("admin.more.title")} description={t("admin.more.description")} />
      <nav aria-label={t("admin.more.title")}>
        <ul className="divide-line border-line divide-y rounded-lg border" data-testid="more-list">
          {links.map((link) => {
            const Icon = NAV_ICONS[link.icon];
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={link.href === "/admin/home-editor" ? false : undefined}
                  className="hover:bg-muted focus-visible:ring-ring/50 flex min-h-14 items-center gap-3 px-4 text-sm font-medium focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset"
                >
                  <Icon className="text-primary size-5 shrink-0" aria-hidden />
                  <span className="flex-1">{link.label}</span>
                  {link.badge ? (
                    <span
                      className="bg-mark inline-block min-w-[18px] rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold text-white"
                      aria-label={link.badge.label}
                      data-testid="more-gallery-badge"
                    >
                      {link.badge.count}
                    </span>
                  ) : null}
                  <ChevronRightIcon className="text-muted-foreground size-4" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <p className="text-muted-foreground min-w-0 truncate text-sm">
          {t("admin.dashboard.signedInAs", { email: owner.email ?? "" })}
        </p>
        <SignOutButton />
      </div>
    </section>
  );
}
