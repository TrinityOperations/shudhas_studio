import type { Metadata } from "next";
import Link from "next/link";
import { BannerForm } from "@/components/admin/content/banner-form";
import { PageHeader } from "@/components/admin/page-header";
import { getSeasonalBannerSettings } from "@/db/queries/settings";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.banner.title") };
}

export default async function BannerPage() {
  await requireOwner();
  const [t, banner] = await Promise.all([getT(), getSeasonalBannerSettings()]);
  return (
    <section className="space-y-6">
      <PageHeader title={t("admin.banner.title")} description={t("admin.banner.description")}>
        <p className="text-sm">
          <Link href="/admin/settings/theme" className="underline underline-offset-4">
            {t("admin.banner.themeLink")}
          </Link>
        </p>
      </PageHeader>
      <BannerForm defaultValues={banner} />
    </section>
  );
}
