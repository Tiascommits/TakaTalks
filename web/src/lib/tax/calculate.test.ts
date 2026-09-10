import { describe, expect, it } from "vitest";
import { TAX_RULES } from "@/config/tax-rules-2025-26";
import { calculateTax } from "./calculate";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "./types";

function input(overrides: Partial<TaxCalculatorInput>): TaxCalculatorInput {
  return { ...EMPTY_TAX_INPUT, ...overrides };
}

describe("calculateTax — empty / normal cases", () => {
  it("reports no income for a totally empty form", () => {
    const r = calculateTax(input({}));
    expect(r.hasAnyIncome).toBe(false);
    expect(r.netPayable).toBe(0);
    expect(r.grossTax).toBe(0);
  });

  it("computes a simple salary-only case under the tax-free limit", () => {
    // 30,000/month basic, nothing else => gross 360,000, exemption min(120000,500000)=120000
    // taxable salary 240,000, under 400,000 tax-free => zero tax
    const r = calculateTax(input({ basicMonthly: 30000 }));
    expect(r.grossSalary).toBe(360000);
    expect(r.taxableSalary).toBe(240000);
    expect(r.incomeAboveTaxFree).toBe(0);
    expect(r.baseSlabTax).toBe(0);
    expect(r.netPayable).toBe(0);
  });

  it("applies the first slab correctly just above the tax-free limit", () => {
    // general category tax-free 400,000. Push taxable salary to 400,000 + 50,000.
    // gross salary G such that G - min(G/3,500000) = 450000. For G <= 1,500,000, exemption = G/3.
    // G - G/3 = 450000 => (2/3)G = 450000 => G = 675000
    const r = calculateTax(input({ basicMonthly: 675000 / 12 }));
    expect(r.taxableSalary).toBeCloseTo(450000, 6);
    expect(r.incomeAboveTaxFree).toBeCloseTo(50000, 6);
    expect(r.baseSlabTax).toBeCloseTo(5000, 6); // 10% of 50,000
    expect(r.slabRows).toHaveLength(1);
    expect(r.slabRows[0].rate).toBe(0.1);
  });

  it("spreads a large income across every slab in order", () => {
    // slab-base income of 4,000,000 above tax-free (well past the top bracket)
    const r = calculateTax(input({ businessAnnual: 4000000 + 400000 }));
    // rows should be in slab order: 10/15/20/25/30
    const rates = r.slabRows.map((row) => row.rate);
    expect(rates).toEqual([0.1, 0.15, 0.2, 0.25, 0.3]);
    // manually verify the tax total
    const expectedTax =
      300000 * 0.1 + 400000 * 0.15 + 500000 * 0.2 + 2000000 * 0.25 + (4000000 - 3200000) * 0.3;
    expect(r.baseSlabTax).toBeCloseTo(expectedTax, 6);
  });
});

describe("calculateTax — taxpayer categories", () => {
  it.each([
    ["general", 400000],
    ["woman_senior", 450000],
    ["third_gender", 525000],
    ["disabled", 525000],
    ["freedom_fighter", 550000],
  ])("uses the correct tax-free limit for %s", (categoryId, expected) => {
    const r = calculateTax(input({ categoryId, businessAnnual: expected }));
    expect(r.taxFree).toBe(expected);
    expect(r.incomeAboveTaxFree).toBe(0);
  });

  it("falls back to the general limit for an unknown/garbage category id", () => {
    const r = calculateTax(input({ categoryId: "not-a-real-category" }));
    expect(r.taxFree).toBe(400000);
  });

  it("adds a tax-free allowance per disabled child", () => {
    const r = calculateTax(input({ disabledChildren: 3 }));
    expect(r.taxFree).toBe(400000 + 3 * 50000);
  });

  it("floors a fractional disabled-children count instead of crashing", () => {
    const r = calculateTax(input({ disabledChildren: 2.9 }));
    expect(r.taxFree).toBe(400000 + 2 * 50000);
  });
});

