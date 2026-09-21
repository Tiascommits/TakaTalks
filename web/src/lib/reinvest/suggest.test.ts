import { describe, expect, it } from "vitest";
import { TAX_RULES } from "@/config/tax-rules-2025-26";
import { calculateTax } from "@/lib/tax/calculate";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "@/lib/tax/types";
import { computeReinvestSuggestion, maturityTenureYears, REINVEST_CATEGORY_IDS } from "./suggest";

// Known bank/product names that must never appear anywhere in the output —
// this module scores instrument *categories* only (see docs/product-notes.md's
// "advice vs. math" line). Sample of real bank names used elsewhere in the
// app's rate-scorecard config (src/config/banks.ts), kept independent here
// deliberately so this guard doesn't rely on that file's contents.
const BANK_NAMES = [
  "Sonali Bank",
  "AB Bank",
  "National Bank",
  "IFIC",
  "Standard Chartered",
  "Islami Bank",
  "City Bank",
  "Eastern Bank",
  "EBL",
  "Dutch-Bangla",
  "Brac Bank",
  "BRAC Bank",
];

function taxResultFor(overrides: Partial<TaxCalculatorInput>) {
  return calculateTax({ ...EMPTY_TAX_INPUT, ...overrides });
}

describe("computeReinvestSuggestion — category scoring", () => {
  it("returns every known category, ranked, with a topCategory matching the highest score", () => {
    const result = computeReinvestSuggestion({ reinvestAmount: 300_000, horizonYears: 3 });

    expect(result.categories).toHaveLength(REINVEST_CATEGORY_IDS.length);
    const ids = result.categories.map((c) => c.category);
    for (const id of REINVEST_CATEGORY_IDS) {
      expect(ids).toContain(id);
    }

    for (let i = 1; i < result.categories.length; i++) {
      expect(result.categories[i - 1].scoreBreakdown.total).toBeGreaterThanOrEqual(
        result.categories[i].scoreBreakdown.total
      );
    }
    expect(result.topCategory).toBe(result.categories[0].category);
  });

  it("never names a specific bank or branded product anywhere in the output", () => {
    const result = computeReinvestSuggestion({
      reinvestAmount: 500_000,
      horizonYears: 5,
      taxResult: taxResultFor({ businessAnnual: 3_000_000 }),
    });
    const serialized = JSON.stringify(result);
    for (const name of BANK_NAMES) {
      expect(serialized).not.toContain(name);
    }
  });

  it("is a pure function: identical inputs always produce an identical result", () => {
    const params = {
      reinvestAmount: 250_000,
      horizonYears: 4,
      hasPSR: true,
      inflationPct: 8.5,
      taxResult: taxResultFor({ businessAnnual: 1_500_000 }),
    };
    const a = computeReinvestSuggestion(params);
    const b = computeReinvestSuggestion(params);
    expect(a).toEqual(b);
  });

  it("clamps a nonsensical amount/horizon instead of producing NaN or negative numbers", () => {
    const result = computeReinvestSuggestion({ reinvestAmount: -5000, horizonYears: 0 });
    expect(result.reinvestAmount).toBeGreaterThan(0);
    expect(result.horizonYears).toBeGreaterThan(0);
    for (const c of result.categories) {
      expect(Number.isFinite(c.scoreBreakdown.total)).toBe(true);
      expect(Number.isFinite(c.realYieldPct)).toBe(true);
    }
  });
});

describe("computeReinvestSuggestion — tax-rebate headroom reasoning", () => {
  it("gives sanchay-group-eligible categories a rebate bonus when headroom remains", () => {
    // Enough taxable income to want the full rebate, nothing invested yet —
    // so the whole shared group cap (৳5 lakh) is still open.
    const taxResult = taxResultFor({ businessAnnual: 3_000_000 });
    const result = computeReinvestSuggestion({
      reinvestAmount: 200_000,
      horizonYears: 3,
      taxResult,
    });

    const sanchay = result.categories.find((c) => c.category === "SANCHAYAPATRA")!;
    const fdr = result.categories.find((c) => c.category === "BANK_DEPOSIT")!;

    expect(sanchay.rebateEligible).toBe(true);
    expect(sanchay.rebateEligibleAmount).toBeCloseTo(200_000, 0);
    expect(sanchay.estimatedTaxSaving).toBeCloseTo(200_000 * TAX_RULES.rebateRateOfInvestment, 0);
    expect(sanchay.scoreBreakdown.rebatePoints).toBeGreaterThan(0);

    expect(fdr.rebateEligible).toBe(false);
    expect(fdr.rebateEligibleAmount).toBe(0);
    expect(fdr.estimatedTaxSaving).toBe(0);
    expect(fdr.scoreBreakdown.rebatePoints).toBe(0);
  });

  it("gives no rebate bonus once the person is already at their max rebate", () => {
    // Small income (small 3%-of-income ceiling) already fully covered by
    // existing investment — optimizer.alreadyAtMax should be true.
    const taxResult = taxResultFor({ businessAnnual: 500_000, invStockAnnual: 1_000_000 });
    const result = computeReinvestSuggestion({
      reinvestAmount: 200_000,
      horizonYears: 3,
      taxResult,
    });

    for (const c of result.categories) {
      expect(c.rebateEligibleAmount).toBe(0);
      expect(c.estimatedTaxSaving).toBe(0);
      expect(c.scoreBreakdown.rebatePoints).toBe(0);
    }
  });

  it("only credits the rebate-eligible portion when the amount exceeds remaining headroom", () => {
    // Shared group already holds 4.9 lakh of its 5 lakh cap -> only 10,000 headroom left.
    const taxResult = taxResultFor({
      businessAnnual: 5_000_000,
      invSanchayAnnual: TAX_RULES.sharedGroupCap - 10_000,
    });
    const result = computeReinvestSuggestion({
      reinvestAmount: 200_000,
      horizonYears: 3,
      taxResult,
    });
    const sanchay = result.categories.find((c) => c.category === "SANCHAYAPATRA")!;
    expect(sanchay.rebateEligibleAmount).toBeCloseTo(10_000, 0);
  });

  it("has no tax-context bonus at all when no tax result is supplied", () => {
    const result = computeReinvestSuggestion({ reinvestAmount: 200_000, horizonYears: 3 });
    expect(result.hasTaxContext).toBe(false);
    for (const c of result.categories) {
      expect(c.rebateEligibleAmount).toBe(0);
      expect(c.scoreBreakdown.rebatePoints).toBe(0);
    }
  });
});

