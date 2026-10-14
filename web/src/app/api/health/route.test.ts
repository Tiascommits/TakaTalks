import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    bank: { count: vi.fn() },
    rateSnapshot: { aggregate: vi.fn() },
    annualReportCheckLog: { aggregate: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { GET } from "./route";

const NOW = new Date("2026-10-15T12:00:00Z");

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe("GET /api/health", () => {
  it("reports the FDR bank count and the age of the newest scrape and bank-health check", async () => {
    prisma.bank.count.mockResolvedValue(4);
    prisma.rateSnapshot.aggregate.mockResolvedValue({ _max: { scrapedAt: new Date("2026-10-15T10:30:00Z") } });
    prisma.annualReportCheckLog.aggregate.mockResolvedValue({ _max: { checkedAt: new Date("2026-10-13T12:00:00Z") } });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      dbReachable: true,
      banksWithFdrRates: 4,
      rateSnapshotAgeHours: 1.5,
      bankHealthCheckAgeHours: 48,
    });
    // Counts only active banks with a tracked FDR term, the same set /rates shows.
    expect(prisma.bank.count).toHaveBeenCalledWith({
      where: { active: true, rateSnapshots: { some: { instrument: "FDR", termMonths: { in: [3, 6, 12] } } } },
    });
  });

  it("reports null ages before any scrape or check has run", async () => {
    prisma.bank.count.mockResolvedValue(0);
    prisma.rateSnapshot.aggregate.mockResolvedValue({ _max: { scrapedAt: null } });
    prisma.annualReportCheckLog.aggregate.mockResolvedValue({ _max: { checkedAt: null } });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      dbReachable: true,
      banksWithFdrRates: 0,
      rateSnapshotAgeHours: null,
      bankHealthCheckAgeHours: null,
    });
  });

  it("returns 503 without the error text when the database is unreachable", async () => {
    const secretish = "Can't reach database server at `db.internal:5432` password=hunter2";
    prisma.bank.count.mockRejectedValue(new Error(secretish));
    prisma.rateSnapshot.aggregate.mockResolvedValue({ _max: { scrapedAt: null } });
    prisma.annualReportCheckLog.aggregate.mockResolvedValue({ _max: { checkedAt: null } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET();
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(JSON.parse(text)).toEqual({ dbReachable: false });
    expect(text).not.toContain("db.internal");
    expect(log).toHaveBeenCalled();
  });
});
