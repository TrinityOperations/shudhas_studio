import type { Booking } from "@/db/schema";
import { bookingCreated } from "@/lib/push/payloads";
import { sendPushToOwner } from "@/lib/push/send";
import { sendBookingEmail } from "./emails";

/**
 * PW-34, PW-35, OD-61: after a public booking is committed, email the customer (in their
 * language) and the owner, and push to the owner's devices. Runs after the response
 * (src/lib/after.ts). createBookingCore already guards this call, and nothing here throws
 * either: a mail or push problem is logged and can never undo a booking.
 */
export async function onBookingCreated(booking: Booking): Promise<void> {
  try {
    const [customer, owner] = await Promise.all([
      sendBookingEmail("received", booking),
      sendBookingEmail("owner-new", booking),
      sendPushToOwner(bookingCreated(booking)),
    ]);
    if (!customer.ok)
      console.error(`[booking] customer email failed for ${booking.id}: ${customer.error}`);
    if (!owner.ok) console.error(`[booking] owner email failed for ${booking.id}: ${owner.error}`);
  } catch (error) {
    console.error(`[booking] onBookingCreated failed for ${booking.id}`, error);
  }
}
