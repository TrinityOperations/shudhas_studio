import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  /** Primary action: right of the title on desktop, under it on phones */
  action?: ReactNode;
  /** Extra lines under the description (a live status, a link) */
  children?: ReactNode;
  className?: string;
};

/** The one page header every dashboard screen uses: Eczar title, quiet description, one action. */
export function PageHeader({ title, description, action, children, className }: Props) {
  return (
    <header
      className={cn("flex flex-col gap-3 md:flex-row md:items-start md:justify-between", className)}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-ink text-[28px] leading-tight font-medium tracking-[-0.01em] md:text-[32px]">
          {title}
        </h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        {children}
      </div>
      {action ? <div className="flex flex-wrap gap-2 md:shrink-0 md:pt-1">{action}</div> : null}
    </header>
  );
}
