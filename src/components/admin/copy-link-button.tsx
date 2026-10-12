"use client";
import { Link2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

/** Copies a public page's full URL (built from the browser's own origin, so no hostname lives here). */
export function CopyLinkButton({ path }: { path: string }) {
  const t = useT();
  async function copy() {
    const url = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("admin.empty.copied"));
    } catch {
      toast.error(t("admin.empty.copyFailed", { url }));
    }
  }
  return (
    <Button type="button" variant="outline" onClick={copy}>
      <Link2Icon aria-hidden />
      {t("admin.empty.copyLink")}
    </Button>
  );
}
