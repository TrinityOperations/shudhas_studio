import type { Metadata } from "next";
import { TestimonialsManager } from "@/components/admin/content/testimonials-manager";
import { PageHeader } from "@/components/admin/page-header";
import { listAllTestimonials } from "@/db/queries/testimonials";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.testimonials.title") };
}

export default async function TestimonialsPage() {
  await requireOwner();
  const [t, testimonials] = await Promise.all([getT(), listAllTestimonials()]);
  return (
    <section className="space-y-6">
      <PageHeader
        title={t("admin.testimonials.title")}
        description={t("admin.testimonials.description")}
      />
      <TestimonialsManager testimonials={testimonials} />
    </section>
  );
}
