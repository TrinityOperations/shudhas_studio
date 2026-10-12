import Link from "next/link";
import { CalendarDaysIcon } from "lucide-react";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminBookingPage, AdminBookingRow } from "@/db/queries/bookings";
import { getT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/t";
import { formatMelbourne } from "@/lib/time";
import { adminBookingsHref, type AdminBookingListParams } from "./list-params";
import { StatusBadge } from "./status-badge";

/**
 * What an empty tab says: a fresh studio gets the booking link to share; a filtered or past
 * tab just says so.
 */
export async function BookingsEmpty({ params }: { params: AdminBookingListParams }) {
  const t = await getT();
  const filtered = Boolean(params.q || params.status);
  if (filtered) {
    return (
      <EmptyState
        icon={CalendarDaysIcon}
        title={t("admin.bookings.empty")}
        hint={t("admin.empty.bookingsFiltered")}
        data-testid="bookings-empty"
      />
    );
  }
  if (params.tab === "upcoming") {
    return (
      <EmptyState
        icon={CalendarDaysIcon}
        title={t("admin.empty.bookingsTitle")}
        hint={t("admin.empty.bookingsHint")}
        action={<CopyLinkButton path="/book" />}
        data-testid="bookings-empty"
      />
    );
  }
  return (
    <EmptyState
      icon={CalendarDaysIcon}
      title={t("admin.bookings.empty")}
      hint={t(`admin.empty.bookings.${params.tab}`)}
      data-testid="bookings-empty"
    />
  );
}

/** Name with the business marker (decision: corporate enquiries stand out before opening). */
export async function CustomerCell({ row }: { row: AdminBookingRow }) {
  const t = await getT();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/bookings/${row.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {row.customerName}
      </Link>
      {row.isBusiness ? (
        <Badge variant="outline" title={row.businessName ?? undefined}>
          {t("admin.bookings.brief.business")}
        </Badge>
      ) : null}
    </span>
  );
}

export async function BookingRows({ rows }: { rows: AdminBookingRow[] }) {
  const t = await getT();
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.bookings.col.when")}</TableHead>
            <TableHead>{t("admin.bookings.col.customer")}</TableHead>
            <TableHead>{t("admin.bookings.col.type")}</TableHead>
            <TableHead>{t("admin.bookings.col.product")}</TableHead>
            <TableHead>{t("admin.bookings.col.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">
                <Link
                  href={`/admin/bookings/${row.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {formatMelbourne(row.startsAt, "EEE d MMM, h:mm aaa")}
                </Link>
              </TableCell>
              <TableCell>
                <CustomerCell row={row} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {t(`booking.type.${row.consultationType}` as MessageKey)}
              </TableCell>
              <TableCell>
                {row.productTitle ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} t={t} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export async function BookingList({
  page,
  params,
}: {
  page: AdminBookingPage;
  params: AdminBookingListParams;
}) {
  const t = await getT();
  return (
    <div className="space-y-4">
      {page.items.length === 0 ? (
        <BookingsEmpty params={params} />
      ) : (
        <BookingRows rows={page.items} />
      )}
      {page.pageCount > 1 ? (
        <nav
          aria-label={t("catalogue.pagination.label")}
          className="flex items-center justify-between"
        >
          {page.page > 1 ? (
            <Link
              href={adminBookingsHref(params, { page: page.page - 1 })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("catalogue.pagination.previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground text-sm">
            {t("admin.bookings.pagination.page", { page: page.page, total: page.pageCount })}
          </span>
          {page.page < page.pageCount ? (
            <Link
              href={adminBookingsHref(params, { page: page.page + 1 })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("catalogue.pagination.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
