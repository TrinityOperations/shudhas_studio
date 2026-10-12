import Link from "next/link";
import { cn } from "@/lib/utils";

/** The studio name in Eczar, as on the public site, linking to the dashboard home. */
export function AdminWordmark({
  studioName,
  title,
  className,
}: {
  studioName: string;
  title: string;
  className?: string;
}) {
  return (
    <Link
      href="/admin"
      title={title}
      className={cn(
        "font-heading text-ink focus-visible:ring-ring/50 inline-block rounded-md text-[22px] leading-none whitespace-nowrap focus-visible:ring-3 focus-visible:outline-none",
        className,
      )}
    >
      {studioName}
    </Link>
  );
}
