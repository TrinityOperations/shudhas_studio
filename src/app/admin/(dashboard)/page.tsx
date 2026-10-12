import type { Metadata } from "next";
import Link from "next/link";
import { CalendarOffIcon, ImagesIcon, PackageIcon, PenLineIcon } from "lucide-react";
import { StatusBadge } from "@/components/admin/bookings/status-badge";
import { NotificationsCard } from "@/components/admin/push/notifications-card";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  countNewBookings,
  listTodayBookings,
  listUpcomingBookings,
  type AdminBookingRow,
} from "@/db/queries/bookings";
import { countPendingGallery } from "@/db/queries/gallery";
import { requireOwner } from "@/lib/auth";
import { getT, type T } from "@/lib/i18n";
import { vapidDetails } from "@/lib/push/config";
import { formatMelbourne, melbourneDayRange } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.dashboard.title") };
}

function Card({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${id}-heading`} className="font-heading text-xl font-medium">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BookingRows({ rows, t, pattern }: { rows: AdminBookingRow[]; t: T; pattern: string }) {
  return (
    <ul className="divide-y">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <Link href={`/admin/bookings/${row.id}`} className="underline-offset-4 hover:underline">
            <span className="font-medium">{formatMelbourne(row.startsAt, pattern)}</span>
            {" · "}
            {row.customerName}
          </Link>
          <StatusBadge status={row.status} t={t} />
        </li>
      ))}
    </ul>
  );
}

/** Dashboard home (OD-60 design pass): today, what is waiting, what is next, quick actions. */
export default async function AdminHomePage() {
  await requireOwner();
  const now = new Date();
  const { end: endOfToday } = melbourneDayRange(now);
  const [t, today, newCount, upcoming, pendingPhotos] = await Promise.all([
    getT(),
    listTodayBookings(now),
    countNewBookings(),
    listUpcomingBookings(5, endOfToday),
    countPendingGallery(),
  ]);
  const vapid = vapidDetails();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.dashboard.title")}
        description={formatMelbourne(now, "EEEE d MMMM yyyy")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card id="today" title={t("admin.home.today")}>
          {today.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("admin.home.todayEmpty")}</p>
          ) : (
            <BookingRows rows={today} t={t} pattern="h:mm aaa" />
          )}
        </Card>

        <Card
          id="waiting"
          title={t("admin.home.waiting")}
          action={
            <Link
              href="/admin/bookings?status=new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("admin.home.waitingLink")}
            </Link>
          }
        >
          <p className="flex items-baseline gap-3">
            <span
              className="font-heading text-4xl leading-none font-medium"
              data-testid="waiting-count"
            >
              {newCount}
            </span>
            <span className="text-muted-foreground text-sm">
              {newCount === 1 ? t("admin.home.waitingOne") : t("admin.home.waitingMany")}
            </span>
          </p>
        </Card>
      </div>

      <Card
        id="upcoming"
        title={t("admin.home.upcoming")}
        action={
          <Link
            href="/admin/bookings"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("admin.bookings.dashboard.all")}
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("admin.bookings.dashboard.none")}</p>
        ) : (
          <BookingRows rows={upcoming} t={t} pattern="EEE d MMM, h:mm aaa" />
        )}
      </Card>

      {pendingPhotos > 0 ? (
        <Card
          id="photos"
          title={t("admin.home.photos")}
          action={
            <Link
              href="/admin/gallery?tab=pending"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("admin.home.photosLink")}
            </Link>
          }
        >
          <p className="flex items-center gap-2 text-sm" data-testid="photos-to-review">
            <ImagesIcon className="text-mark size-4" aria-hidden />
            {pendingPhotos === 1
              ? t("admin.gallery.badgeOne")
              : t("admin.gallery.badge", { count: pendingPhotos })}
          </p>
        </Card>
      ) : null}

      <Card id="actions" title={t("admin.home.quickActions")}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            href="/admin/products/new"
            className={buttonVariants({ variant: "outline", className: "justify-start" })}
          >
            <PackageIcon aria-hidden />
            {t("admin.products.new")}
          </Link>
          <Link
            href="/admin/availability"
            className={buttonVariants({ variant: "outline", className: "justify-start" })}
          >
            <CalendarOffIcon aria-hidden />
            {t("admin.home.blockDate")}
          </Link>
          <Link
            href="/admin/home-editor"
            prefetch={false}
            className={buttonVariants({ variant: "outline", className: "justify-start" })}
          >
            <PenLineIcon aria-hidden />
            {t("admin.editor.entry")}
          </Link>
        </div>
      </Card>

      {vapid ? <NotificationsCard publicKey={vapid.publicKey} /> : null}
    </div>
  );
}
