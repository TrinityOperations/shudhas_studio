import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ after: vi.fn() }));
vi.mock("next/server", () => ({ after: mocks.after }));

import { runAfterResponse } from "./after";

// clearMocks in vitest.config resets the mock between tests; a mockReset here would also drop
// the implementation each test sets.

describe("runAfterResponse", () => {
  it("schedules the work with after() inside a request and returns without awaiting it", async () => {
    let finished = false;
    const fn = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      finished = true;
    });
    await runAfterResponse(fn);
    expect(mocks.after).toHaveBeenCalledWith(fn);
    expect(fn).not.toHaveBeenCalled();
    expect(finished).toBe(false);
  });

  it("awaits the work itself when after() throws (no request scope)", async () => {
    mocks.after.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope");
    });
    let finished = false;
    await runAfterResponse(async () => {
      await new Promise((r) => setTimeout(r, 10));
      finished = true;
    });
    expect(finished).toBe(true);
  });
});
