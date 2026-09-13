import { describe, it, expect } from "vitest";
import { calculateLoan, calculateExciseDuty, LOAN_PRESETS } from "./loans";

describe("NBR Excise Duty", () => {
  it("computes exact statutory NBR excise duty slabs", () => {
    expect(calculateExciseDuty(50_000)).toBe(0);
    expect(calculateExciseDuty(100_000)).toBe(0);
    expect(calculateExciseDuty(100_001)).toBe(150);
    expect(calculateExciseDuty(500_000)).toBe(150);
    expect(calculateExciseDuty(500_001)).toBe(500);
    expect(calculateExciseDuty(1_000_000)).toBe(500);
    expect(calculateExciseDuty(5_000_000)).toBe(3_000);
    expect(calculateExciseDuty(10_000_000)).toBe(3_000);
    expect(calculateExciseDuty(20_000_000)).toBe(15_000);
    expect(calculateExciseDuty(60_000_000)).toBe(50_000);
  });
});

describe("Loan Calculation & Prepayment Accelerator", () => {
  it("calculates standard reducing-balance EMI for 20-year DBH Home Loan", () => {
    const result = calculateLoan({
      principal: 5_000_000,
      tenureYears: 20,
      annualInterestRatePct: 10.5,
    });

    // At 10.5% for 20 years, EMI is approx 49,919 BDT
    expect(result.standardMonthlyEMI).toBeGreaterThan(49_000);
    expect(result.standardMonthlyEMI).toBeLessThan(51_000);
    expect(result.tenureMonths).toBe(240);
    expect(result.actualMonthsToPayoff).toBe(240);
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBe(0);
    expect(result.hasPrepayment).toBe(false);

    // Total interest over 20 years on 50L at 10.5% is approx 69-70 Lakhs
    expect(result.totalStandardInterest).toBeGreaterThan(6_500_000);
    expect(result.totalStandardPayment).toBe(result.principal + result.totalStandardInterest);

    // Verify statutory upfront charges: 0.5% fee (25k) + 15% VAT (3,750) + 3,000 excise duty
    expect(result.processingFee).toBe(25_000);
    expect(result.processingFeeVAT).toBe(3_750);
    expect(result.estimatedExciseDuty).toBe(3_000);
    expect(result.totalUpfrontCharges).toBe(31_750);
  });

  it("accelerates debt payoff and saves lakhs in interest with extra monthly payment", () => {
    const baseline = calculateLoan({
      principal: 5_000_000,
      tenureYears: 20,
      annualInterestRatePct: 10.5,
    });

    const accelerated = calculateLoan({
      principal: 5_000_000,
      tenureYears: 20,
      annualInterestRatePct: 10.5,
      extraMonthlyPayment: 10_000, // Extra 10,000 BDT/month
    });

    expect(accelerated.hasPrepayment).toBe(true);
    // Loan should be paid off significantly faster (e.g. saves >5 years)
    expect(accelerated.actualMonthsToPayoff).toBeLessThan(180);
    expect(accelerated.monthsSaved).toBeGreaterThan(60);
    // Saves over 20 Lakhs in interest
    expect(accelerated.interestSaved).toBeGreaterThan(2_000_000);
    expect(accelerated.actualTotalInterestPaid).toBe(
      baseline.totalStandardInterest - accelerated.interestSaved
    );
  });

  it("handles zero interest loans cleanly without division by zero or NaN", () => {
    const result = calculateLoan({
      principal: 120_000,
      tenureYears: 1,
      annualInterestRatePct: 0,
    });

    expect(result.standardMonthlyEMI).toBe(10_000);
    expect(result.totalStandardInterest).toBe(0);
    expect(result.totalStandardPayment).toBe(120_000);
  });

  it("handles short-term digital nano loans correctly", () => {
    const nano = calculateLoan({
      principal: 30_000,
      tenureYears: 0.5, // 6 months
      annualInterestRatePct: 9.0,
    });

    expect(nano.tenureMonths).toBe(6);
    expect(nano.actualMonthsToPayoff).toBe(6);
    expect(nano.standardMonthlyEMI).toBeGreaterThan(5_000);
    expect(nano.estimatedExciseDuty).toBe(0); // Up to 100k is 0
  });

  it("provides valid presets", () => {
    expect(LOAN_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const preset of LOAN_PRESETS) {
      expect(preset.principal).toBeGreaterThan(0);
      expect(preset.tenureYears).toBeGreaterThan(0);
      expect(preset.annualInterestRatePct).toBeGreaterThan(0);
    }
  });
});