describe("calculateTax — capital gains", () => {
  it("exempts listed shares/fund gains up to the 50-lakh threshold", () => {
    const r = calculateTax(input({ cgSharesFund: 5000000 }));
    expect(r.sharesFundExempt).toBe(5000000);
    expect(r.sharesFundTaxable).toBe(0);
    expect(r.flatShareTax).toBe(0);
  });

  it("taxes only the portion of shares/fund gains above the 50-lakh threshold", () => {
    const r = calculateTax(input({ cgSharesFund: 5200000 }));
    expect(r.sharesFundTaxable).toBe(200000);
    expect(r.flatShareTax).toBeCloseTo(30000, 6); // 15% of 200,000
  });

  it("taxes an asset sold after 5 years at a flat 15% and keeps it out of the slab base", () => {
    const r = calculateTax(input({ cgAfter5Years: 1000000 }));
    expect(r.slabBase).toBe(0);
    expect(r.flatAfter5Tax).toBeCloseTo(150000, 6);
  });

  it("taxes gold/jewellery at a flat 5%", () => {
    const r = calculateTax(input({ cgGold: 1000000 }));
    expect(r.flatGoldTax).toBeCloseTo(50000, 6);
  });

  it("puts land-above-deed-value and within-5-year sales through the slab, not flat rate", () => {
    const r = calculateTax(input({ cgLand: 200000, cgWithin5Years: 300000 }));
    expect(r.slabBase).toBe(500000);
    expect(r.flatCGTax).toBe(0);
  });
});

describe("calculateTax — investment rebate", () => {
  it("caps sanchaypatra + bond + mutual fund at the shared 5-lakh group cap", () => {
    const r = calculateTax(
      input({ invSanchayAnnual: 300000, invBondAnnual: 300000, invMFAnnual: 300000, businessAnnual: 2000000 })
    );
    expect(r.sharedGroupRaw).toBe(900000);
    expect(r.sharedGroupCapped).toBe(500000);
  });

  it("caps DPS contributions at the annual cap regardless of monthly input", () => {
    const r = calculateTax(input({ invDPSMonthly: 50000, businessAnnual: 2000000 }));
    expect(r.dpsAnnual).toBe(600000);
    expect(r.dpsEligible).toBe(TAX_RULES.dpsCap);
  });

  it("takes the smallest of the three rebate ceilings — hard cap wins for very high income+investment", () => {
    // income high enough that 3% of income and 10% of investment both exceed the 7.5L cap
    const r = calculateTax(
      input({
        businessAnnual: 50000000, // 3% => 1,500,000
        invStockAnnual: 10000000, // 10% => 1,000,000
      })
    );
    expect(r.rebate).toBe(TAX_RULES.rebateCap);
  });

  it("rebate is bounded by 10% of investment when investment is the smallest constraint", () => {
    const r = calculateTax(input({ businessAnnual: 5000000, invStockAnnual: 100000 }));
    expect(r.rebate10pct).toBeCloseTo(10000, 6);
    expect(r.rebate).toBeCloseTo(10000, 6);
  });

  it("rebate is bounded by 3% of income when income is the smallest constraint", () => {
    const r = calculateTax(input({ businessAnnual: 500000, invStockAnnual: 5000000 }));
    expect(r.rebate3pct).toBeCloseTo(15000, 6);
    expect(r.rebate).toBeCloseTo(15000, 6);
  });

  it("gives zero rebate for zero investment even with taxable income", () => {
    const r = calculateTax(input({ businessAnnual: 1000000 }));
    expect(r.rebate).toBe(0);
  });
});

describe("calculateTax — minimum tax", () => {
  it("applies the regular minimum tax floor when rebate wipes out the computed tax", () => {
    // small taxable income above tax-free, fully offset by rebate => floor kicks in
    const r = calculateTax(input({ businessAnnual: 450000, invStockAnnual: 100000 }));
    expect(r.taxAfterRebate).toBe(TAX_RULES.minTaxRegular);
    expect(r.minApplied).toBe(true);
  });

  it("applies the reduced first-time-filer minimum tax", () => {
    const r = calculateTax(
      input({ businessAnnual: 450000, invStockAnnual: 100000, firstTimeFiler: true })
    );
    expect(r.taxAfterRebate).toBe(TAX_RULES.minTaxFirstTime);
  });

  it("never applies minimum tax when total income is below the tax-free limit", () => {
    const r = calculateTax(input({ businessAnnual: 100000 }));
    expect(r.minApplied).toBe(false);
    expect(r.taxAfterRebate).toBe(0);
  });
});

describe("calculateTax — net wealth surcharge (opt-in)", () => {
  it.each([
    [30000000, 0],
    [40000001, 0.1],
    [100000001, 0.2],
    [200000001, 0.3],
    [500000001, 0.35],
  ])("applies %i net wealth at surcharge rate %s", (wealth, expectedRate) => {
    const r = calculateTax(input({ businessAnnual: 1000000, netWealth: wealth }));
    expect(r.surchargeRate).toBe(expectedRate);
  });

  it("applies the 10% floor for multiple cars even with low net wealth", () => {
    const r = calculateTax(input({ businessAnnual: 1000000, multiCar: true }));
    expect(r.surchargeRate).toBe(0.1);
  });

  it("applies the 10% floor for a big city house even with low net wealth", () => {
    const r = calculateTax(input({ businessAnnual: 1000000, bigHouse: true }));
    expect(r.surchargeRate).toBe(0.1);
  });

  it("does not apply any surcharge when net wealth is zero and no flags are set", () => {
    const r = calculateTax(input({ businessAnnual: 1000000 }));
    expect(r.surchargeRate).toBe(0);
    expect(r.surchargeAmt).toBe(0);
  });
});

