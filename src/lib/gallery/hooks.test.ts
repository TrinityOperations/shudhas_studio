import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendGallerySubmittedEmail: vi.fn(), sendPushToOwner: vi.fn() }));
vi.mock("./emails", () => ({ sendGallerySubmittedEmail: mocks.sendGallerySubmittedEmail }));
vi.mock("@/lib/push/send", () => ({ sendPushToOwner: mocks.sendPushToOwner }));

import type { GallerySubmission } from "@/db/schema";
import { onGallerySubmitted } from "./hooks";

const submission = { id: "g1", firstName: "Priya", note: "Mug" } as unknown as GallerySubmission;

beforeEach(() => {
  mocks.sendGallerySubmittedEmail.mockReset().mockResolvedValue({ ok: true });
  mocks.sendPushToOwner.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("onGallerySubmitted", () => {
  it("emails the owner and pushes a generic notification (PW-72, OD-61)", async () => {
    await onGallerySubmitted(submission);
    expect(mocks.sendGallerySubmittedEmail).toHaveBeenCalledWith(submission);
    expect(mocks.sendPushToOwner).toHaveBeenCalledWith({
      title: "New customer photo",
      body: "Waiting for your review",
      url: "/admin/gallery?tab=pending",
      tag: "gallery-g1",
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs a failed email, and resolves when the push rejects", async () => {
    mocks.sendGallerySubmittedEmail.mockResolvedValue({ ok: false, error: "boom" });
    await expect(onGallerySubmitted(submission)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledTimes(1);
    mocks.sendPushToOwner.mockRejectedValue(new Error("push service down"));
    await expect(onGallerySubmitted(submission)).resolves.toBeUndefined();
  });
});
