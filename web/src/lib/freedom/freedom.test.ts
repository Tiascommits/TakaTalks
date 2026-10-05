import { describe, expect, it } from "vitest";
import {
  calculateFreedomPlan,
  requiredCorpusAtAge,
  LIFESTYLE_PRESETS,
  type FreedomInput,
} from "./freedom";

const BASE: FreedomInput = {
  currentAge: 30,
  freedomAge: 45,
  planUntilAge: 80,
  monthlyExpenseToday: 60_000,
  lifestyle: "FULL_STOP",
  lightWorkIncomeToday: 0,
  inflationPct: 8.5,
  preFreedomReturnPct: 9,
  postFreedomReturnPct: 8,
  existingCorpus: 1_000_000,
  currentMonthlySaving: 30_000,
  passiveIncomes: [],
  essentialSharePct: 70,
  ventureAppetitePct: 0,
};

describe("freedom number", () => {
  it("inflates today's expense to the freedom age before sizing the corpus", () => {
    const plan = calculateFreedomPlan(BASE);
    // 60,000 * 1.085^15 ≈ 203,700/month by age 45
    expect(plan.requirement.monthlyExpense).toBeGreaterThan(195_000);
    expect(plan.requirement.monthlyExpense).toBeLessThan(215_000);
    expect(plan.requirement.monthlyNetNeed).toBe(plan.requirement.monthlyExpense);
    expect(plan.freedomNumber).toBeGreaterThan(plan.requirement.annualNetNeed * 20);
  });

  it("prices a negative real return as a corpus that can only deplete, never a perpetuity", () => {
    const losing = calculateFreedomPlan({ ...BASE, postFreedomReturnPct: 6, inflationPct: 9 });
    expect(losing.requirement.realReturnPct).toBeLessThan(0);
    expect(losing.requirement.perpetualCorpus).toBeNull();
    expect(losing.freedomNumber).toBeGreaterThan(0);

    const winning = calculateFreedomPlan({ ...BASE, postFreedomReturnPct: 11, inflationPct: 6 });
    expect(winning.requirement.perpetualCorpus).not.toBeNull();
    // Never touching the principal always costs more than letting it run out.
    expect(winning.requirement.perpetualCorpus!).toBeGreaterThan(winning.freedomNumber);
  });

  it("lets lifestyle choice move the number, cheapest for the village and dearest for travel", () => {
    const numberFor = (lifestyle: FreedomInput["lifestyle"]) =>
      calculateFreedomPlan({
        ...BASE,
        lifestyle,
        lightWorkIncomeToday: LIFESTYLE_PRESETS[lifestyle].defaultLightWorkIncome,
      }).freedomNumber;

    expect(numberFor("VILLAGE")).toBeLessThan(numberFor("HOME_CHILL"));
    expect(numberFor("HOME_CHILL")).toBeLessThan(numberFor("FULL_STOP"));
    expect(numberFor("FULL_STOP")).toBeLessThan(numberFor("TRAVEL"));
    // Light work earns part of the bill, so it needs less than stopping outright.
    expect(numberFor("LIGHT_WORK")).toBeLessThan(numberFor("FULL_STOP"));
  });

  it("only credits light-work income to the lifestyles that include it", () => {
    const stopped = requiredCorpusAtAge({ ...BASE, lifestyle: "FULL_STOP", lightWorkIncomeToday: 50_000 }, 45);
    expect(stopped.monthlyLightWorkIncome).toBe(0);

    const working = requiredCorpusAtAge({ ...BASE, lifestyle: "LIGHT_WORK", lightWorkIncomeToday: 50_000 }, 45);
    expect(working.monthlyLightWorkIncome).toBeGreaterThan(50_000);
  });

  it("subtracts existing passive income, and grows each source at its own rate", () => {
    const withRent = calculateFreedomPlan({
      ...BASE,
      passiveIncomes: [
        { id: "flat", label: "Flat rent", monthlyAmount: 25_000, growthPct: 8.5 },
        { id: "shop", label: "Shop rent", monthlyAmount: 15_000, growthPct: 5 },
      ],
    });
    const without = calculateFreedomPlan(BASE);

    expect(withRent.requirement.monthlyPassiveIncome).toBeGreaterThan(40_000);
    expect(withRent.requirement.monthlyNetNeed).toBeLessThan(without.requirement.monthlyNetNeed);
    expect(withRent.freedomNumber).toBeLessThan(without.freedomNumber);
  });

  it("drops the corpus to zero once passive income alone covers the whole bill", () => {
    const covered = calculateFreedomPlan({
      ...BASE,
      passiveIncomes: [{ id: "rents", label: "Rents", monthlyAmount: 300_000, growthPct: 8.5 }],
    });
    expect(covered.requirement.monthlyNetNeed).toBe(0);
    expect(covered.freedomNumber).toBe(0);
    expect(covered.requiredMonthlySaving).toBe(0);
    expect(covered.allocation).toHaveLength(0);
  });
});

