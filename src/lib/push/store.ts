import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions, type PushSubscription } from "@/db/schema";

/** The owner's devices (OD-61). One owner, a handful of rows; no pagination needed. */
export async function listSubscriptions(): Promise<PushSubscription[]> {
  return db.select().from(pushSubscriptions);
}

export async function upsertSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values(input)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh: input.p256dh, auth: input.auth, userAgent: input.userAgent },
    });
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
