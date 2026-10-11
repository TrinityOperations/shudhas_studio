import "server-only";
import webpush, { WebPushError } from "web-push";
import { vapidDetails } from "./config";
import type { PushPayload } from "./payloads";
import { deleteSubscription, listSubscriptions } from "./store";

/** Push services keep an undelivered notification this long (seconds). */
const TTL_SECONDS = 3600;
/** Hard cap per push-service request so a slow service never holds the hook. */
const TIMEOUT_MS = 10_000;

let loggedOff = false;

function host(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "(invalid endpoint)";
  }
}

/**
 * OD-61: sends one notification to every device the owner subscribed. A no-op (logged once per
 * process) without VAPID keys. Dead subscriptions (404, 410) are removed; other failures are
 * logged with the endpoint's host only. Never throws: callers run inside the booking and
 * gallery hooks, where nothing may undo the customer's action.
 */
export async function sendPushToOwner(payload: PushPayload): Promise<void> {
  try {
    const vapid = vapidDetails();
    if (!vapid) {
      if (!loggedOff) {
        loggedOff = true;
        console.info("[push] off: VAPID keys are not set");
      }
      return;
    }
    const subscriptions = await listSubscriptions();
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subscriptions.map((row) =>
        webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
          { TTL: TTL_SECONDS, urgency: "high", timeout: TIMEOUT_MS, vapidDetails: vapid },
        ),
      ),
    );

    for (const [i, result] of results.entries()) {
      if (result.status === "fulfilled") continue;
      const endpoint = subscriptions[i].endpoint;
      const error = result.reason;
      if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
        try {
          await deleteSubscription(endpoint);
          console.info(`[push] removed a gone subscription at ${host(endpoint)}`);
        } catch (cleanupError) {
          console.error(
            `[push] could not remove a gone subscription at ${host(endpoint)}`,
            cleanupError,
          );
        }
        continue;
      }
      const status = error instanceof WebPushError ? ` (${error.statusCode})` : "";
      console.error(`[push] send failed for ${host(endpoint)}${status}`);
    }
  } catch (error) {
    console.error("[push] sendPushToOwner failed", error);
  }
}
