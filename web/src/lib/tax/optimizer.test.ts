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

  it("suggests filling the sanchay/bond group first", () => {
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

describe("calculateOptimizer — minimum tax floor (critique B3)", () => {
  it("promises nothing at ৳4,00,001, where the minimum tax already replaces the slab tax", () => {
    const { r, opt } = optimizerFor({ businessAnnual: 400001 });
    expect(r.minApplied).toBe(true);
    expect(opt.taxSaving).toBe(0);
    expect(opt.additionalInvestmentNeeded).toBe(0);
    expect(opt.suggestions).toHaveLength(0);
    expect(opt.alreadyAtMax).toBe(true);
    expect(opt.cappedByMinimumTax).toBe(true);
  });

  it("at ৳20 lakh with ৳10 lakh invested, the 3% ceiling binds, not the minimum tax", () => {
    const { r, opt } = optimizerFor({ businessAnnual: 2000000, invStockAnnual: 1000000 });
    expect(r.minApplied).toBe(false);
    expect(opt.alreadyAtMax).toBe(true);
    expect(opt.cappedByMinimumTax).toBe(false);
  });

  it("never promises a saving that would take tax below the minimum-tax floor", () => {
    for (const businessAnnual of [450000, 500000, 600000, 700000, 900000]) {
      const { r, opt } = optimizerFor({ businessAnnual });
      expect(opt.taxSaving).toBeLessThanOrEqual(Math.max(0, r.taxAfterRebate - r.minFloor) + 1e-9);
      // investing exactly what it says must deliver exactly the promised saving
      const after = calculateTax({ ...EMPTY_TAX_INPUT, businessAnnual, invStockAnnual: opt.additionalInvestmentNeeded });
      expect(r.taxAfterRebate - after.taxAfterRebate).toBeCloseTo(opt.taxSaving, 6);
    }
  });

  // Follows each suggestion into its own instrument, so a plan that overfills a capped one
  // (sanchay group, DPS) under-delivers and fails here.
  function follow(input: TaxCalculatorInput, opt: ReturnType<typeof calculateOptimizer>): TaxCalculatorInput {
    const next = { ...input };
    for (const s of opt.suggestions) {
      if (s.instrumentId === "sanchay_group") next.invSanchayAnnual += s.investMore;
      else if (s.instrumentId === "dps") next.invDPSMonthly += s.investMore / 12;
      else next.invStockAnnual += s.investMore;
    }
    return next;
  }

  const incomes = [400001, 450000, 500000, 600000, 750000, 1000000, 2000000, 5000000, 30000000];
  const existing: [string, Partial<TaxCalculatorInput>][] = [
    ["nothing invested", {}],
    ["৳30,000 in stocks", { invStockAnnual: 30000 }],
    ["sanchay group full", { invSanchayAnnual: TAX_RULES.sharedGroupCap }],
    ["DPS full", { invDPSMonthly: TAX_RULES.dpsCap / 12 }],
  ];
  const cases = incomes.flatMap((income) =>
    [false, true].flatMap((firstTimeFiler) =>
      [true, false].flatMap((salaried) =>
        existing.map(([invLabel, inv]): [string, TaxCalculatorInput] => [
          `৳${income} ${salaried ? "salary" : "business"}${firstTimeFiler ? ", first return" : ""}, ${invLabel}`,
          {
            ...EMPTY_TAX_INPUT,
            ...(salaried ? { basicMonthly: income / 12 } : { businessAnnual: income }),
            firstTimeFiler,
            ...inv,
          },
        ])
      )
    )
  );

  it.each(cases)("keeps every promise: %s", (_label, input) => {
    const r = calculateTax(input);
    const opt = calculateOptimizer(r);
    // never promises tax below the minimum
    expect(opt.taxSaving).toBeLessThanOrEqual(Math.max(0, r.taxAfterRebate - r.minFloor) + 1e-6);
    // the per-instrument lines add up to the headline
    const lines = opt.suggestions.reduce((sum, s) => sum + s.taxSavingFromThis, 0);
    expect(lines).toBeCloseTo(opt.taxSaving, 6);
    // following the plan delivers exactly the promised saving, and leaves nothing more to gain
    const after = calculateTax(follow(input, opt));
    expect(r.taxAfterRebate - after.taxAfterRebate).toBeCloseTo(opt.taxSaving, 6);
    expect(calculateOptimizer(after).taxSaving).toBeCloseTo(0, 6);
  });
});

