import { describe, expect, it } from "vitest";
import { TAX_RULES } from "@/config/tax-rules-2025-26";
import { calculateTax } from "./calculate";
import { calculateOptimizer } from "./optimizer";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "./types";

function optimizerFor(overrides: Partial<TaxCalculatorInput>) {
  const r = calculateTax({ ...EMPTY_TAX_INPUT, ...overrides });
  return { r, opt: calculateOptimizer(r) };
}

describe("calculateOptimizer — normal cases", () => {
  it("has nothing to suggest when there is no taxable income", () => {
    const { opt } = optimizerFor({});
    expect(opt.hasTaxableIncome).toBe(false);
  });

  it("suggests filling the sanchay/bond/MF group first", () => {
    const { opt } = optimizerFor({ businessAnnual: 5000000 });
    expect(opt.hasTaxableIncome).toBe(true);
    expect(opt.suggestions[0].instrumentId).toBe("sanchay_group");
  });

  it("moves on to DPS once the shared group cap is already full", () => {
    const { opt } = optimizerFor({
      businessAnnual: 5000000,
      invSanchayAnnual: TAX_RULES.sharedGroupCap,
    });
    expect(opt.suggestions[0].instrumentId).toBe("dps");
  });

  it("falls through to uncapped instruments once sanchay group and DPS are both full", () => {
    const { opt } = optimizerFor({
      businessAnnual: 50000000, // needs a very large rebate ceiling to still have a gap
      invSanchayAnnual: TAX_RULES.sharedGroupCap,
      invDPSMonthly: TAX_RULES.dpsCap / 12,
    });
    const ids = opt.suggestions.map((s) => s.instrumentId);
    expect(ids).toContain("uncapped");
  });

  it("marks already-at-max once investment covers the full rebate ceiling", () => {
    // income low enough that 3% of income is the binding (small) ceiling
    const { opt } = optimizerFor({ businessAnnual: 500000, invStockAnnual: 1000000 });
    expect(opt.alreadyAtMax).toBe(true);
    expect(opt.suggestions).toHaveLength(0);
    expect(opt.rebateGap).toBe(0);
  });

  it("suggestion investment amounts sum to the total additional investment needed", () => {
    const { opt } = optimizerFor({ businessAnnual: 8000000 });
    const total = opt.suggestions.reduce((sum, s) => sum + s.investMore, 0);
    expect(total).toBeCloseTo(opt.additionalInvestmentNeeded, 6);
  });

  it("each suggestion's tax saving is 10% of the amount to invest", () => {
    const { opt } = optimizerFor({ businessAnnual: 8000000 });
    for (const s of opt.suggestions) {
      expect(s.taxSavingFromThis).toBeCloseTo(s.investMore * TAX_RULES.rebateRateOfInvestment, 6);
    }
  });
});

describe("calculateOptimizer — edge / weird cases", () => {
  it("does not blow up when income is zero but investment is huge", () => {
    const { opt } = optimizerFor({ invStockAnnual: 10000000 });
    expect(opt.hasTaxableIncome).toBe(false);
    expect(Number.isFinite(opt.maxRebate)).toBe(true);
  });

  it("never proposes a negative investment amount even at the boundary", () => {
    const { opt } = optimizerFor({ businessAnnual: 450000, invStockAnnual: 13500 });
    for (const s of opt.suggestions) {
      expect(s.investMore).toBeGreaterThanOrEqual(0);
    }
  });

  it("handles an absurdly large income without producing Infinity or NaN", () => {
    const { opt } = optimizerFor({ businessAnnual: 1e12 });
    expect(Number.isFinite(opt.maxRebate)).toBe(true);
    expect(Number.isFinite(opt.additionalInvestmentNeeded)).toBe(true);
    expect(opt.maxRebate).toBe(TAX_RULES.rebateCap);
  });

  it("stays internally consistent: maxRebate never exceeds the hard cap", () => {
    const { opt } = optimizerFor({ businessAnnual: 9e8 });
    expect(opt.maxRebate).toBeLessThanOrEqual(TAX_RULES.rebateCap);
  });
});