describe("roadmap and pace", () => {
  it("derives the monthly saving that closes the gap and lands on the number", () => {
    const plan = calculateFreedomPlan(BASE);
    expect(plan.gap).toBe(plan.freedomNumber - plan.futureValueExistingCorpus);
    expect(plan.requiredMonthlySaving).toBeGreaterThan(0);

    const landing = plan.roadmap[plan.roadmap.length - 1];
    expect(landing.age).toBe(45);
    // Rounding the monthly up means it lands on or just above the target, never short.
    expect(landing.onTrackBalance).toBeGreaterThanOrEqual(plan.freedomNumber);
    expect(landing.onTrackBalance).toBeLessThan(plan.freedomNumber * 1.01);
  });

  it("builds one roadmap row per year with balances that only grow", () => {
    const plan = calculateFreedomPlan(BASE);
    expect(plan.roadmap).toHaveLength(15);
    for (let i = 1; i < plan.roadmap.length; i++) {
      expect(plan.roadmap[i].onTrackBalance).toBeGreaterThan(plan.roadmap[i - 1].onTrackBalance);
      expect(plan.roadmap[i].monthlyExpenseThatYear).toBeGreaterThan(
        plan.roadmap[i - 1].monthlyExpenseThatYear
      );
    }
    expect(plan.roadmap[plan.roadmap.length - 1].pctOfFreedomNumber).toBeGreaterThanOrEqual(100);
  });

  it("re-prices the freedom number at every candidate age when projecting the current pace", () => {
    const input = { ...BASE, currentMonthlySaving: 150_000 };
    const saver = calculateFreedomPlan(input);
    expect(saver.currentPaceFreedomAge).not.toBeNull();

    // The achievable age must clear the number computed for *that* age, and the year
    // before it must fall short — otherwise the search stopped at the wrong year.
    const age = saver.currentPaceFreedomAge!;
    const balanceAt = (a: number) =>
      calculateFreedomPlan({ ...input, freedomAge: a }).currentPaceBalanceAtFreedom;
    expect(balanceAt(age)).toBeGreaterThanOrEqual(requiredCorpusAtAge(input, age).drawdownCorpus);
    expect(balanceAt(age - 1)).toBeLessThan(requiredCorpusAtAge(input, age - 1).drawdownCorpus);
  });

  it("reports a pace that misses the chosen age as a shortfall, even when a later age works", () => {
    const input = { ...BASE, currentMonthlySaving: 150_000 };
    const saver = calculateFreedomPlan(input);
    // Freedom at 45 is not funded at this pace...
    expect(saver.currentPaceSurplus).toBeLessThan(0);
    expect(saver.currentPaceBalanceAtFreedom).toBeLessThan(saver.freedomNumber);
    // ...but waiting works, because a shorter freedom needs a smaller corpus even though
    // the monthly bill by then is larger.
    expect(saver.currentPaceFreedomAge!).toBeGreaterThan(BASE.freedomAge);
  });

  it("reports no reachable age when the saving pace cannot get there", () => {
    const stuck = calculateFreedomPlan({
      ...BASE,
      existingCorpus: 0,
      currentMonthlySaving: 500,
      monthlyExpenseToday: 200_000,
    });
    expect(stuck.currentPaceFreedomAge).toBeNull();
    expect(stuck.currentPaceSurplus).toBeLessThan(0);
  });

  it("reports a coast age only when the pace they actually save reaches the number", () => {
    // Saving far more than required: there is a year after which they could stop.
    const generous = calculateFreedomPlan({ ...BASE, currentMonthlySaving: 400_000 });
    expect(generous.coastAge).not.toBeNull();
    expect(generous.coastAge!).toBeGreaterThanOrEqual(BASE.currentAge);
    expect(generous.coastAge!).toBeLessThan(BASE.freedomAge);

    // Saving less than required: coasting is never an option, and saying otherwise
    // would be an artefact of measuring against the required amount instead.
    const modest = calculateFreedomPlan({ ...BASE, currentMonthlySaving: 30_000 });
    expect(modest.currentPaceSurplus).toBeLessThan(0);
    expect(modest.coastAge).toBeNull();
  });
});

