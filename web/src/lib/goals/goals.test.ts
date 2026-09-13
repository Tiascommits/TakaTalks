import { describe, expect, it } from "vitest";
import { calculateGoalPlan, GOAL_PRESETS } from "./goals";

describe("Life Goal & Financial Freedom calculations", () => {
  it("calculates inflation-adjusted future cost for an apartment downpayment", () => {
    const result = calculateGoalPlan({
      category: "FLAT_DOWNPAYMENT",
      presentCost: 3_000_000,
      targetYears: 5,
      inflationPct: 8.5,
      existingSavings: 500_000,
    });

    // 3,000,000 * (1.085)^5 ≈ 4,511,047
    expect(result.futureNominalCost).toBeGreaterThan(4_500_000);
    expect(result.futureNominalCost).toBeLessThan(4_550_000);

    // Existing savings should grow over 5 years
    expect(result.futureValueExistingSavings).toBeGreaterThan(500_000);
    expect(result.shortfall).toBe(result.futureNominalCost - result.futureValueExistingSavings);

    // Yield tiers must exist and be ranked correctly
    expect(result.yieldTiers).toHaveLength(4);
    const sukuk = result.yieldTiers.find((t) => t.id === "gov-sukuk");
    const savings = result.yieldTiers.find((t) => t.id === "savings-account");
    expect(sukuk).toBeDefined();
    expect(savings).toBeDefined();
    expect(sukuk!.netRatePct).toBeGreaterThan(savings!.netRatePct);
    // Higher yield requires less monthly DPS
    expect(sukuk!.monthlyDPSRequired).toBeLessThan(savings!.monthlyDPSRequired);
  });

  it("calculates lazy money loss correctly", () => {
    const result = calculateGoalPlan({
      presentCost: 1_000_000,
      targetYears: 10,
      inflationPct: 9.0,
    });

    // In 10 years at 9% inflation vs 2.975% savings net yield, purchasing power drops drastically
    expect(result.lazyMoneyPurchasingPowerLoss).toBeGreaterThan(400_000);
    expect(result.lazyMoneyPurchasingPowerLoss).toBeLessThan(result.presentCost);
  });

  it("handles zero or boundary inputs without crashing", () => {
    const zeroResult = calculateGoalPlan({
      presentCost: 0,
      targetYears: 0,
      inflationPct: 0,
      existingSavings: 0,
    });
    expect(zeroResult.futureNominalCost).toBe(0);
    expect(zeroResult.targetYears).toBe(1); // Min clamp
    expect(zeroResult.timeline).toHaveLength(1);

    const hugeResult = calculateGoalPlan({
      presentCost: 100_000_000,
      targetYears: 30,
      inflationPct: 15,
      existingSavings: 10_000_000,
    });
    expect(Number.isFinite(hugeResult.futureNominalCost)).toBe(true);
    expect(hugeResult.timeline).toHaveLength(30);
  });

  it("timeline milestones show monotonically increasing balance and interest", () => {
    const result = calculateGoalPlan({
      presentCost: 2_000_000,
      targetYears: 4,
      inflationPct: 8.0,
      existingSavings: 100_000,
    });

    expect(result.timeline).toHaveLength(4);
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i].accumulatedBalance).toBeGreaterThan(result.timeline[i - 1].accumulatedBalance);
      expect(result.timeline[i].totalInterest).toBeGreaterThan(result.timeline[i - 1].totalInterest);
    }
  });

  it("includes all predefined presets with bilingual titles", () => {
    expect(Object.keys(GOAL_PRESETS)).toContain("EMERGENCY_FUND");
    expect(Object.keys(GOAL_PRESETS)).toContain("RETIREMENT_FIRE");
    expect(GOAL_PRESETS.CAR_PURCHASE.titleBn).toBeTruthy();
    expect(GOAL_PRESETS.CAR_PURCHASE.titleEn).toBeTruthy();
  });
});
