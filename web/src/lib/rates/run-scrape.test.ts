import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, revalidatePath, reviewScrapedRates } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  reviewScrapedRates: vi.fn(),
  prisma: {
    bank: { upsert: vi.fn(), findMany: vi.fn() },
    scrapeLog: { create: vi.fn() },
    rateSnapshot: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("./rate-guard", () => ({ reviewScrapedRates }));

import { runScrape } from "./run-scrape";
import { SEED_AS_OF } from "./seed-rates";
import { RATE_ADAPTERS } from "./adapters/registry";

beforeEach(() => {
  vi.resetAllMocks();
  prisma.bank.findMany.mockResolvedValue([{ id: "b1", shortCode: "MIDLAND" }]);
  prisma.rateSnapshot.create.mockImplementation((args) => args);
  prisma.$transaction.mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

describe("runScrape", () => {
  it("dates a manual-seed rate by its source, not by today's run", async () => {
    await runScrape();
    const writes = prisma.rateSnapshot.create.mock.calls.map(([args]) => args.data);
    expect(writes.length).toBeGreaterThan(0);
    for (const data of writes) {
      expect(data.method).toBe("MANUAL");
      expect(data.scrapedAt).toBeInstanceOf(Date);
      expect(data.scrapedAt).toEqual(SEED_AS_OF);
    }
  });

  it("stores a dated seed figure once, not again on every run", async () => {
    await runScrape();
    const first = prisma.rateSnapshot.create.mock.calls.map(([args]) => args.data);
    prisma.rateSnapshot.create.mockClear();
    prisma.rateSnapshot.findFirst.mockImplementation(async ({ where }) => first.find((d) => d.termMonths === where.termMonths) ?? null);
    await runScrape();
    expect(prisma.rateSnapshot.create).not.toHaveBeenCalled();
    expect(prisma.scrapeLog.create).toHaveBeenCalledWith({
      data: { bankId: "b1", success: true, ratesFound: 3 },
    });
  });

  it("stores a scrape the Jev guard flags (shadow mode) and records its note for the digest", async () => {
    reviewScrapedRates.mockResolvedValue("FDR 12mo 9%: classed loan_lending");
    await runScrape();
    expect(prisma.rateSnapshot.create).toHaveBeenCalled();
    expect(prisma.scrapeLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ success: true, reviewNote: "FDR 12mo 9%: classed loan_lending" }),
    });
  });

  it("re-renders every page after a successful run, so the nav can show /rates", async () => {
    await runScrape();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("refuses a parse with an implausible rate and logs the bank as failed", async () => {
    // A wrong-column parse: a 365-day term read as the rate.
    vi.spyOn(RATE_ADAPTERS, "get").mockReturnValue({
      bankShortCode: "MIDLAND",
      scrape: async () => [
        { instrument: "FDR", termMonths: 12, ratePct: 365, method: "SCRAPED", source: "test" },
      ],
    });
    await runScrape();
    expect(prisma.rateSnapshot.create).not.toHaveBeenCalled();
    expect(prisma.scrapeLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ bankId: "b1", success: false }),
    });
  });

  it("stores a range's upper end, and refuses a range whose upper end is implausible", async () => {
    const asOf = new Date("2026-09-01T12:00:00Z");
    const spy = vi.spyOn(RATE_ADAPTERS, "get").mockReturnValue({
      bankShortCode: "MIDLAND",
      scrape: async () => [{ instrument: "FDR", termMonths: 12, ratePct: 8.5, ratePctMax: 8.9, method: "SCRAPED", source: "bb", asOf }],
    });
    await runScrape();
    expect(prisma.rateSnapshot.create.mock.calls.map(([args]) => args.data)).toEqual([
      expect.objectContaining({ ratePct: 8.5, ratePctMax: 8.9, scrapedAt: asOf }),
    ]);
    expect(prisma.rateSnapshot.findFirst).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { id: "desc" } }));
    // a revised chart reuses the date: a changed figure at the same date is stored again
    prisma.rateSnapshot.create.mockClear();
    prisma.rateSnapshot.findFirst.mockResolvedValue({ ratePct: 8.5, ratePctMax: 8.7 });
    await runScrape();
    expect(prisma.rateSnapshot.create).toHaveBeenCalledTimes(1);

    vi.resetAllMocks();
    prisma.bank.findMany.mockResolvedValue([{ id: "b1", shortCode: "MIDLAND" }]);
    spy.mockReturnValue({
      bankShortCode: "MIDLAND",
      scrape: async () => [{ instrument: "FDR", termMonths: 12, ratePct: 8.5, ratePctMax: 85, method: "SCRAPED", source: "bb", asOf }],
    });
    await runScrape();
    expect(prisma.rateSnapshot.create).not.toHaveBeenCalled();
    expect(prisma.scrapeLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ success: false, errorMessage: expect.stringContaining("8.5%-85%") }),
    });
  });
});
