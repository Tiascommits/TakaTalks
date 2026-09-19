import { describe, expect, it } from "vitest";
import { calculateSalaryBreakdown, compareSalaries } from "./salary";

describe("Salary Offer Analyzer (Income Tax Act 2023)", () => {
  it("computes accurate statutory 1/3 exemption capped at ৳4.5 lakh", () => {
    // High salary where 1/3 would exceed 4.5 lakh
    const high = calculateSalaryBreakdown({
      label: "Senior Role",
      monthlyBasic: 150_000,
      monthlyHouseRent: 75_000,
      monthlyMedical: 15_000,
      monthlyConveyance: 10_000,
      festivalBonusesCount: 2,
    });

    // 1/3 of ~3.3M is ~1.1M, but must be capped at exactly 4,50,000
    expect(high.statutoryExemption).toBe(450_000);
    expect(high.taxableSalary).toBe(high.totalEmploymentReceiptsForTax - 450_000);
  });

  it("computes 1/3 exemption when below ৳4.5 lakh cap", () => {
    // Moderate salary where 1/3 is below 4.5 lakh
    const mod = calculateSalaryBreakdown({
      label: "Junior Role",
      monthlyBasic: 30_000,
      monthlyHouseRent: 15_000,
      monthlyMedical: 3_000,
      monthlyConveyance: 2_000,
      festivalBonusesCount: 2,
      pfContributionPct: 0,
      hasEmployerPFMatch: false,
    });

    const receipts = mod.totalEmploymentReceiptsForTax;
    const expectedExemption = Math.round(receipts / 3);
    expect(mod.statutoryExemption).toBe(expectedExemption);
    expect(mod.statutoryExemption).toBeLessThan(450_000);
  });

  it("calculates accurate monthly take-home and TDS", () => {
    const role = calculateSalaryBreakdown({
      label: "Engineer",
      monthlyBasic: 50_000,
      monthlyHouseRent: 25_000,
      monthlyMedical: 5_000,
      monthlyConveyance: 5_000,
      pfContributionPct: 10,
      hasEmployerPFMatch: true,
    });

    expect(role.monthlyGrossCash).toBe(85_000);
    expect(role.monthlyEmployeePF).toBe(5_000);
    expect(role.monthlyTDS).toBeGreaterThan(0);
    expect(role.netMonthlyInHand).toBe(
      role.monthlyGrossCash - role.monthlyEmployeePF - role.monthlyTDS
    );
    expect(role.annualTotalWealth).toBe(role.netAnnualInHand + role.annualTotalPF);
  });

  it("compares two job offers and identifies the best offer correctly", () => {
    const current = {
      label: "Current Job",
      monthlyBasic: 60_000,
      monthlyHouseRent: 30_000,
      monthlyMedical: 6_000,
      monthlyConveyance: 4_000,
      pfContributionPct: 10,
      hasEmployerPFMatch: true,
    };

    const offerA = {
      label: "Offer A (High Cash, No PF)",
      monthlyBasic: 90_000,
      monthlyHouseRent: 40_000,
      monthlyMedical: 5_000,
      monthlyConveyance: 5_000,
      pfContributionPct: 0,
      hasEmployerPFMatch: false,
    };

    const offerB = {
      label: "Offer B (Balanced + Good PF)",
      monthlyBasic: 75_000,
      monthlyHouseRent: 37_500,
      monthlyMedical: 7_500,
      monthlyConveyance: 5_000,
      pfContributionPct: 10,
      hasEmployerPFMatch: true,
    };

    const comp = compareSalaries(current, [offerA, offerB]);
    expect(comp.current.label).toBe("Current Job");
    expect(comp.offers).toHaveLength(2);
    expect(comp.winnerMonthlyInHand).toBe("Offer A (High Cash, No PF)");
    expect(comp.winnerTotalWealth).toBeTruthy();
  });
});
