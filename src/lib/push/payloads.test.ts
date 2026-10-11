import { describe, expect, it } from "vitest";
import type { Booking, GallerySubmission } from "@/db/schema";
import { bookingCreated, gallerySubmitted, testPush } from "./payloads";

const booking = {
  id: "7b2d3f3a-0c1e-4f52-9a6b-5e1c2d3e4f50",
  startsAt: new Date("2026-12-10T03:30:00Z"), // 2:30 pm AEDT on Thursday 10 December
  customerName: "Priya Sharma",
  customerPhone: "61412345678",
  customerEmail: "priya@example.com",
  message: "A nameplate for my mother",
  brief: { occasion: "wedding", notes: "Gold lettering, Bangla script" },
} as unknown as Booking;

const submission = {
  id: "c4d5e6f7-1111-4222-8333-444455556666",
  firstName: "Priya",
  note: "The mug for my sister",
} as unknown as GallerySubmission;

function everyString(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(everyString);
  return [];
}

describe("push payloads carry no customer details", () => {
  it("bookingCreated: generic title, Melbourne time, id-only url", () => {
    const payload = bookingCreated(booking);
    expect(payload).toEqual({
      title: "New booking",
      body: "Thursday 10 Dec, 2:30 pm (Melbourne)",
      url: `/admin/bookings/${booking.id}`,
      tag: `booking-${booking.id}`,
    });
    const text = everyString(payload).join("\n");
    for (const secret of [
      "Priya",
      "Sharma",
      "61412345678",
      "0412",
      "priya@",
      "nameplate",
      "Gold",
      "Bangla",
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it("gallerySubmitted: generic title and body, pending tab, id in the tag only", () => {
    const payload = gallerySubmitted(submission);
    expect(payload).toEqual({
      title: "New customer photo",
      body: "Waiting for your review",
      url: "/admin/gallery?tab=pending",
      tag: `gallery-${submission.id}`,
    });
    const text = everyString(payload).join("\n");
    expect(text).not.toContain("Priya");
    expect(text).not.toContain("sister");
  });

  it("testPush opens the dashboard and tags every send differently", () => {
    expect(testPush().url).toBe("/admin");
    expect(testPush(1_000).tag).not.toBe(testPush(2_000).tag);
    expect(testPush(1_000).tag).toBe("test-1000");
  });
});
