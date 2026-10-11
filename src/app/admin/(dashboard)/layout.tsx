import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { ServiceWorkerRegistration } from "@/components/admin/push/service-worker";
import { requireOwner } from "@/lib/auth";

// OD-60: the dashboard is installable; the manifest and icons are linked here only, never on
// the public site.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Shudha's", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

// Every page under here must call requireOwner() too (pages re-render independently of layouts).
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const owner = await requireOwner();

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <ServiceWorkerRegistration />
      <AdminNav email={owner.email ?? ""} />
      <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
