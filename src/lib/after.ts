import { after } from "next/server";

/**
 * Runs `fn` after the response is sent when a request scope exists, else right away. Next's
 * `after()` throws synchronously outside a request (a script, a cron job or a test calling the
 * booking engine directly), and those callers still need the work done, so they await it.
 */
export function runAfterResponse(fn: () => Promise<void>): Promise<void> {
  try {
    after(fn);
    return Promise.resolve();
  } catch {
    return fn();
  }
}
