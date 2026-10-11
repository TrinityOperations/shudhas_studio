import { describe, expect, it } from "vitest";
import { melbourneToday, resolveActiveTheme } from "./resolve";

const none = { manual: null, schedule: [] };

describe("resolveActiveTheme", () => {
  // 30 March 2026, 02:00 UTC = 13:00 AEDT in Melbourne.
  const now = new Date("2026-03-30T02:00:00Z");

  it("falls back to everyday when nothing is set", () => {
    expect(resolveActiveTheme(none, now)).toEqual({
      theme: expect.objectContaining({ id: "everyday" }),
      source: "default",
    });
  });

  it("uses the manual choice when no schedule entry covers today", () => {
    const result = resolveActiveTheme(
      { manual: "wedding", schedule: [{ themeId: "eid", start: "2026-04-01", end: "2026-04-03" }] },
      now,
    );
    expect(result.source).toBe("manual");
    expect(result.theme.id).toBe("wedding");
  });

  it("prefers a schedule entry covering today over the manual choice, inclusive of both ends", () => {
    const entry = { themeId: "eid" as const, start: "2026-03-20", end: "2026-03-30" };
    const result = resolveActiveTheme({ manual: "wedding", schedule: [entry] }, now);
    expect(result).toEqual({
      theme: expect.objectContaining({ id: "eid" }),
      source: "schedule",
      entry,
    });
    const startsToday = { themeId: "christmas" as const, start: "2026-03-30", end: "2026-04-05" };
    expect(resolveActiveTheme({ manual: null, schedule: [startsToday] }, now).theme.id).toBe(
      "christmas",
    );
  });

  it("lets the later start win when two entries overlap, and the later row on equal starts", () => {
    const long = { themeId: "wedding" as const, start: "2026-03-01", end: "2026-04-30" };
    const short = { themeId: "eid" as const, start: "2026-03-28", end: "2026-04-02" };
    expect(resolveActiveTheme({ manual: null, schedule: [long, short] }, now).theme.id).toBe("eid");
    expect(resolveActiveTheme({ manual: null, schedule: [short, long] }, now).theme.id).toBe("eid");
    const sameStart = { ...long, start: "2026-03-28", themeId: "valentines" as const };
    expect(resolveActiveTheme({ manual: null, schedule: [short, sameStart] }, now).theme.id).toBe(
      "valentines",
    );
  });

  it("works on Melbourne civil dates, not UTC: a UTC evening is already tomorrow in Melbourne", () => {
    // 29 March 2026, 13:30 UTC is 00:30 on 30 March in Melbourne (AEDT, UTC+11).
    const lateUtc = new Date("2026-03-29T13:30:00Z");
    expect(melbourneToday(lateUtc)).toBe("2026-03-30");
    const endsYesterday = { themeId: "eid" as const, start: "2026-03-20", end: "2026-03-29" };
    expect(resolveActiveTheme({ manual: null, schedule: [endsYesterday] }, lateUtc).source).toBe(
      "default",
    );
    const startsToday = { themeId: "eid" as const, start: "2026-03-30", end: "2026-04-01" };
    expect(resolveActiveTheme({ manual: null, schedule: [startsToday] }, lateUtc).theme.id).toBe(
      "eid",
    );
  });

  it("falls back to everyday for a manual id that no longer exists", () => {
    const stale = { manual: "halloween" as never, schedule: [] };
    expect(resolveActiveTheme(stale, now).theme.id).toBe("everyday");
  });
});
