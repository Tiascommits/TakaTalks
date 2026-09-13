import { describe, expect, it } from "vitest";
import { compareInstruments, INSTRUMENT_CATALOG } from "./instruments";

describe("Bangladeshi Instrument Comparison & Real Yield Matrix", () => {
  it("computes tiered Sanchayapatra rates and 5% vs 10% TDS", () => {
    // Under 5 lakh: 5% TDS
    const small = compareInstruments({
      amount: 400_000,
      tenureYears: 5,
      hasPSR: true,
    });
    const paribarSmall = small.find((i) => i.id === "paribar-sanchaya");
    expect(paribarSmall).toBeDefined();
    expect(paribarSmall!.tdsPct).toBe(5);
    expect(paribarSmall!.nominalGrossRatePct).toBe(11.52);

    // Over 15 lakh: tiered weighted rate and 10% TDS
    const large = compareInstruments({
      amount: 2_000_000,
      tenureYears: 5,
      hasPSR: true,
    });
    const paribarLarge = large.find((i) => i.id === "paribar-sanchaya");
    expect(paribarLarge).toBeDefined();
    expect(paribarLarge!.tdsPct).toBe(10);
    // Weighted between 11.52% (first 1.5M) and 11.04% (next 0.5M)
    expect(paribarLarge!.nominalGrossRatePct).toBeLessThan(11.52);
    expect(paribarLarge!.nominalGrossRatePct).toBeGreaterThan(11.04);
  });

  it("applies 10% vs 15% TDS on bank FDR based on PSR proof", () => {
    const withPSR = compareInstruments({
      amount: 500_000,
      hasPSR: true,
    });
    const fdrWith = withPSR.find((i) => i.id === "bank-fdr-top");
    expect(fdrWith!.tdsPct).toBe(10);

    const withoutPSR = compareInstruments({
      amount: 500_000,
      hasPSR: false,
    });
    const fdrWithout = withoutPSR.find((i) => i.id === "bank-fdr-top");
    expect(fdrWithout!.tdsPct).toBe(15);
    expect(fdrWithout!.netRatePct).toBeLessThan(fdrWith!.netRatePct);
  });

  it("flags investment cap excess for Sanchayapatra", () => {
    const huge = compareInstruments({
      amount: 6_000_000, // Above 45L individual limit
    });
    const paribar = huge.find((i) => i.id === "paribar-sanchaya");
    expect(paribar!.exceedsCap).toBe(true);
    expect(paribar!.capNotice).toContain("exceeds individual statutory limit");

    // Treasury bonds have no individual cap
    const sukuk = huge.find((i) => i.id === "treasury-bond-sukuk");
    expect(sukuk!.exceedsCap).toBe(false);
  });

  it("calculates real inflation-adjusted purchasing power", () => {
    const results = compareInstruments({
      amount: 1_000_000,
      tenureYears: 5,
      inflationPct: 8.5,
    });

    for (const item of results) {
      expect(item.totalMaturityValue).toBeGreaterThan(1_000_000);
      expect(Number.isFinite(item.realPurchasingPowerAtMaturity)).toBe(true);
      expect(Number.isFinite(item.realYieldPct)).toBe(true);
    }
  });

  it("catalog contains comprehensive instrument definitions", () => {
    expect(INSTRUMENT_CATALOG.length).toBeGreaterThanOrEqual(5);
    const ids = INSTRUMENT_CATALOG.map((i) => i.id);
    expect(ids).toContain("paribar-sanchaya");
    expect(ids).toContain("three-month-sanchaya");
    expect(ids).toContain("treasury-bond-sukuk");
    expect(ids).toContain("bank-fdr-top");
  });
});
