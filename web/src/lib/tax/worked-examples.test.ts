/**
 * Worked examples for income year 2025-26 (assessment year 2026-27), each
 * computed by hand from the rules in src/config/tax-rules-2025-26.ts and the
 * sources cited there:
 *   [KPMG26] KPMG Bangladesh, "Bangladesh Tax 2026" (15 Jul 2026), individual tax
 *            rates, thresholds, rebate, minimum tax and salary exemption.
 *   [BDN26]  bdnews24, 29 Jun 2026, Finance Bill 2026 passed: 4 lakh threshold, no 5% slab.
 *   [FE25]   The Financial Express, 2 Jun 2025, and Dhaka Tribune, 5 Jul 2026: flat ৳5,000
 *            minimum, ৳1,000 for new taxpayers.
 * All cases are general-category business income with no investment unless stated.
 */
import { describe, expect, it } from "vitest";
import { calculateTax } from "./calculate";
import { calculateOptimizer } from "./optimizer";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "./types";

const tax = (overrides: Partial<TaxCalculatorInput>) => calculateTax({ ...EMPTY_TAX_INPUT, ...overrides });

describe("slab boundaries [KPMG26, BDN26]", () => {
  it.each([
    // income, tax: 0 to 4L, then 10% of 3L, 15% of 4L, 20% of 5L, 25% of 20L, 30% above
    [400000, 0],
    [500000, 10000], // 1L at 10%
    [700000, 30000], // end of the 10% band
    [1000000, 75000], // 30,000 + 3L at 15%
    [1100000, 90000], // end of the 15% band
    [1600000, 190000], // end of the 20% band
    [2000000, 290000], // 1,90,000 + 4L at 25%
    [3600000, 690000], // end of the 25% band
    [4000000, 810000], // 6,90,000 + 4L at 30%
  ])("general taxpayer with ৳%i income pays ৳%i", (businessAnnual, expected) => {
    expect(tax({ businessAnnual }).totalLiability).toBeCloseTo(expected, 6);
  });

  it("has no 5% band: the first taka above the threshold is taxed at 10% [BDN26]", () => {
    expect(tax({ businessAnnual: 700000 }).slabRows.map((r) => r.rate)).toEqual([0.1]);
  });
});

describe("category thresholds [KPMG26]", () => {
  it.each([
    ["woman_senior", 450000],
    ["disabled", 525000],
    ["third_gender", 525000],
    ["freedom_fighter", 550000],
  ])("%s pays nothing at its ৳%i threshold and 10% on the next ৳1 lakh", (categoryId, threshold) => {
    expect(tax({ categoryId, businessAnnual: threshold }).totalLiability).toBe(0);
    expect(tax({ categoryId, businessAnnual: threshold + 100000 }).totalLiability).toBeCloseTo(10000, 6);
  });
});

describe("salary exemption cap [KPMG26 p45]", () => {
  it("caps the 1/3 exemption at ৳5 lakh: ৳18 lakh salary is taxed on ৳13 lakh, ৳1,30,000", () => {
    // 1/3 of 18,00,000 = 6,00,000, capped at 5,00,000; 13,00,000 - 4,00,000 = 9,00,000 in bands:
    // 3L @10% + 4L @15% + 2L @20% = 30,000 + 60,000 + 40,000
    const r = tax({ basicMonthly: 150000 });
    expect(r.salaryExemption).toBe(500000);
    expect(r.taxableSalary).toBe(1300000);
    expect(r.totalLiability).toBeCloseTo(130000, 6);
  });
});

describe("investment rebate cap [KPMG26]", () => {
  it("caps the rebate at ৳7.5 lakh when 3% of income and 10% of investment are both larger", () => {
    // 3% of 3 crore = 9 lakh, 10% of 1 crore = 10 lakh, cap 7.5 lakh
    const r = tax({ businessAnnual: 30000000, invStockAnnual: 10000000 });
    expect(r.rebate).toBe(750000);
  });
});

