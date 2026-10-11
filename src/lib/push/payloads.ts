import type { Booking, GallerySubmission } from "@/db/schema";
import { formatMelbourne } from "@/lib/time";

/**
 * What a notification carries (OD-61). Never a customer detail: no name, phone, email, note or
 * brief. Title and body are generic plus a Melbourne time or a count, and the URL holds only an
 * id. The text is English-only and mirrors the owner emails (src/lib/booking/emails.ts,
 * src/lib/gallery/emails.ts); a later Bengali round changes both in one go.
 */
export type PushPayload = {
  title: string;
  body: string;
  /** Same-origin path the notification opens. */
  url: string;
  /** Notifications with the same tag replace each other on the device. */
  tag: string;
};

export function bookingCreated(booking: Pick<Booking, "id" | "startsAt">): PushPayload {
  return {
    title: "New booking",
    body: `${formatMelbourne(booking.startsAt, "EEEE d MMM, h:mm aaa")} (Melbourne)`,
    url: `/admin/bookings/${booking.id}`,
    tag: `booking-${booking.id}`,
  };
}

export function gallerySubmitted(submission: Pick<GallerySubmission, "id">): PushPayload {
  return {
    title: "New customer photo",
    body: "Waiting for your review",
    url: "/admin/gallery?tab=pending",
    tag: `gallery-${submission.id}`,
  };
}

/** Each test gets its own tag so repeated taps show repeated notifications. */
export function testPush(now: number = Date.now()): PushPayload {
  return {
    title: "Shudha's Studio",
    body: "Notifications are on for this device.",
    url: "/admin",
    tag: `test-${now}`,
  };
}
