import type { Metadata } from "next";
import { AnnouncementForm } from "@/components/admin/content/announcement-form";
import { PageHeader } from "@/components/admin/page-header";
import { getAnnouncementSettings } from "@/db/queries/settings";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.announcement.title") };
}

export default async function AnnouncementPage() {
  await requireOwner();
  const [t, announcement] = await Promise.all([getT(), getAnnouncementSettings()]);
  return (
    <section className="space-y-6">
      <PageHeader
        title={t("admin.announcement.title")}
        description={t("admin.announcement.description")}
      />
      <AnnouncementForm defaultValues={announcement} />
    </section>
  );
}
