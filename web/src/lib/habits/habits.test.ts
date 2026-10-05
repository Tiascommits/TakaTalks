import { describe, expect, it } from "vitest";
import {
  summariseHabits,
  defaultHabitEntries,
  futureValueOfMonthly,
  BENCHMARK_NET_RATE_PCT,
  HABIT_CATEGORIES,
  type HabitEntry,
} from "./habits";

function entry(over: Partial<HabitEntry> = {}): HabitEntry {
  return {
    id: "e1",
    category: "DAILY_MICRO",
    label: "Tea and snacks",
    unitCost: 100,
    timesPerMonth: 20,
    monthlyCap: 0,
    ...over,
  };
}

describe("habit totals", () => {
  it("multiplies unit cost by frequency, which is the sum nobody does in their head", () => {
    const summary = summariseHabits({ entries: [entry({ unitCost: 250, timesPerMonth: 16 })] });
    expect(summary.totalMonthly).toBe(4_000);
    expect(summary.totalYearly).toBe(48_000);
    expect(summary.entries[0].monthlySpend).toBe(4_000);
  });

  it("totals by category and reports each one's share", () => {
    const summary = summariseHabits({
      entries: [
        entry({ id: "a", category: "FOOD_DELIVERY", unitCost: 500, timesPerMonth: 12 }),
        entry({ id: "b", category: "RIDE_SHARING", unitCost: 100, timesPerMonth: 20 }),
      ],
    });
    expect(summary.totalMonthly).toBe(8_000);
    const food = summary.categoryTotals.find((c) => c.category === "FOOD_DELIVERY")!;
    expect(food.monthlySpend).toBe(6_000);
    expect(food.pctOfTracked).toBe(75);
    // Categories with nothing in them are left out rather than shown as zero rows.
    expect(summary.categoryTotals).toHaveLength(2);
  });

  it("leaves the income share null when no income was given, instead of guessing", () => {
    expect(summariseHabits({ entries: [entry()] }).shareOfIncomePct).toBeNull();
    expect(summariseHabits({ entries: [entry()], monthlyIncome: 40_000 }).shareOfIncomePct).toBe(5);
  });

  it("handles an empty tracker without dividing by zero", () => {
    const summary = summariseHabits({ entries: [] });
    expect(summary.totalMonthly).toBe(0);
    expect(summary.identifiedMonthlySaving).toBe(0);
    expect(summary.opportunityValue).toBe(0);
    expect(summary.categoryTotals).toHaveLength(0);
    expect(summary.portfolioNudges).toHaveLength(0);
  });
});

describe("cap nudges", () => {
  it("flags a habit over the person's own cap with the exact overshoot", () => {
    const summary = summariseHabits({
      entries: [entry({ unitCost: 300, timesPerMonth: 20, monthlyCap: 4_000 })],
    });
    const nudge = summary.entries[0].nudges.find((n) => n.code === "OVER_CAP")!;
    expect(nudge.severity).toBe("alert");
    expect(nudge.monthlySaving).toBe(2_000);
    expect(summary.entries[0].overCapBy).toBe(2_000);
  });

  it("warns at 80% of the cap but claims no saving for it", () => {
    const summary = summariseHabits({
      entries: [entry({ unitCost: 100, timesPerMonth: 17, monthlyCap: 2_000 })],
    });
    const codes = summary.entries[0].nudges.map((n) => n.code);
    expect(codes).toContain("NEAR_CAP");
    expect(codes).not.toContain("OVER_CAP");
    expect(summary.identifiedMonthlySaving).toBe(0);
  });

  it("stays quiet when no cap is set", () => {
    const summary = summariseHabits({ entries: [entry({ monthlyCap: 0 })] });
    expect(summary.entries[0].nudges).toHaveLength(0);
    expect(summary.entries[0].overCapBy).toBe(0);
  });
});

