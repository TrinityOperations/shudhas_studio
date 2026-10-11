import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  listSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}));

vi.mock("web-push", () => {
  class WebPushError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      public headers: Record<string, string>,
      public body: string,
      public endpoint: string,
    ) {
      super(message);
    }
  }
  return { default: { sendNotification: mocks.sendNotification }, WebPushError };
});
vi.mock("./store", () => ({
  listSubscriptions: mocks.listSubscriptions,
  deleteSubscription: mocks.deleteSubscription,
}));

import { WebPushError } from "web-push";
import { sendPushToOwner } from "./send";

const payload = { title: "New booking", body: "Thu", url: "/admin/bookings/1", tag: "booking-1" };
const row = (n: number) => ({
  id: `id-${n}`,
  endpoint: `https://push.example.net/sub/${n}`,
  p256dh: `p-${n}`,
  auth: `a-${n}`,
  userAgent: null,
  createdAt: new Date(),
});

function configure(on: boolean) {
  if (on) {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BPub";
    process.env.VAPID_PRIVATE_KEY = "priv";
    process.env.VAPID_SUBJECT = "mailto:owner@example.com";
  } else {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
  }
}

beforeEach(() => {
  configure(true);
  mocks.sendNotification.mockReset().mockResolvedValue({ statusCode: 201 });
  mocks.listSubscriptions.mockReset().mockResolvedValue([row(1), row(2), row(3)]);
  mocks.deleteSubscription.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("sendPushToOwner", () => {
  it("does nothing without VAPID keys, not even a subscription lookup", async () => {
    configure(false);
    await sendPushToOwner(payload);
    expect(mocks.listSubscriptions).not.toHaveBeenCalled();
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it("sends to every subscription with TTL 3600, high urgency and the VAPID details", async () => {
    await sendPushToOwner(payload);
    expect(mocks.sendNotification).toHaveBeenCalledTimes(3);
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      { endpoint: row(2).endpoint, keys: { p256dh: "p-2", auth: "a-2" } },
      JSON.stringify(payload),
      expect.objectContaining({
        TTL: 3600,
        urgency: "high",
        timeout: 10_000,
        vapidDetails: {
          subject: "mailto:owner@example.com",
          publicKey: "BPub",
          privateKey: "priv",
        },
      }),
    );
    expect(mocks.deleteSubscription).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("removes a subscription the push service reports gone (410) and keeps the others", async () => {
    mocks.sendNotification.mockImplementation(async (sub: { endpoint: string }) => {
      if (sub.endpoint === row(2).endpoint) {
        throw new WebPushError("gone", 410, {}, "", sub.endpoint);
      }
      return { statusCode: 201 };
    });
    await sendPushToOwner(payload);
    expect(mocks.deleteSubscription).toHaveBeenCalledTimes(1);
    expect(mocks.deleteSubscription).toHaveBeenCalledWith(row(2).endpoint);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("keeps the row and logs only the host on another failure (500)", async () => {
    mocks.sendNotification.mockRejectedValueOnce(
      new WebPushError("server error", 500, {}, "secret body", row(1).endpoint),
    );
    await sendPushToOwner(payload);
    expect(mocks.deleteSubscription).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    const logged = String(
      (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0],
    );
    expect(logged).toContain("push.example.net");
    expect(logged).not.toContain("/sub/1");
    expect(logged).not.toContain("secret body");
  });

  it("never rejects, even when the store throws", async () => {
    mocks.listSubscriptions.mockRejectedValue(new Error("db down"));
    await expect(sendPushToOwner(payload)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
