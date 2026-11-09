import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    bank: { findMany: vi.fn() },
    rateSnapshot: { groupBy: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { BB_DEPOSIT_CHART_URL } from "@/config/rate-monitoring";
import { getCurrentFdrRates } from "./current-rates";

const bank = {
  id: "b1",
  shortCode: "AB",
  name: "AB Bank PLC",
  type: "PRIVATE",
  creditRating: null,
  ratingAgency: null,
  ratingDate: null,
  statementUrl: null,
  scrapeLogs: [],
};
const latestAt = new Date("2026-10-14T02:30:00Z");

beforeEach(() => {
  vi.resetAllMocks();
  prisma.bank.findMany.mockResolvedValue([bank]);
  prisma.rateSnapshot.groupBy.mockResolvedValue([{ bankId: "b1", termMonths: 12, source: "https://abbl.com", _max: { scrapedAt: latestAt } }]);
  prisma.rateSnapshot.findMany.mockResolvedValue([
    { bankId: "b1", termMonths: 12, ratePct: 9.5, method: "SCRAPED", source: "https://abbl.com", scrapedAt: latestAt },
  ]);
});

describe("getCurrentFdrRates", () => {
  it("never loads a bank's whole snapshot history", async () => {
    await getCurrentFdrRates();
    expect(prisma.bank.findMany.mock.calls[0][0].include.rateSnapshots).toBeUndefined();
    const { where } = prisma.rateSnapshot.findMany.mock.calls[0][0];
    expect(where.OR).toEqual([{ bankId: "b1", termMonths: 12, source: "https://abbl.com", scrapedAt: latestAt }]);
  });

  it("returns one row per tracked term, with the latest rate or null", async () => {
    const rows = await getCurrentFdrRates();
    expect(rows.map((r) => [r.termMonths, r.ratePct])).toEqual([
      [3, null],
      [6, null],
      [12, 9.5],
    ]);
    expect(rows[2].asOf).toEqual(latestAt);
  });

  it("lets the chart outrank an older scraper's row dated after the chart's 1st-of-month", async () => {
    const chartAt = new Date("2026-09-01T12:00:00Z");
    prisma.rateSnapshot.groupBy.mockResolvedValue([
      { bankId: "b1", termMonths: 12, source: "https://abbl.com", _max: { scrapedAt: latestAt } },
      { bankId: "b1", termMonths: 12, source: BB_DEPOSIT_CHART_URL, _max: { scrapedAt: chartAt } },
    ]);
    await getCurrentFdrRates();
    expect(prisma.rateSnapshot.findMany.mock.calls[0][0].where.OR).toEqual([
      { bankId: "b1", termMonths: 12, source: BB_DEPOSIT_CHART_URL, scrapedAt: chartAt },
    ]);
  });

  it("takes the later row when a revised chart shares the date, and flags an overdue chart", async () => {
    const chartAt = new Date("2026-01-01T12:00:00Z");
    prisma.rateSnapshot.groupBy.mockResolvedValue([{ bankId: "b1", termMonths: 12, source: BB_DEPOSIT_CHART_URL, _max: { scrapedAt: chartAt } }]);
    prisma.rateSnapshot.findMany.mockResolvedValue([
      { id: "z", bankId: "b1", termMonths: 12, ratePct: 9, method: "SCRAPED", source: BB_DEPOSIT_CHART_URL, scrapedAt: chartAt },
      { id: "a", bankId: "b1", termMonths: 12, ratePct: 8, method: "SCRAPED", source: BB_DEPOSIT_CHART_URL, scrapedAt: chartAt },
    ]);
    const rows = await getCurrentFdrRates();
    expect(prisma.rateSnapshot.findMany.mock.calls[0][0].orderBy).toEqual({ id: "desc" });
    expect(rows[2].ratePct).toBe(9); // first of the id-desc result
    expect(rows[2].unverified).toBe(true); // January chart, long past 62 days
    expect(rows[2].chartOverdue).toBe(true);
  });
});
