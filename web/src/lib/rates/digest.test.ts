import { describe, expect, it } from "vitest";
import { BB_DEPOSIT_CHART_URL } from "@/config/rate-monitoring";
import { computeDigest, type DigestBankInput } from "./digest";

const day = (n: number) => new Date(2026, 0, n);

function bank(overrides: Partial<DigestBankInput>): DigestBankInput {
  return {
    shortCode: "X",
    name: "Bank X",
    hasAdapter: true,
    logs: [],
    snapshots: [],
    ...overrides,
  };
}

describe("computeDigest", () => {
  it("flags a bank whose most recent scrape attempt failed", () => {
    const result = computeDigest([
      bank({
        logs: [{ success: false, attemptedAt: day(2), errorMessage: "selector not found" }],
      }),
    ]);
    expect(result.failedAdapters).toHaveLength(1);
    expect(result.failedAdapters[0].errorMessage).toBe("selector not found");
  });

  it("does not flag a bank whose most recent attempt succeeded", () => {
    const result = computeDigest([bank({ logs: [{ success: true, attemptedAt: day(2), errorMessage: null }] })]);
    expect(result.failedAdapters).toHaveLength(0);
  });

  it("routes banks with no adapter to unconfiguredBanks instead of failedAdapters", () => {
    const result = computeDigest([bank({ hasAdapter: false })]);
    expect(result.unconfiguredBanks).toHaveLength(1);
    expect(result.failedAdapters).toHaveLength(0);
  });

  it("flags a rate move at or above the significant-change threshold", () => {
    const result = computeDigest([
      bank({
        snapshots: [
          { instrument: "FDR", termMonths: 12, ratePct: 10.5, scrapedAt: day(3) },
          { instrument: "FDR", termMonths: 12, ratePct: 10.0, scrapedAt: day(2) },
        ],
      }),
    ]);
    expect(result.changedRates).toHaveLength(1);
    expect(result.changedRates[0].deltaPct).toBeCloseTo(0.5, 6);
  });

  it("ignores a rate move below the significant-change threshold", () => {
    const result = computeDigest([
      bank({
        snapshots: [
          { instrument: "FDR", termMonths: 12, ratePct: 10.1, scrapedAt: day(3) },
          { instrument: "FDR", termMonths: 12, ratePct: 10.0, scrapedAt: day(2) },
        ],
      }),
    ]);
    expect(result.changedRates).toHaveLength(0);
  });

  it("needs at least two snapshots in the same instrument+term group to compare", () => {
    const result = computeDigest([
      bank({ snapshots: [{ instrument: "FDR", termMonths: 12, ratePct: 10.5, scrapedAt: day(3) }] }),
    ]);
    expect(result.changedRates).toHaveLength(0);
  });

  it("keeps instrument/term groups independent", () => {
    const result = computeDigest([
      bank({
        snapshots: [
          { instrument: "FDR", termMonths: 12, ratePct: 10.5, scrapedAt: day(3) },
          { instrument: "FDR", termMonths: 12, ratePct: 10.0, scrapedAt: day(2) },
          { instrument: "FDR", termMonths: 3, ratePct: 9.0, scrapedAt: day(3) },
          { instrument: "FDR", termMonths: 3, ratePct: 9.0, scrapedAt: day(2) },
        ],
      }),
    ]);
    expect(result.changedRates).toHaveLength(1);
    expect(result.changedRates[0].termMonths).toBe(12);
  });

  it("compares the high end of a range too", () => {
    const result = computeDigest([
      bank({
        snapshots: [
          { instrument: "FDR", termMonths: 12, ratePct: 9, ratePctMax: 10, scrapedAt: day(3) },
          { instrument: "FDR", termMonths: 12, ratePct: 9, ratePctMax: 9.5, scrapedAt: day(2) },
        ],
      }),
    ]);
    expect(result.changedRates).toHaveLength(1);
    expect(result.changedRates[0].deltaPct).toBeCloseTo(0.5, 6);
    expect(result.changedRates[0].currentPctMax).toBe(10);
  });

  it("takes the chart row as current over an older scraper's row dated after it, as /rates does", () => {
    const result = computeDigest([
      bank({
        snapshots: [
          { instrument: "FDR", termMonths: 12, ratePct: 6, source: "https://bank.example/old-scraper", scrapedAt: day(20) },
          { instrument: "FDR", termMonths: 12, ratePct: 8.5, ratePctMax: 9, source: BB_DEPOSIT_CHART_URL, scrapedAt: day(1) },
        ],
      }),
    ]);
    expect(result.changedRates).toHaveLength(1);
    expect(result.changedRates[0]).toMatchObject({ previousPct: 6, currentPct: 8.5, currentPctMax: 9, deltaPct: 3 });
  });
});