describe("corpus allocation", () => {
  it("carves buffer and floor before the venture slice, and caps venture at a fifth", () => {
    const plan = calculateFreedomPlan({ ...BASE, ventureAppetitePct: 90 });
    const by = (role: string) => plan.allocation.find((s) => s.role === role);

    expect(by("LIQUID_BUFFER")!.amount).toBe(plan.requirement.monthlyNetNeed * 12);
    expect(by("INCOME_FLOOR")!.amount).toBeGreaterThan(0);

    const venture = by("VENTURE")!;
    expect(venture.pctOfCorpus).toBeLessThanOrEqual(20);
    // Even at a 90% appetite, the floor is funded first and cannot be raided.
    expect(venture.amount).toBeLessThanOrEqual(plan.freedomNumber - by("INCOME_FLOOR")!.amount);

    const total = plan.allocation.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(plan.freedomNumber);
  });

  it("leaves out the venture slice entirely when there is no appetite for it", () => {
    const plan = calculateFreedomPlan(BASE);
    expect(plan.allocation.find((s) => s.role === "VENTURE")).toBeUndefined();
    expect(plan.allocation.reduce((sum, s) => sum + s.amount, 0)).toBe(plan.freedomNumber);
  });

  it("never names a bank, fund or product in the allocation copy", () => {
    const plan = calculateFreedomPlan({ ...BASE, ventureAppetitePct: 10 });
    const copy = JSON.stringify(plan.allocation);
    for (const name of ["BRAC", "City Bank", "DBH", "IDLC", "Sonali", "Islami", "Dutch"]) {
      expect(copy).not.toContain(name);
    }
  });
});

describe("input clamping", () => {
  it("survives zero, inverted and absurd inputs without producing NaN", () => {
    const plan = calculateFreedomPlan({
      ...BASE,
      currentAge: 0,
      freedomAge: 0,
      planUntilAge: 0,
      monthlyExpenseToday: 0,
      inflationPct: -5,
      preFreedomReturnPct: 999,
      existingCorpus: -100,
      currentMonthlySaving: Number.NaN,
    });

    expect(Number.isFinite(plan.freedomNumber)).toBe(true);
    expect(plan.yearsToFreedom).toBeGreaterThan(0);
    expect(plan.yearsInFreedom).toBeGreaterThan(0);
    expect(plan.roadmap.every((r) => Number.isFinite(r.onTrackBalance))).toBe(true);
  });

  it("keeps the freedom age after today and the plan horizon after the freedom age", () => {
    const inverted = calculateFreedomPlan({ ...BASE, currentAge: 50, freedomAge: 35, planUntilAge: 20 });
    expect(inverted.yearsToFreedom).toBeGreaterThanOrEqual(1);
    expect(inverted.yearsInFreedom).toBeGreaterThanOrEqual(1);
  });

  it("handles a very long freedom with huge numbers", () => {
    const long = calculateFreedomPlan({
      ...BASE,
      currentAge: 25,
      freedomAge: 40,
      planUntilAge: 105,
      monthlyExpenseToday: 500_000,
      inflationPct: 12,
    });
    expect(Number.isFinite(long.freedomNumber)).toBe(true);
    expect(Number.isFinite(long.requiredMonthlySaving)).toBe(true);
    expect(long.roadmap).toHaveLength(15);
  });
});
