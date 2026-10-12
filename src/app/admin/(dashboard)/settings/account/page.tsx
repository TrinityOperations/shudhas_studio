import type { Metadata } from "next";
import { AccountForm } from "@/components/admin/content/account-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.account.title") };
}

export default async function AccountPage() {
  const owner = await requireOwner();
  const t = await getT();
  return (
    <section className="space-y-6">
      <PageHeader title={t("admin.account.title")} description={t("admin.account.description")} />
      <AccountForm email={owner.email ?? ""} />
    </section>
  );
}
