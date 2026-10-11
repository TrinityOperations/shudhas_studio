"use server";

import { headers } from "next/headers";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { requireOwner } from "@/lib/auth";
import { testPush } from "@/lib/push/payloads";
import { sendPushToOwner } from "@/lib/push/send";
import { deleteSubscription, upsertSubscription } from "@/lib/push/store";
import { pushEndpointSchema, pushSubscriptionSchema } from "@/lib/validators/push";

/** OD-61: the owner tapped "Turn on notifications" on this device. */
export async function savePushSubscription(input: unknown): Promise<ActionResult> {
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return fail("errors.invalidInput");
  await requireOwner();
  const userAgent = (await headers()).get("user-agent");
  await upsertSubscription({
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    userAgent: userAgent ? userAgent.slice(0, 500) : null,
  });
  return ok();
}

/** "Turn off": the browser has already unsubscribed; forget the endpoint. */
export async function removePushSubscription(input: unknown): Promise<ActionResult> {
  const parsed = pushEndpointSchema.safeParse(input);
  if (!parsed.success) return fail("errors.invalidInput");
  await requireOwner();
  await deleteSubscription(parsed.data);
  return ok();
}

/** "Send a test": a generic notification to every subscribed device, so she can see it land. */
export async function sendTestPush(): Promise<ActionResult> {
  await requireOwner();
  await sendPushToOwner(testPush());
  return ok();
}
