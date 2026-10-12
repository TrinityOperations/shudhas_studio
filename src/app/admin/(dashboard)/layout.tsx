import type { Metadata, Viewport } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { ServiceWorkerRegistration } from "@/components/admin/push/service-worker";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

// OD-60: the dashboard is installable; the manifest and icons are linked here only, never on
// the public site.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Shudha's", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

// Installed on a phone the page runs edge to edge; the bars pad themselves with the safe-area
// insets (admin-nav.tsx) and `main` keeps clear of the bottom tab bar.
export const viewport: Viewport = { viewportFit: "cover" };

// Every page under here must call requireOwner() too (pages re-render independently of layouts).
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [owner, t] = await Promise.all([requireOwner(), getT()]);

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <a
        href="#main"
        className="focus:bg-background focus:ring-ring/50 sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:ring-3"
      >
        {t("common.skipToContent")}
      </a>
      <ServiceWorkerRegistration />
      <AdminNav email={owner.email ?? ""} />
      <main
        id="main"
        className="min-w-0 flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-10"
      >
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
