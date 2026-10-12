import type { Metadata } from "next";
import { FaqsManager } from "@/components/admin/content/faqs-manager";
import { PageHeader } from "@/components/admin/page-header";
import { listAllFaqs } from "@/db/queries/faqs";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.faqs.title") };
}

export default async function FaqsPage() {
  await requireOwner();
  const [t, faqs] = await Promise.all([getT(), listAllFaqs()]);
  return (
    <section className="space-y-6">
      <PageHeader title={t("admin.faqs.title")} description={t("admin.faqs.description")} />
      <FaqsManager faqs={faqs} />
    </section>
  );
}
