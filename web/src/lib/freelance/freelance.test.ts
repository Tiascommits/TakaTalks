import { describe, expect, it } from "vitest";
import { calculateFreelanceEarnings, ITES_CATEGORIES } from "./freelance";

describe("Freelancer & ITES Remittance Engine", () => {
  it("calculates 0% tax for ITES inward remittance with banking FIRC and adds 2.5% cash incentive", () => {
    const res = calculateFreelanceEarnings({
      foreignAmount: 2000, // $2,000 USD
      currency: "USD",
      categoryId: "software_dev",
      hasBankingChannelFIRC: true,
      cashIncentivePct: 2.5,
    });

    // 2000 * 122 = 244,000 BDT
    expect(res.grossBDT).toBe(244_000);
    expect(res.isITESExempt).toBe(true);
    expect(res.taxPayableBDT).toBe(0);

    // 2.5% incentive on 244,000 = 6,100 BDT
    expect(res.cashIncentiveBDT).toBe(6_100);
    expect(res.netInHandBDT).toBe(244_000 + 6_100);
    expect(res.effectiveRetentionPct).toBeGreaterThan(100); // Incentive boosts above 100%
  });

  it("applies regular tax slabs if services are non-ITES or without banking channel proof", () => {
    const res = calculateFreelanceEarnings({
      foreignAmount: 15_000, // $15,000 USD
      currency: "USD",
      categoryId: "general_consulting",
      hasBankingChannelFIRC: false,
    });

    expect(res.isITESExempt).toBe(false);
    expect(res.cashIncentiveBDT).toBe(0); // No incentive without formal banking channel
    expect(res.taxPayableBDT).toBeGreaterThan(0);
    expect(res.netInHandBDT).toBe(res.grossBDT - res.taxPayableBDT);
  });

  it("handles multiple currencies with correct default rates", () => {
    const eur = calculateFreelanceEarnings({
      foreignAmount: 1000,
      currency: "EUR",
      categoryId: "web_ui_dev",
      hasBankingChannelFIRC: true,
    });
    expect(eur.grossBDT).toBe(134_000);

    const gbp = calculateFreelanceEarnings({
      foreignAmount: 1000,
      currency: "GBP",
      categoryId: "web_ui_dev",
      hasBankingChannelFIRC: true,
    });
    expect(gbp.grossBDT).toBe(158_000);
  });

  it("includes all compliance checklist items for legal white money declaration", () => {
    const res = calculateFreelanceEarnings({
      foreignAmount: 5000,
      currency: "USD",
      categoryId: "software_dev",
      hasBankingChannelFIRC: true,
    });

    expect(res.complianceChecklist).toHaveLength(4);
    const psr = res.complianceChecklist.find((c) => c.itemEn.includes("PSR"));
    expect(psr).toBeDefined();
    expect(psr!.required).toBe(true);
  });
});