describe("computeReinvestSuggestion — goal-horizon fit", () => {
  it("penalizes a locked instrument for a horizon shorter than its minimum term", () => {
    // Treasury bond/sukuk has a 2-year minimum term.
    const shortHorizon = computeReinvestSuggestion({ reinvestAmount: 300_000, horizonYears: 0.5 });
    const bond = shortHorizon.categories.find((c) => c.category === "GOVT_BOND")!;
    expect(bond.horizonFit).toBe("under");
    expect(bond.scoreBreakdown.horizonFitPoints).toBeLessThan(0);
  });

  it("penalizes a locked category less gently than it penalizes nothing for bank FDR (high liquidity)", () => {
    const shortHorizon = computeReinvestSuggestion({ reinvestAmount: 300_000, horizonYears: 0.5 });
    const bond = shortHorizon.categories.find((c) => c.category === "GOVT_BOND")!;
    const fdr = shortHorizon.categories.find((c) => c.category === "BANK_DEPOSIT")!;
    // FDR's minTermYears is also 1, so it's technically "under" too, but the
    // mismatch penalty must be smaller since it's realistically encashable
    // anytime (see RELATIVELY_LIQUID_CATEGORIES in suggest.ts).
    expect(fdr.horizonFit).toBe("under");
    expect(fdr.scoreBreakdown.horizonFitPoints).toBeGreaterThan(bond.scoreBreakdown.horizonFitPoints);
  });

  it("rewards a horizon that fits comfortably within a category's term range", () => {
    const result = computeReinvestSuggestion({ reinvestAmount: 300_000, horizonYears: 3 });
    for (const c of result.categories) {
      if (c.minTermYears <= 3 && c.maxTermYears >= 3) {
        expect(c.horizonFit).toBe("good");
        expect(c.scoreBreakdown.horizonFitPoints).toBeGreaterThan(0);
      }
    }
  });

  it("flags rollover risk for a horizon far beyond a short-term category's max term", () => {
    // 3-Month Profit Sanchayapatra type entries have short max terms; use a
    // very long horizon to trigger the "over" branch on at least one entry.
    const result = computeReinvestSuggestion({ reinvestAmount: 300_000, horizonYears: 25 });
    const anyOver = result.categories.some((c) => c.horizonFit === "over");
    expect(anyOver).toBe(true);
  });
});

describe("computeReinvestSuggestion — reasoning text", () => {
  it("gives every category at least one non-empty reason in both languages", () => {
    const result = computeReinvestSuggestion({
      reinvestAmount: 400_000,
      horizonYears: 3,
      taxResult: taxResultFor({ businessAnnual: 2_000_000 }),
    });
    for (const c of result.categories) {
      expect(c.reasonsEn.length).toBeGreaterThan(0);
      expect(c.reasonsBn.length).toBeGreaterThan(0);
      for (const r of c.reasonsEn) expect(r.length).toBeGreaterThan(0);
      for (const r of c.reasonsBn) expect(r.length).toBeGreaterThan(0);
    }
  });

  it("cites the same real-yield percentage in the reasoning text as in the numeric field", () => {
    const result = computeReinvestSuggestion({ reinvestAmount: 400_000, horizonYears: 3 });
    for (const c of result.categories) {
      const pctStr = `${c.realYieldPct}%`;
      const mentioned = c.reasonsEn.some((r) => r.includes(pctStr)) || c.reasonsBn.some((r) => r.includes(pctStr));
      expect(mentioned).toBe(true);
    }
  });
});

describe("maturityTenureYears", () => {
  it("rounds the horizon to whole years and keeps it inside 1-20", () => {
    expect(maturityTenureYears(0.5)).toBe(1);
    expect(maturityTenureYears(2.4)).toBe(2);
    expect(maturityTenureYears(2.5)).toBe(3);
    expect(maturityTenureYears(25)).toBe(20);
    expect(maturityTenureYears(Number.NaN)).toBe(3);
  });

  it("matches the term computeReinvestSuggestion projects each maturity value over", () => {
    // Two horizons that round to the same whole year must give identical maturity values.
    const a = computeReinvestSuggestion({ reinvestAmount: 500_000, horizonYears: 3.2, taxResult: null });
    const b = computeReinvestSuggestion({ reinvestAmount: 500_000, horizonYears: 2.8, taxResult: null });
    expect(maturityTenureYears(3.2)).toBe(maturityTenureYears(2.8));
    const maturity = (r: typeof a) => Object.fromEntries(r.categories.map((c) => [c.category, c.totalMaturityValue]));
    expect(maturity(a)).toEqual(maturity(b));
  });
});
