import { describe, expect, it } from "vitest";
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
});
