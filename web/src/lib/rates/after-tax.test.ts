import { describe, expect, it } from "vitest";
import { calculateAfterTaxReturn } from "./after-tax";
import { FDR_SOURCE_TAX } from "@/config/rate-monitoring";

describe("calculateAfterTaxReturn", () => {
  it("computes gross/net interest for a 12-month term at a flat marginal rate", () => {
    const r = calculateAfterTaxReturn(100000, 10, 12, 0.1);
    expect(r.grossInterest).toBeCloseTo(10000, 6);
    expect(r.taxAmount).toBeCloseTo(1000, 6);
    expect(r.netInterest).toBeCloseTo(9000, 6);
    expect(r.effectiveAfterTaxRatePct).toBeCloseTo(9, 6);
  });

  it("prorates a sub-annual term", () => {
    const r = calculateAfterTaxReturn(100000, 12, 3, 0.1);
    // 12% annual over 3 months = 3% gross interest
    expect(r.grossInterest).toBeCloseTo(3000, 6);
    expect(r.netInterest).toBeCloseTo(2700, 6);
    // effective annualized after-tax rate should still read as ~10.8%
    expect(r.effectiveAfterTaxRatePct).toBeCloseTo(10.8, 6);
  });

  it("applies a zero tax rate as a pass-through", () => {
    const r = calculateAfterTaxReturn(50000, 8, 6, 0);
    expect(r.netInterest).toBeCloseTo(r.grossInterest, 6);
    expect(r.effectiveAfterTaxRatePct).toBeCloseTo(8, 6);
  });

  it("returns zero effective rate for a zero principal instead of dividing by zero", () => {
    const r = calculateAfterTaxReturn(0, 10, 12, 0.1);
    expect(r.effectiveAfterTaxRatePct).toBe(0);
    expect(Number.isFinite(r.effectiveAfterTaxRatePct)).toBe(true);
  });

  it("nets FDR interest of the bank's source tax: 10% with proof of return, 15% without", () => {
    // ৳1,00,000 at 10% for a year earns ৳10,000; the bank keeps ৳1,000 (PSR) or ৳1,500 (no PSR).
    expect(calculateAfterTaxReturn(100000, 10, 12, FDR_SOURCE_TAX.withPsr).netInterest).toBeCloseTo(9000, 6);
    expect(calculateAfterTaxReturn(100000, 10, 12, FDR_SOURCE_TAX.withoutPsr).netInterest).toBeCloseTo(8500, 6);
  });
});