describe("comparison nudges", () => {
  it("prices repeat top-ups against the one bundle the person entered", () => {
    const summary = summariseHabits({
      entries: [
        entry({ category: "MOBILE_DATA", unitCost: 49, timesPerMonth: 8, bundleCost: 299 }),
      ],
    });
    const nudge = summary.entries[0].nudges.find((n) => n.code === "BUNDLE_CHEAPER")!;
    // 8 × 49 = 392 against a 299 bundle
    expect(nudge.monthlySaving).toBe(93);
    expect(nudge.bodyEn).toContain("299");
  });

  it("does not claim a bundle saving when the bundle is not actually cheaper", () => {
    const summary = summariseHabits({
      entries: [entry({ category: "MOBILE_DATA", unitCost: 49, timesPerMonth: 2, bundleCost: 299 })],
    });
    expect(summary.entries[0].nudges.find((n) => n.code === "BUNDLE_CHEAPER")).toBeUndefined();
  });

  it("offers the half-swap saving rather than assuming the habit is given up entirely", () => {
    const summary = summariseHabits({
      entries: [
        entry({ category: "FOOD_DELIVERY", unitCost: 450, timesPerMonth: 10, selfServeCost: 120 }),
      ],
    });
    const nudge = summary.entries[0].nudges.find((n) => n.code === "SELF_SERVE_GAP")!;
    // 5 of 10 orders swapped, at a 330 difference each
    expect(nudge.monthlySaving).toBe(1_650);
    expect(nudge.monthlySaving).toBeLessThan(summary.entries[0].monthlySpend);
  });

  it("ignores a self-serve cost that is not cheaper, or too few occurrences to split", () => {
    const dearer = summariseHabits({
      entries: [entry({ category: "RIDE_SHARING", unitCost: 100, timesPerMonth: 10, selfServeCost: 150 })],
    });
    expect(dearer.entries[0].nudges).toHaveLength(0);

    const rare = summariseHabits({
      entries: [entry({ category: "RIDE_SHARING", unitCost: 100, timesPerMonth: 3, selfServeCost: 10 })],
    });
    expect(rare.entries[0].nudges).toHaveLength(0);
  });

  it("prices a subscription per actual use and flags one that went unopened", () => {
    const lowUse = summariseHabits({
      entries: [entry({ category: "SUBSCRIPTION", unitCost: 600, timesPerMonth: 1, usesPerMonth: 2 })],
    });
    expect(lowUse.entries[0].costPerUse).toBe(300);
    expect(lowUse.entries[0].nudges[0].code).toBe("LOW_USE_SUBSCRIPTION");

    const unused = summariseHabits({
      entries: [entry({ category: "SUBSCRIPTION", unitCost: 600, timesPerMonth: 1, usesPerMonth: 0 })],
    });
    const nudge = unused.entries[0].nudges.find((n) => n.code === "UNUSED_SUBSCRIPTION")!;
    expect(nudge.severity).toBe("alert");
    expect(nudge.monthlySaving).toBe(600);
    expect(unused.entries[0].costPerUse).toBeNull();
  });

  it("only offers a comparison its category actually supports", () => {
    // A bundle price on a daily-micro habit is ignored: the category compares nothing.
    const summary = summariseHabits({
      entries: [entry({ category: "DAILY_MICRO", bundleCost: 10, selfServeCost: 1, usesPerMonth: 0 })],
    });
    expect(summary.entries[0].nudges).toHaveLength(0);
    expect(HABIT_CATEGORIES.DAILY_MICRO.comparison).toBe("NONE");
  });
});

