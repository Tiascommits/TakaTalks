import { describe, expect, it } from "vitest";
import { calculateBasicTax } from "./basic";

describe("calculateBasicTax", () => {
  it("matches the video script's worked example (general, ৳10,00,000)", () => {
    // 10,00,000 income, general taxpayer: 4,00,000 tax-free, remaining
    // 6,00,000 split 1,00,000 @5% + 3,00,000 @10% + 2,00,000 @15% = 5,000 + 30,000 + 30,000 = 65,000.
    const r = calculateBasicTax({ income: 1000000, categoryId: "general", disabledChildren: 0 });
    expect(r.taxFree).toBe(400000);
    expect(r.incomeAboveTaxFree).toBe(600000);
    expect(r.slabRows).toEqual([
      { rate: 0.05, chunk: 100000, tax: 5000 },
      { rate: 0.1, chunk: 300000, tax: 30000 },
      { rate: 0.15, chunk: 200000, tax: 30000 },
    ]);
    expect(r.basicTax).toBe(65000);
  });

  it("applies 1/3 statutory salary exemption when isSalary is true", () => {
    // 4,50,000 gross salary: 1/3 is 1,50,000 exempt, taxable is 3,00,000 <= 4,00,000 tax free => 0 tax
    const r = calculateBasicTax({ income: 450000, categoryId: "general", disabledChildren: 0, isSalary: true });
    expect(r.salaryExemption).toBe(150000);
    expect(r.taxableIncome).toBe(300000);
    expect(r.incomeAboveTaxFree).toBe(0);
    expect(r.basicTax).toBe(0);
  });

  it("is zero when income is under the tax-free limit", () => {
    const r = calculateBasicTax({ income: 350000, categoryId: "general", disabledChildren: 0 });
    expect(r.incomeAboveTaxFree).toBe(0);
    expect(r.basicTax).toBe(0);
    expect(r.slabRows).toEqual([]);
  });

  it("raises the tax-free limit for a disabled child", () => {
    const r = calculateBasicTax({ income: 1000000, categoryId: "general", disabledChildren: 1 });
    expect(r.taxFree).toBe(450000);
  });

  it("uses a different category's tax-free limit", () => {
    const r = calculateBasicTax({ income: 1000000, categoryId: "woman_senior", disabledChildren: 0 });
    expect(r.taxFree).toBe(450000);
    expect(r.incomeAboveTaxFree).toBe(550000);
  });

  it("falls back to zero for negative or NaN income", () => {
    const r = calculateBasicTax({ income: NaN, categoryId: "general", disabledChildren: 0 });
    expect(r.incomeAboveTaxFree).toBe(0);
    expect(r.basicTax).toBe(0);
  });
});
