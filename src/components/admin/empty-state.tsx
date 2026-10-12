import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  /** One line on what to do next */
  hint?: string;
  action?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/** The one empty state every dashboard list uses (OD-60 design pass): icon, title, hint, action. */
export function EmptyState({ icon: Icon, title, hint, action, className, ...rest }: Props) {
  return (
    <Empty className={cn("border", className)} data-testid={rest["data-testid"]}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-lg font-medium">{title}</EmptyTitle>
        {hint ? <EmptyDescription>{hint}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
