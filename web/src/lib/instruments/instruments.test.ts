import { describe, expect, it } from "vitest";
import { compareInstruments, INSTRUMENT_CATALOG } from "./instruments";

describe("Bangladeshi Instrument Comparison & Real Yield Matrix", () => {
  it("applies one Sanchayapatra rate to the whole holding, picked by its size (B8)", () => {
    // Rates from 1 Jul 2025, kept for Jul-Dec 2026: Paribar 11.93% up to 7.5 lakh, 11.80% above
    // (Prothom Alo English and Bangla Tribune, 2 Jul 2026; Dhaka Tribune, 4 Jan 2026).
    const at = (amount: number, id: string) =>
      compareInstruments({ amount, tenureYears: 5, hasPSR: true }).find((i) => i.id === id)!;

    expect(at(400_000, "paribar-sanchaya").nominalGrossRatePct).toBe(11.93);
    expect(at(750_000, "paribar-sanchaya").nominalGrossRatePct).toBe(11.93);
    // Above 7.5 lakh the lower rate covers all of it, not just the part above
    expect(at(2_000_000, "paribar-sanchaya").nominalGrossRatePct).toBe(11.8);
    expect(at(400_000, "pensioner-sanchaya").nominalGrossRatePct).toBe(11.98);
    expect(at(400_000, "three-month-sanchaya").nominalGrossRatePct).toBe(11.82);
    expect(at(2_000_000, "three-month-sanchaya").nominalGrossRatePct).toBe(11.77);
  });

  it("includes the 5-year Bangladesh Sanchayapatra (11.83% / 11.80%)", () => {
    const small = compareInstruments({ amount: 500_000 }).find((i) => i.id === "bangladesh-sanchaya")!;
    const large = compareInstruments({ amount: 1_000_000 }).find((i) => i.id === "bangladesh-sanchaya")!;
    expect(small.nominalGrossRatePct).toBe(11.83);
    expect(large.nominalGrossRatePct).toBe(11.8);
    expect(small.compounds).toBe(false);
  });

  it("takes 5% source tax up to 5 lakh, 10% above, and none on a small Pensioner holding", () => {
    const at = (amount: number, id: string) => compareInstruments({ amount }).find((i) => i.id === id)!;
    expect(at(400_000, "paribar-sanchaya").tdsPct).toBe(5);
    expect(at(2_000_000, "paribar-sanchaya").tdsPct).toBe(10);
    expect(at(400_000, "pensioner-sanchaya").tdsPct).toBe(0);
    expect(at(600_000, "pensioner-sanchaya").tdsPct).toBe(10);
  });

  it("dates and sources every rate", () => {
    for (const spec of INSTRUMENT_CATALOG) {
      expect(spec.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(spec.source.length).toBeGreaterThan(0);
    }
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

  it("models Sanchayapatra as non-compounding periodic payout", () => {
    const results = compareInstruments({
      amount: 1_000_000,
      tenureYears: 5,
      hasPSR: true,
    });
    const paribar = results.find((i) => i.id === "paribar-sanchaya")!;
    expect(paribar.compounds).toBe(false);
    // Simple interest: safeAmount + (annualNetProfit * safeYears)
    const expectedMaturity = 1_000_000 + paribar.annualNetProfit * 5;
    expect(paribar.totalMaturityValue).toBe(expectedMaturity);
  });
});