describe("minimum tax [KPMG26, FE25]", () => {
  it("raises a ৳2,000 slab tax to the flat ৳5,000 minimum", () => {
    // 4,20,000: 20,000 above the threshold at 10% = 2,000
    const r = tax({ businessAnnual: 420000 });
    expect(r.grossTax).toBeCloseTo(2000, 6);
    expect(r.totalLiability).toBe(5000);
    expect(r.minApplied).toBe(true);
  });

  it("charges a first-time taxpayer ৳1,000 instead of ৳5,000", () => {
    // 4,05,000: slab tax 500, raised to the ৳1,000 new-taxpayer minimum
    const r = tax({ businessAnnual: 405000, firstTimeFiler: true });
    expect(r.totalLiability).toBe(1000);
  });

  it("leaves a first-time taxpayer's slab tax alone when it is already above ৳1,000", () => {
    expect(tax({ businessAnnual: 420000, firstTimeFiler: true }).totalLiability).toBeCloseTo(2000, 6);
  });
});

describe("rebate optimizer [critique B3]", () => {
  it("promises nothing at ৳4,00,001, where the ৳5,000 minimum already applies", () => {
    const opt = calculateOptimizer(tax({ businessAnnual: 400001 }));
    expect(opt.taxSaving).toBe(0);
    expect(opt.additionalInvestmentNeeded).toBe(0);
  });

  it("at ৳6,00,000 caps the saving at gross tax minus the minimum: ৳15,000 for ৳1,50,000 invested", () => {
    // gross 20,000; 3% of income = 18,000, but tax can only fall to 5,000
    const opt = calculateOptimizer(tax({ businessAnnual: 600000 }));
    expect(opt.taxSaving).toBeCloseTo(15000, 6);
    expect(opt.additionalInvestmentNeeded).toBeCloseTo(150000, 6);
    expect(tax({ businessAnnual: 600000, invStockAnnual: 150000 }).totalLiability).toBeCloseTo(5000, 6);
  });

  it("at ৳6,00,000 with ৳50,000 already invested, promises only the remaining ৳10,000 for ৳1,00,000 more", () => {
    // rebate so far 5,000, tax 15,000; it can fall 10,000 more before the ৳5,000 minimum
    const opt = calculateOptimizer(tax({ businessAnnual: 600000, invStockAnnual: 50000 }));
    expect(opt.taxSaving).toBeCloseTo(10000, 6);
    expect(opt.additionalInvestmentNeeded).toBeCloseTo(100000, 6);
  });

  it("first return at ৳5,00,000: the ৳1,000 minimum binds, so ৳9,000 for ৳90,000 invested", () => {
    // gross 10,000; 3% of income = 15,000, but tax can only fall to 1,000
    const opt = calculateOptimizer(tax({ businessAnnual: 500000, firstTimeFiler: true }));
    expect(opt.taxSaving).toBeCloseTo(9000, 6);
    expect(opt.additionalInvestmentNeeded).toBeCloseTo(90000, 6);
    expect(tax({ businessAnnual: 500000, firstTimeFiler: true, invStockAnnual: 90000 }).totalLiability).toBeCloseTo(1000, 6);
  });

  it("first return at ৳6,00,000: the 3% ceiling binds before the ৳1,000 minimum, so ৳18,000", () => {
    // gross 20,000; 3% of income = 18,000 leaves 2,000, above the 1,000 minimum
    const opt = calculateOptimizer(tax({ businessAnnual: 600000, firstTimeFiler: true }));
    expect(opt.taxSaving).toBeCloseTo(18000, 6);
    expect(opt.cappedByMinimumTax).toBe(false);
    expect(tax({ businessAnnual: 600000, firstTimeFiler: true, invStockAnnual: 180000 }).totalLiability).toBeCloseTo(2000, 6);
  });
});
