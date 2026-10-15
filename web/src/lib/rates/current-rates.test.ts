import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    bank: { findMany: vi.fn() },
    rateSnapshot: { groupBy: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

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
  prisma.rateSnapshot.groupBy.mockResolvedValue([{ bankId: "b1", termMonths: 12, _max: { scrapedAt: latestAt } }]);
  prisma.rateSnapshot.findMany.mockResolvedValue([
    { bankId: "b1", termMonths: 12, ratePct: 9.5, method: "SCRAPED", source: "https://abbl.com", scrapedAt: latestAt },
  ]);
});

describe("getCurrentFdrRates", () => {
  it("never loads a bank's whole snapshot history", async () => {
    await getCurrentFdrRates();
    expect(prisma.bank.findMany.mock.calls[0][0].include.rateSnapshots).toBeUndefined();
    const { where } = prisma.rateSnapshot.findMany.mock.calls[0][0];
    expect(where.OR).toEqual([{ bankId: "b1", termMonths: 12, scrapedAt: latestAt }]);
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
});