describe("calculateTax — AIT and refunds", () => {
  it("produces a negative net payable (refund) when AIT exceeds total liability", () => {
    const r = calculateTax(input({ businessAnnual: 1000000, aitPaid: 10000000 }));
    expect(r.netPayable).toBeLessThan(0);
  });

  it("nets AIT against liability exactly for an even match", () => {
    const r = calculateTax(input({ businessAnnual: 100000, aitPaid: 0 }));
    expect(r.netPayable).toBe(r.totalLiability);
  });
});

describe("calculateTax — weird / adversarial input", () => {
  it("clamps negative income fields to zero instead of producing negative tax", () => {
    const r = calculateTax(input({ businessAnnual: -1000000 }));
    expect(r.business).toBe(0);
    expect(r.slabBase).toBe(0);
    expect(r.grossTax).toBe(0);
    expect(r.netPayable).toBe(0);
  });

  it("clamps a negative AIT figure to zero rather than inflating net payable", () => {
    const r = calculateTax(input({ businessAnnual: 1000000, aitPaid: -50000 }));
    expect(r.netPayable).toBe(r.totalLiability);
  });

  it("clamps a negative disabled-children count to zero", () => {
    const r = calculateTax(input({ disabledChildren: -5 }));
    expect(r.taxFree).toBe(400000);
  });

  it("treats NaN-producing fields as zero (e.g. an emptied number input)", () => {
    const r = calculateTax(input({ businessAnnual: NaN, basicMonthly: NaN }));
    expect(r.hasAnyIncome).toBe(false);
    expect(Number.isNaN(r.netPayable)).toBe(false);
    expect(r.netPayable).toBe(0);
  });

  it("treats Infinity as invalid input rather than propagating Infinity through the ledger", () => {
    const r = calculateTax(input({ businessAnnual: Infinity }));
    expect(Number.isFinite(r.grossTax)).toBe(true);
    expect(Number.isFinite(r.netPayable)).toBe(true);
  });

  it("handles an extremely large but finite income without overflow or NaN", () => {
    const r = calculateTax(input({ businessAnnual: 1e12 }));
    expect(Number.isFinite(r.baseSlabTax)).toBe(true);
    expect(r.slabRows[r.slabRows.length - 1].rate).toBe(0.3);
  });

  it("never lets rebate exceed the smallest of its three ceilings even with absurd investment", () => {
    const r = calculateTax(input({ businessAnnual: 1000000, invStockAnnual: 1e9 }));
    expect(r.rebate).toBeLessThanOrEqual(TAX_RULES.rebateCap);
    expect(r.rebate).toBeLessThanOrEqual(r.rebate3pct);
  });

  it("handles every income field being simultaneously maxed out without crashing", () => {
    const kitchenSink = input({
      categoryId: "third_gender",
      disabledChildren: 4,
      firstTimeFiler: true,
      basicMonthly: 5000000,
      allowanceMonthly: 2000000,
      bonusAnnual: 10000000,
      employerPFMonthly: 500000,
      businessAnnual: 20000000,
      housePropertyAnnual: 5000000,
      otherIncomeAnnual: 3000000,
      cgSharesFund: 8000000,
      cgWithin5Years: 1000000,
      cgAfter5Years: 2000000,
      cgLand: 500000,
      cgGold: 300000,
      invSanchayAnnual: 200000,
      invBondAnnual: 200000,
      invMFAnnual: 200000,
      invStockAnnual: 500000,
      invLifeAnnual: 100000,
      invPFMonthly: 50000,
      invDPSMonthly: 20000,
      invDonationAnnual: 100000,
      aitPaid: 500000,
      netWealth: 600000000,
      multiCar: true,
      bigHouse: true,
    });
    const r = calculateTax(kitchenSink);
    expect(Number.isFinite(r.netPayable)).toBe(true);
    expect(r.surchargeRate).toBe(0.35);
    expect(r.rebate).toBeLessThanOrEqual(TAX_RULES.rebateCap);
  });
});
