import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A chainable stand-in for `db.select()...`: every builder method returns the chain, `await`
 * resolves to `rows`, and the arguments to `where`, `orderBy` and `limit` are recorded.
 */
const mocks = vi.hoisted(() => {
  const calls: Record<string, unknown[]> = {};
  let rows: unknown[] = [];
  const chain: Record<string, unknown> = {};
  for (const name of ["from", "leftJoin", "where", "orderBy", "limit", "offset"]) {
    chain[name] = vi.fn((...args: unknown[]) => {
      calls[name] = args;
      return chain;
    });
  }
  chain.then = (resolve: (v: unknown) => void) => resolve(rows);
  return {
    calls,
    chain,
    setRows: (r: unknown[]) => {
      rows = r;
    },
    select: vi.fn(() => chain),
  };
});
vi.mock("@/db", () => ({ db: { select: mocks.select } }));
vi.mock("@/db/queries/availability", () => ({
  getAvailabilityContext: vi.fn(),
  getBookingSettings: vi.fn(),
}));

import { listTodayBookings, listUpcomingBookings } from "./bookings";

const row = {
  id: "b1",
  startsAt: new Date("2026-10-12T00:00:00Z"),
  status: "new" as const,
  consultationType: "video" as const,
  customerName: "Asha",
  customerEmail: "asha@example.com",
  customerPhone: "61400000000",
  brief: { orderFor: "business", businessName: "Acme" },
  productTitle: "Mug",
};

function whereSql(): string {
  const query = new PgDialect().sqlToQuery(mocks.calls.where[0] as SQL);
  return `${query.sql} ${JSON.stringify(query.params)}`;
}

beforeEach(() => {
  mocks.setRows([row]);
});

describe("listTodayBookings", () => {
  it("asks for non-cancelled bookings inside today's Melbourne day, soonest first", async () => {
    // 11 Oct 20:00 UTC = 12 Oct 07:00 AEDT; the day is 11 Oct 13:00 UTC → 12 Oct 13:00 UTC.
    const rows = await listTodayBookings(new Date("2026-10-11T20:00:00Z"));
    const sql = whereSql();
    expect(sql).toContain('"status" <> ');
    expect(sql).toContain("cancelled");
    expect(sql).toContain("2026-10-11T13:00:00.000Z");
    expect(sql).toContain("2026-10-12T13:00:00.000Z");
    expect(sql).toMatch(/"starts_at" >= .* and .*"starts_at" < /);
    const order = new PgDialect().sqlToQuery(mocks.calls.orderBy[0] as SQL).sql;
    expect(order).toMatch(/"starts_at" asc/);
    expect(mocks.calls.limit).toBeUndefined();
    expect(rows).toEqual([
      expect.objectContaining({
        id: "b1",
        startsAt: "2026-10-12T00:00:00.000Z",
        isBusiness: true,
        businessName: "Acme",
        productTitle: "Mug",
      }),
    ]);
  });
});

describe("listUpcomingBookings", () => {
  it("takes the next live bookings from the given instant, so the home page can skip today", async () => {
    const from = new Date("2026-10-12T13:00:00Z");
    await listUpcomingBookings(5, from);
    const sql = whereSql();
    expect(sql).toContain("2026-10-12T13:00:00.000Z");
    expect(sql).toMatch(/"starts_at" >= /);
    expect(sql).toContain("new");
    expect(sql).toContain("confirmed");
    expect(sql).not.toContain("cancelled");
    expect(mocks.calls.limit).toEqual([5]);
    const order = new PgDialect().sqlToQuery(mocks.calls.orderBy[0] as SQL).sql;
    expect(order).toMatch(/"starts_at" asc/);
  });
});
