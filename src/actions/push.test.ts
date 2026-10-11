import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  headers: vi.fn(),
  upsertSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
  sendPushToOwner: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireOwner: mocks.requireOwner }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/push/store", () => ({
  upsertSubscription: mocks.upsertSubscription,
  deleteSubscription: mocks.deleteSubscription,
}));
vi.mock("@/lib/push/send", () => ({ sendPushToOwner: mocks.sendPushToOwner }));

import { removePushSubscription, savePushSubscription, sendTestPush } from "./push";

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BNcR", auth: "tBHI" },
};

beforeEach(() => {
  mocks.requireOwner.mockResolvedValue({ id: "owner", email: "owner@example.com" });
  mocks.headers.mockResolvedValue(new Headers({ "user-agent": "Mozilla/5.0 (iPhone)" }));
  mocks.upsertSubscription.mockResolvedValue(undefined);
  mocks.deleteSubscription.mockResolvedValue(undefined);
  mocks.sendPushToOwner.mockResolvedValue(undefined);
});

describe("push subscription actions", () => {
  it("savePushSubscription rejects a non-https endpoint before auth or the store", async () => {
    const result = await savePushSubscription({ ...subscription, endpoint: "http://evil.test/x" });
    expect(result).toMatchObject({ ok: false, error: "errors.invalidInput" });
    expect(mocks.requireOwner).not.toHaveBeenCalled();
    expect(mocks.upsertSubscription).not.toHaveBeenCalled();
    expect(await savePushSubscription({ endpoint: subscription.endpoint })).toMatchObject({
      ok: false,
    });
  });

  it("savePushSubscription requires the owner", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(savePushSubscription(subscription)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.upsertSubscription).not.toHaveBeenCalled();
  });

  it("savePushSubscription upserts the endpoint, keys and user agent", async () => {
    expect(await savePushSubscription(subscription)).toEqual({ ok: true, data: undefined });
    expect(mocks.upsertSubscription).toHaveBeenCalledWith({
      endpoint: subscription.endpoint,
      p256dh: "BNcR",
      auth: "tBHI",
      userAgent: "Mozilla/5.0 (iPhone)",
    });
  });

  it("removePushSubscription deletes by endpoint after the owner check", async () => {
    expect(await removePushSubscription("nope")).toMatchObject({ ok: false });
    expect(mocks.deleteSubscription).not.toHaveBeenCalled();
    expect(await removePushSubscription(subscription.endpoint)).toEqual({
      ok: true,
      data: undefined,
    });
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1);
    expect(mocks.deleteSubscription).toHaveBeenCalledWith(subscription.endpoint);
  });

  it("sendTestPush requires the owner and sends the generic test payload", async () => {
    mocks.requireOwner.mockRejectedValueOnce(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(sendTestPush()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.sendPushToOwner).not.toHaveBeenCalled();
    expect(await sendTestPush()).toEqual({ ok: true, data: undefined });
    expect(mocks.sendPushToOwner).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/admin", tag: expect.stringMatching(/^test-\d+$/) }),
    );
  });
});