describe("portfolio view", () => {
  it("counts the largest saving per habit once, never two overlapping ones twice", () => {
    // Both an over-cap and a bundle nudge fire on the same habit.
    const summary = summariseHabits({
      entries: [
        entry({ category: "MOBILE_DATA", unitCost: 49, timesPerMonth: 8, monthlyCap: 200, bundleCost: 299 }),
      ],
    });
    const codes = summary.entries[0].nudges.map((n) => n.code);
    expect(codes).toContain("OVER_CAP");
    expect(codes).toContain("BUNDLE_CHEAPER");
    // 192 over the cap vs 93 against the bundle — the larger one, not the 285 sum.
    expect(summary.entries[0].bestMonthlySaving).toBe(192);
    expect(summary.identifiedMonthlySaving).toBe(192);
  });

  it("names the category that dominates, only when there is something to compare it against", () => {
    const mixed = summariseHabits({
      entries: [
        entry({ id: "a", category: "FOOD_DELIVERY", unitCost: 500, timesPerMonth: 12 }),
        entry({ id: "b", category: "RIDE_SHARING", unitCost: 100, timesPerMonth: 5 }),
      ],
    });
    const dominant = mixed.portfolioNudges.find((n) => n.code === "CATEGORY_DOMINATES")!;
    expect(dominant.category).toBe("FOOD_DELIVERY");

    const single = summariseHabits({ entries: [entry({ category: "FOOD_DELIVERY" })] });
    expect(single.portfolioNudges.find((n) => n.code === "CATEGORY_DOMINATES")).toBeUndefined();
  });

  it("raises the income-share alert once the habits pass 15% of income", () => {
    const heavy = summariseHabits({
      entries: [entry({ unitCost: 500, timesPerMonth: 20 })],
      monthlyIncome: 50_000,
    });
    expect(heavy.shareOfIncomePct).toBe(20);
    expect(heavy.portfolioNudges.find((n) => n.code === "INCOME_SHARE")!.severity).toBe("alert");

    const light = summariseHabits({ entries: [entry()], monthlyIncome: 100_000 });
    expect(light.portfolioNudges.find((n) => n.code === "INCOME_SHARE")).toBeUndefined();
  });

  it("compounds the identified saving at the same net rate the goal planner uses", () => {
    const summary = summariseHabits({
      entries: [entry({ unitCost: 500, timesPerMonth: 20, monthlyCap: 5_000 })],
      horizonYears: 10,
    });
    expect(summary.identifiedMonthlySaving).toBe(5_000);
    expect(BENCHMARK_NET_RATE_PCT).toBeCloseTo(8.55, 5);
    expect(summary.opportunityValue).toBe(
      Math.round(futureValueOfMonthly(5_000, BENCHMARK_NET_RATE_PCT, 10))
    );
    // 5,000 a month for 10 years is 600,000 deposited; compounding must beat that.
    expect(summary.opportunityValue).toBeGreaterThan(600_000);
  });

  it("clamps an absurd horizon and survives broken numbers in an entry", () => {
    const summary = summariseHabits({
      entries: [
        entry({ unitCost: Number.NaN, timesPerMonth: -5, monthlyCap: Number.POSITIVE_INFINITY }),
        { ...entry({ id: "ghost" }), category: "NOT_A_CATEGORY" as never },
      ],
      horizonYears: 500,
    });
    expect(summary.opportunityHorizonYears).toBe(40);
    expect(summary.totalMonthly).toBe(0);
    // The unknown category is dropped rather than crashing the summary.
    expect(summary.entries).toHaveLength(1);
  });
});

describe("starter entries", () => {
  it("opens with habits that each belong to a known category", () => {
    const defaults = defaultHabitEntries();
    expect(defaults.length).toBeGreaterThan(0);
    for (const e of defaults) {
      expect(HABIT_CATEGORIES[e.category]).toBeDefined();
      expect(e.unitCost).toBeGreaterThan(0);
    }
    const summary = summariseHabits({ entries: defaults, monthlyIncome: 60_000 });
    expect(summary.totalMonthly).toBeGreaterThan(0);
    expect(summary.identifiedMonthlySaving).toBeGreaterThan(0);
  });

  it("refers to an unnamed habit by its category, in both languages", () => {
    const summary = summariseHabits({
      entries: [entry({ category: "SUBSCRIPTION", label: "  ", unitCost: 600, timesPerMonth: 1, usesPerMonth: 0 })],
    });
    const nudge = summary.entries[0].nudges[0];
    expect(nudge.titleEn).toContain(HABIT_CATEGORIES.SUBSCRIPTION.titleEn);
    expect(nudge.titleBn).toContain(HABIT_CATEGORIES.SUBSCRIPTION.titleBn);
    // A habit the person did name is used verbatim in both.
    const named = summariseHabits({
      entries: [entry({ category: "SUBSCRIPTION", label: "Gym", unitCost: 600, timesPerMonth: 1, usesPerMonth: 0 })],
    });
    expect(named.entries[0].nudges[0].titleEn).toContain("Gym");
    expect(named.entries[0].nudges[0].titleBn).toContain("Gym");
  });

  it("never names a shop, operator or app in the nudge copy", () => {
    const summary = summariseHabits({ entries: defaultHabitEntries(), monthlyIncome: 50_000 });
    const copy = JSON.stringify([...summary.entries.flatMap((e) => e.nudges), ...summary.portfolioNudges]);
    for (const brand of ["Netflix", "Foodpanda", "Pathao", "Uber", "Grameenphone", "Robi", "bKash"]) {
      expect(copy).not.toContain(brand);
    }
  });
});
