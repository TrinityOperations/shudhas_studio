import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendBookingEmail: vi.fn(), sendPushToOwner: vi.fn() }));
vi.mock("./emails", () => ({ sendBookingEmail: mocks.sendBookingEmail }));
vi.mock("@/lib/push/send", () => ({ sendPushToOwner: mocks.sendPushToOwner }));

import type { Booking } from "@/db/schema";
import { onBookingCreated } from "./hooks";

const booking = {
  id: "b1",
  customerEmail: "a@example.com",
  startsAt: new Date("2026-12-10T03:30:00Z"),
} as unknown as Booking;

beforeEach(() => {
  mocks.sendBookingEmail.mockReset().mockResolvedValue({ ok: true });
  mocks.sendPushToOwner.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("onBookingCreated", () => {
  it("sends the customer 'received' email and the owner notification", async () => {
    await onBookingCreated(booking);
    expect(mocks.sendBookingEmail).toHaveBeenCalledWith("received", booking);
    expect(mocks.sendBookingEmail).toHaveBeenCalledWith("owner-new", booking);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("pushes to the owner's devices with an id-only payload (OD-61)", async () => {
    await onBookingCreated(booking);
    expect(mocks.sendPushToOwner).toHaveBeenCalledWith({
      title: "New booking",
      body: "Thursday 10 Dec, 2:30 pm (Melbourne)",
      url: "/admin/bookings/b1",
      tag: "booking-b1",
    });
  });

  it("still sends both emails and resolves when the push rejects", async () => {
    mocks.sendPushToOwner.mockRejectedValue(new Error("push service down"));
    await expect(onBookingCreated(booking)).resolves.toBeUndefined();
    expect(mocks.sendBookingEmail).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("logs a failed send and swallows a throw", async () => {
    mocks.sendBookingEmail
      .mockResolvedValueOnce({ ok: false, error: "boom" })
      .mockResolvedValueOnce({ ok: true });
    await expect(onBookingCreated(booking)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledTimes(1);
    mocks.sendBookingEmail.mockRejectedValue(new Error("network"));
    await expect(onBookingCreated(booking)).resolves.toBeUndefined();
  });
});
