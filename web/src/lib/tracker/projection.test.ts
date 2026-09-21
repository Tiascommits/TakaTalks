import { describe, expect, it } from "vitest";
import type { InvestmentEntryDTO } from "@/components/tracker/types";
import { consolidateWithReinvestment, projectInvestment, summarizePortfolio } from "./projection";

function entry(overrides: Partial<InvestmentEntryDTO> = {}): InvestmentEntryDTO {
  return {
    id: "inv-1",
    label: "Test",
    instrumentType: "FIXED_DEPOSIT",
    principalAmount: 100_000,
    startDate: "2026-01-01",
    termMonths: 12,
    expectedRatePct: 10,
    maturityDate: "2027-01-01",
    payoutConfirmed: false,
    payoutAmount: null,
    ...overrides,
  };
}

describe("projectInvestment", () => {
  it("takes 10% TDS off an FDR when the person has a return-filing proof", () => {
    const p = projectInvestment(entry(), { hasPSR: true });
    expect(p.tdsPct).toBe(10);
    expect(p.grossProfit).toBe(10_000);
    expect(p.taxWithheld).toBe(1_000);
    expect(p.netProfit).toBe(9_000);
    expect(p.maturityValue).toBe(109_000);
    expect(p.basis).toBe("projected");
    expect(p.taxModelled).toBe(true);
  });

  it("takes 15% TDS off an FDR without one, and defaults to having one", () => {
    const withoutPsr = projectInvestment(entry(), { hasPSR: false });
    expect(withoutPsr.tdsPct).toBe(15);
    expect(withoutPsr.netProfit).toBe(8_500);
    expect(withoutPsr.taxWithheld).toBe(1_500);

    expect(projectInvestment(entry()).tdsPct).toBe(10);
  });

  it("compounds an FDR annually on the after-tax rate, like /instruments", () => {
    const p = projectInvestment(entry({ termMonths: 24 }));
    // 100,000 x 1.09^2 after tax; 100,000 x 1.1^2 before it.
    expect(p.maturityValue).toBe(118_810);
    expect(p.netProfit).toBe(18_810);
    expect(p.grossProfit).toBe(21_000);
    expect(p.taxWithheld).toBe(2_190);
  });

  it("pays Sanchayapatra as simple profit and uses the 10% band above 5 lakh", () => {
    const p = projectInvestment(
      entry({ instrumentType: "SANCHAYPATRA", principalAmount: 1_000_000, termMonths: 60, expectedRatePct: 11.52 })
    );
    expect(p.tdsPct).toBe(10);
    expect(p.grossProfit).toBe(576_000);
    expect(p.taxWithheld).toBe(57_600);
    expect(p.netProfit).toBe(518_400);
    expect(p.maturityValue).toBe(1_518_400);
  });

  it("uses the 5% Sanchayapatra band at or below 5 lakh", () => {
    const p = projectInvestment(entry({ instrumentType: "SANCHAYPATRA", principalAmount: 400_000, expectedRatePct: 10 }));
    expect(p.tdsPct).toBe(5);
    expect(p.netProfit).toBe(38_000);
    expect(p.maturityValue).toBe(438_000);
  });

  it("flags mutual funds as market-linked", () => {
    const p = projectInvestment(entry({ instrumentType: "MUTUAL_FUND" }));
    expect(p.marketLinked).toBe(true);
    expect(p.netProfit).toBe(9_000);
    expect(projectInvestment(entry()).marketLinked).toBe(false);
  });

  it("does not invent a tax figure for instruments the catalog doesn't model", () => {
    const p = projectInvestment(
      entry({ instrumentType: "PROVIDENT_FUND", principalAmount: 200_000, expectedRatePct: 8 })
    );
    expect(p.taxModelled).toBe(false);
    expect(p.tdsPct).toBeNull();
    expect(p.taxWithheld).toBe(0);
    expect(p.netProfit).toBe(16_000);
    expect(p.maturityValue).toBe(216_000);
  });

  it("treats a donation as returning nothing", () => {
    const p = projectInvestment(entry({ instrumentType: "DONATION", principalAmount: 50_000 }));
    expect(p.netProfit).toBe(0);
    expect(p.maturityValue).toBe(0);
  });

  it("uses the real payout, not the rate, once a payout is confirmed", () => {
    const p = projectInvestment(entry({ payoutConfirmed: true, payoutAmount: 108_000 }));
    expect(p.basis).toBe("confirmed");
    expect(p.netProfit).toBe(8_000);
    expect(p.maturityValue).toBe(108_000);
    expect(p.tdsPct).toBeNull();
  });

  it("reports a loss when the confirmed payout is below the principal", () => {
    const p = projectInvestment(entry({ instrumentType: "DSE_STOCK", payoutConfirmed: true, payoutAmount: 95_000 }));
    expect(p.netProfit).toBe(-5_000);
  });

  it("falls back to zero on garbage numbers instead of returning NaN", () => {
    const p = projectInvestment(entry({ principalAmount: -5, termMonths: NaN, expectedRatePct: Infinity }));
    expect(p.principal).toBe(0);
    expect(p.netProfit).toBe(0);
    expect(Number.isNaN(p.maturityValue)).toBe(false);
  });
});

describe("summarizePortfolio", () => {
  const entries = [
    entry({ id: "a" }), // FDR, 9,000 net, 109,000 at maturity
    entry({ id: "b", payoutConfirmed: true, payoutAmount: 108_000 }), // real 8,000
    entry({ id: "c", instrumentType: "DONATION", principalAmount: 50_000 }),
  ];

  it("totals real and projected profit, and leaves donations out", () => {
    const s = summarizePortfolio(entries);
    expect(s.count).toBe(2);
    expect(s.totalPrincipal).toBe(200_000);
    expect(s.totalNetProfit).toBe(17_000);
    expect(s.confirmedProfit).toBe(8_000);
    expect(s.projectedProfit).toBe(9_000);
    expect(s.totalMaturityValue).toBe(217_000);
    expect(s.projections).toHaveLength(3);
  });

  it("notes when some tax couldn't be modelled or a fund is market-linked", () => {
    expect(summarizePortfolio(entries).anyTaxNotModelled).toBe(false);
    expect(summarizePortfolio([entry({ instrumentType: "DPS" })]).anyTaxNotModelled).toBe(true);
    expect(summarizePortfolio([entry({ instrumentType: "MUTUAL_FUND" })]).anyMarketLinked).toBe(true);
  });

  it("is all zeros for an empty portfolio", () => {
    const s = summarizePortfolio([]);
    expect(s.count).toBe(0);
    expect(s.totalNetProfit).toBe(0);
    expect(s.totalMaturityValue).toBe(0);
  });
});

describe("consolidateWithReinvestment", () => {
  it("adds only the incremental reinvestment profit to the tracked profit", () => {
    // 108,000 paid out, reinvested to 118,000 after tax: +10,000 on top of the 17,000 already tracked.
    const c = consolidateWithReinvestment({ totalNetProfit: 17_000 }, { amount: 108_000, maturityValue: 118_000 });
    expect(c.trackedProfit).toBe(17_000);
    expect(c.reinvestProfit).toBe(10_000);
    expect(c.consolidatedProfit).toBe(27_000);
  });

  it("does not double count the payout being reinvested", () => {
    const c = consolidateWithReinvestment({ totalNetProfit: 0 }, { amount: 100_000, maturityValue: 100_000 });
    expect(c.consolidatedProfit).toBe(0);
  });
});
