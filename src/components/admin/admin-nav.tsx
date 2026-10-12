import { AdminNavLinks, type NavSection } from "@/components/admin/admin-nav-links";
import { AdminTabBar } from "@/components/admin/admin-tab-bar";
import { AdminWordmark } from "@/components/admin/admin-wordmark";
import type { NavBadge, NavLink } from "@/components/admin/nav-icons";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { countPendingGallery } from "@/db/queries/gallery";
import { getGeneralSettings } from "@/db/queries/settings";
import { getT, type T } from "@/lib/i18n";

/** Wording shared by every badge that shows the pending gallery count. */
export function galleryBadge(t: T, pending: number): NavBadge | undefined {
  if (!pending) return undefined;
  return {
    count: pending,
    label:
      pending === 1 ? t("admin.gallery.badgeOne") : t("admin.gallery.badge", { count: pending }),
  };
}

/** Paths that light the More tab: the More page itself and everything it lists. */
export const MORE_TAB_MATCH = ["/admin/more", "/admin/gallery", "/admin/settings"];

/**
 * Dashboard navigation (OD-60 design pass): a sidebar from `md` up, a slim top bar and a bottom
 * tab bar on phones. One server component fetches the data and renders all three.
 */
export async function AdminNav({ email }: { email: string }) {
  const [t, pending, settings] = await Promise.all([
    getT(),
    countPendingGallery(),
    getGeneralSettings(),
  ]);
  const badge = galleryBadge(t, pending);

  const primary: NavLink[] = [
    { href: "/admin", label: t("common.dashboard"), icon: "dashboard" },
    { href: "/admin/bookings", label: t("common.bookings"), icon: "bookings" },
    { href: "/admin/products", label: t("common.products"), icon: "products" },
    { href: "/admin/availability", label: t("common.availability"), icon: "availability" },
    { href: "/admin/gallery", label: t("common.gallery"), icon: "gallery", badge },
  ];
  const site: NavLink[] = [
    { href: "/admin/home-editor", label: t("admin.nav.homeEditor"), icon: "homeEditor" },
    { href: "/admin/settings/theme", label: t("admin.settings.nav.theme"), icon: "theme" },
    { href: "/admin/settings", label: t("common.settings"), icon: "settings" },
  ];
  const sections: NavSection[] = [
    { links: primary },
    { heading: t("admin.nav.site"), links: site },
  ];
  const tabs: NavLink[] = [
    { href: "/admin/bookings", label: t("common.bookings"), icon: "bookings" },
    { href: "/admin/products", label: t("common.products"), icon: "products" },
    { href: "/admin/availability", label: t("common.availability"), icon: "availability" },
    { href: "/admin/more", label: t("admin.nav.more"), icon: "more", badge, match: MORE_TAB_MATCH },
  ];

  return (
    <>
      <header
        data-testid="admin-top-bar"
        className="bg-background border-line sticky top-0 z-30 border-b px-4 pt-[env(safe-area-inset-top)] md:hidden"
      >
        <div className="flex h-12 items-center">
          <AdminWordmark studioName={settings.studioName} title={t("common.dashboard")} />
        </div>
      </header>

      <aside
        data-testid="admin-sidebar"
        className="border-line hidden w-60 shrink-0 flex-col border-r md:flex"
      >
        <div className="px-6 pt-8 pb-6">
          <AdminWordmark studioName={settings.studioName} title={t("common.dashboard")} />
        </div>
        <nav aria-label={t("admin.nav.label")} className="flex flex-1 flex-col px-3">
          <AdminNavLinks sections={sections} />
          <div className="border-line mt-auto space-y-3 border-t px-3 pt-4 pb-6">
            <p className="text-muted-foreground truncate text-xs" title={email}>
              {email}
            </p>
            <SignOutButton />
          </div>
        </nav>
      </aside>

      <AdminTabBar label={t("admin.nav.tabs")} tabs={tabs} />
    </>
  );
}
