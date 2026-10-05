/**
 * Money-habit engine: the small, repeating spends that never feel like a decision —
 * a ৳49 data top-up, a delivery order, a subscription nobody cancelled — priced at
 * what they actually cost over a month, a year, and a saving horizon.
 *
 * The reason this is a separate tool from `/tracker` is that the two track different
 * things. `/tracker` records discrete amounts: an income that arrived, a deposit that
 * matures on a date. A habit has no amount to record — it has a unit cost and a
 * frequency, and the number that matters is the product of the two, which is precisely
 * the number nobody computes in their head. ৳250 four times a week is ৳52,000 a year.
 *
 * Every nudge this module produces is arithmetic on figures the person typed:
 *
 *   - their own monthly cap, against their own spend (OVER_CAP / NEAR_CAP)
 *   - a bundle price they looked up themselves, against repeat top-ups (BUNDLE_CHEAPER)
 *   - what the same thing costs done themselves (SELF_SERVE_GAP)
 *   - how often they actually use a subscription they pay for (LOW_USE_SUBSCRIPTION)
 *
 * No nudge names a product, operator, restaurant or app, and none invents a price. The
 * cheaper alternative is always a number the person supplied — the tool does the
 * multiplication they skipped, it does not shop for them. That keeps this on the same
 * side of the advice-vs-math line as the rest of the app (docs/product-notes.md).
 */

export type HabitCategory =
  | "SUBSCRIPTION"
  | "MOBILE_DATA"
  | "FOOD_DELIVERY"
  | "RIDE_SHARING"
  | "DAILY_MICRO"
  | "CARD_SPEND";

export interface HabitCategoryDef {
  id: HabitCategory;
  titleEn: string;
  titleBn: string;
  icon: string;
  exampleEn: string;
  exampleBn: string;
  /** Noun for one occurrence, used in the per-entry copy. */
  unitEn: string;
  unitBn: string;
  defaultUnitCost: number;
  defaultTimesPerMonth: number;
  /** Which optional comparison field this category offers, if any. */
  comparison: "BUNDLE" | "SELF_SERVE" | "USAGE" | "NONE";
}

export const HABIT_CATEGORIES: Record<HabitCategory, HabitCategoryDef> = {
  SUBSCRIPTION: {
    id: "SUBSCRIPTION",
    titleEn: "Subscriptions",
    titleBn: "সাবস্ক্রিপশন",
    icon: "📺",
    exampleEn: "Streaming, music, cloud storage, news, gym, app renewals",
    exampleBn: "স্ট্রিমিং, গান, ক্লাউড স্টোরেজ, সংবাদ, জিম, অ্যাপ নবায়ন",
    unitEn: "charge",
    unitBn: "বিল",
    defaultUnitCost: 600,
    defaultTimesPerMonth: 1,
    comparison: "USAGE",
  },
  MOBILE_DATA: {
    id: "MOBILE_DATA",
    titleEn: "Mobile data & top-ups",
    titleBn: "মোবাইল ডেটা ও রিচার্জ",
    icon: "📱",
    exampleEn: "Small internet packs bought again and again through the month",
    exampleBn: "মাসজুড়ে বারবার কেনা ছোট ইন্টারনেট প্যাক",
    unitEn: "pack",
    unitBn: "প্যাক",
    defaultUnitCost: 49,
    defaultTimesPerMonth: 8,
    comparison: "BUNDLE",
  },
  FOOD_DELIVERY: {
    id: "FOOD_DELIVERY",
    titleEn: "Food delivery & eating out",
    titleBn: "ফুড ডেলিভারি ও বাইরে খাওয়া",
    icon: "🍔",
    exampleEn: "Delivery orders, office lunches, tea-stall and restaurant bills",
    exampleBn: "ডেলিভারি অর্ডার, অফিসের দুপুরের খাবার, চায়ের দোকান ও রেস্তোরাঁর বিল",
    unitEn: "order",
    unitBn: "অর্ডার",
    defaultUnitCost: 450,
    defaultTimesPerMonth: 10,
    comparison: "SELF_SERVE",
  },
  RIDE_SHARING: {
    id: "RIDE_SHARING",
    titleEn: "Ride sharing",
    titleBn: "রাইড শেয়ারিং",
    icon: "🛵",
    exampleEn: "Bike and car rides, especially the daily commute legs",
    exampleBn: "বাইক ও কারের রাইড, বিশেষ করে প্রতিদিনের যাতায়াত",
    unitEn: "ride",
    unitBn: "রাইড",
    defaultUnitCost: 180,
    defaultTimesPerMonth: 20,
    comparison: "SELF_SERVE",
  },
  DAILY_MICRO: {
    id: "DAILY_MICRO",
    titleEn: "Daily small spends",
    titleBn: "প্রতিদিনের খুচরা খরচ",
    icon: "🧋",
    exampleEn: "Cigarettes, tea, snacks, impulse buys — the ones never written down",
    exampleBn: "সিগারেট, চা, নাস্তা, হুট করে কেনা জিনিস — যেগুলো কখনো লেখা হয় না",
    unitEn: "spend",
    unitBn: "খরচ",
    defaultUnitCost: 120,
    defaultTimesPerMonth: 26,
    comparison: "NONE",
  },
  CARD_SPEND: {
    id: "CARD_SPEND",
    titleEn: "Credit card spending",
    titleBn: "ক্রেডিট কার্ডের খরচ",
    icon: "💳",
    exampleEn: "Card purchases paid back later, plus annual fees and late charges",
    exampleBn: "পরে পরিশোধ করা কার্ডের কেনাকাটা, বার্ষিক ফি ও বিলম্ব মাশুল",
    unitEn: "purchase",
    unitBn: "কেনাকাটা",
    defaultUnitCost: 2_500,
    defaultTimesPerMonth: 4,
    comparison: "NONE",
  },
};

export const HABIT_CATEGORY_IDS = Object.keys(HABIT_CATEGORIES) as HabitCategory[];

export interface HabitEntry {
  id: string;
  category: HabitCategory;
  label: string;
  /** Taka per occurrence. */
  unitCost: number;
  timesPerMonth: number;
  /** The person's own monthly ceiling for this habit. Zero means they have not set one. */
  monthlyCap: number;
  /** BUNDLE categories: price of one larger pack covering the whole month, if they looked it up. */
  bundleCost?: number;
  /** SELF_SERVE categories: what one occurrence costs done themselves (cooking, own vehicle, bus). */
  selfServeCost?: number;
  /** USAGE categories: how many times a month they actually use what they pay for. */
  usesPerMonth?: number;
}

export type NudgeCode =
  | "OVER_CAP"
  | "NEAR_CAP"
  | "BUNDLE_CHEAPER"
  | "SELF_SERVE_GAP"
  | "UNUSED_SUBSCRIPTION"
  | "LOW_USE_SUBSCRIPTION"
  | "CATEGORY_DOMINATES"
  | "INCOME_SHARE";

export type NudgeSeverity = "info" | "watch" | "alert";

export interface HabitNudge {
  code: NudgeCode;
  severity: NudgeSeverity;
  /** Set when the nudge is about one habit rather than the whole picture. */
  entryId?: string;
  category?: HabitCategory;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  /** Taka a month this nudge would free up. Zero for the ones that are only an observation. */
  monthlySaving: number;
}

export interface HabitEntryResult {
  entry: HabitEntry;
  monthlySpend: number;
  yearlySpend: number;
  /** Share of everything being tracked, in percent. */
  shareOfTrackedPct: number;
  /** Over the person's own cap, in taka a month. Zero when under it or no cap is set. */
  overCapBy: number;
  /** Cost of one actual use, for subscriptions where usage was entered. */
  costPerUse: number | null;
  nudges: HabitNudge[];
  /** The largest single saving available on this habit, never the sum of overlapping ones. */
  bestMonthlySaving: number;
}

export interface CategoryTotal {
  category: HabitCategory;
  monthlySpend: number;
  yearlySpend: number;
  pctOfTracked: number;
  entryCount: number;
}

export interface HabitSummary {
  entries: HabitEntryResult[];
  categoryTotals: CategoryTotal[];
  totalMonthly: number;
  totalYearly: number;
  /** Null when no income was entered — the share is not guessed. */
  shareOfIncomePct: number | null;
  /** Sum of the best saving per habit, so two nudges on one habit are never counted twice. */
  identifiedMonthlySaving: number;
  identifiedYearlySaving: number;
  /** The identified saving, invested monthly at the benchmark net rate. */
  opportunityHorizonYears: number;
  opportunityValue: number;
  /** Nudges about the whole picture rather than one habit. */
  portfolioNudges: HabitNudge[];
}

/**
 * Benchmark used for the "what this would have become" figure. Mirrors the Top Bank DPS
 * tier in src/lib/goals/goals.ts — 9.5% headline, 10% TDS — so a saving found here and a
 * goal planned there compound at the same rate instead of quietly disagreeing.
 */
export const BENCHMARK_HEADLINE_RATE_PCT = 9.5;
export const BENCHMARK_TDS_PCT = 10;
export const BENCHMARK_NET_RATE_PCT =
  (BENCHMARK_HEADLINE_RATE_PCT * (1 - BENCHMARK_TDS_PCT / 100));

function toCount(n: number | undefined, fallback = 0): number {
  if (n === undefined || !Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

function fmt(n: number): string {
  return "৳" + Math.round(n).toLocaleString("en-IN");
}

/** Future value of a monthly contribution at an annual net rate. */
export function futureValueOfMonthly(monthly: number, annualNetRatePct: number, years: number): number {
  const months = Math.round(years * 12);
  if (monthly <= 0 || months <= 0) return 0;
  const r = annualNetRatePct / 100 / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

function buildEntryNudges(
  entry: HabitEntry,
  monthlySpend: number,
  def: HabitCategoryDef
): HabitNudge[] {
  const nudges: HabitNudge[] = [];
  const cap = toCount(entry.monthlyCap);
  const times = toCount(entry.timesPerMonth);
  const unitCost = toCount(entry.unitCost);
  // An unnamed habit is referred to by its category, in whichever language the nudge is
  // being read — a starter entry should not read as English on a Bengali page.
  const trimmed = entry.label.trim();
  const name = trimmed || def.titleEn;
  const nameBn = trimmed || def.titleBn;

  if (cap > 0 && monthlySpend > cap) {
    const over = monthlySpend - cap;
    nudges.push({
      code: "OVER_CAP",
      severity: "alert",
      entryId: entry.id,
      category: entry.category,
      titleEn: `${name} is over the cap you set`,
      titleBn: `${nameBn} আপনার নির্ধারিত সীমা ছাড়িয়েছে`,
      bodyEn: `You capped this at ${fmt(cap)} a month and it is running at ${fmt(monthlySpend)} — ${fmt(over)} over. At this pace that is ${fmt(over * 12)} past your own limit over a year.`,
      bodyBn: `আপনি মাসে ${fmt(cap)} সীমা দিয়েছিলেন, খরচ হচ্ছে ${fmt(monthlySpend)} — ${fmt(over)} বেশি। এই হারে চললে বছরে আপনার নিজের সীমার চেয়ে ${fmt(over * 12)} বেশি খরচ হবে।`,
      monthlySaving: over,
    });
  } else if (cap > 0 && monthlySpend >= cap * 0.8) {
    nudges.push({
      code: "NEAR_CAP",
      severity: "watch",
      entryId: entry.id,
      category: entry.category,
      titleEn: `${name} is close to its cap`,
      titleBn: `${nameBn} সীমার কাছাকাছি`,
      bodyEn: `${fmt(monthlySpend)} of your ${fmt(cap)} cap is used. Roughly ${Math.max(0, Math.floor((cap - monthlySpend) / Math.max(1, unitCost)))} more ${def.unitEn}s fit before you pass it.`,
      bodyBn: `${fmt(cap)} সীমার মধ্যে ${fmt(monthlySpend)} খরচ হয়ে গেছে। সীমা ছাড়ানোর আগে আর প্রায় ${Math.max(0, Math.floor((cap - monthlySpend) / Math.max(1, unitCost)))}টি ${def.unitBn} বাকি।`,
      monthlySaving: 0,
    });
  }

  // A bundle only beats repeat top-ups once there are enough of them to compare.
  const bundle = toCount(entry.bundleCost);
  if (def.comparison === "BUNDLE" && bundle > 0 && times >= 2 && bundle < monthlySpend) {
    const saving = monthlySpend - bundle;
    nudges.push({
      code: "BUNDLE_CHEAPER",
      severity: "watch",
      entryId: entry.id,
      category: entry.category,
      titleEn: `Buying ${name} in one go is cheaper than ${times} top-ups`,
      titleBn: `${times} বার না কিনে একবারে কেনা সস্তা`,
      bodyEn: `${times} × ${fmt(unitCost)} comes to ${fmt(monthlySpend)} a month. The single pack you entered costs ${fmt(bundle)} — ${fmt(saving)} a month, ${fmt(saving * 12)} a year, for the same thing.`,
      bodyBn: `${times} × ${fmt(unitCost)} মানে মাসে ${fmt(monthlySpend)}। আপনার দেওয়া এক প্যাকের দাম ${fmt(bundle)} — একই জিনিসে মাসে ${fmt(saving)}, বছরে ${fmt(saving * 12)} সাশ্রয়।`,
      monthlySaving: saving,
    });
  }

  // Substituting half the occurrences, not all of them: the realistic version of the
  // change, and the one whose saving the person can actually keep.
  const selfServe = toCount(entry.selfServeCost, -1);
  if (def.comparison === "SELF_SERVE" && selfServe >= 0 && selfServe < unitCost && times >= 4) {
    const swapped = Math.floor(times / 2);
    const saving = swapped * (unitCost - selfServe);
    if (saving > 0) {
      nudges.push({
        code: "SELF_SERVE_GAP",
        severity: "watch",
        entryId: entry.id,
        category: entry.category,
        titleEn: `Half of ${name} done yourself frees ${fmt(saving)} a month`,
        titleBn: `${nameBn}-এর অর্ধেক নিজে করলে মাসে ${fmt(saving)} থাকে`,
        bodyEn: `Each one costs ${fmt(unitCost)} against ${fmt(selfServe)} done yourself. Swapping ${swapped} of ${times} keeps ${fmt(saving)} a month — ${fmt(saving * 12)} a year — without giving the habit up.`,
        bodyBn: `প্রতিবার খরচ ${fmt(unitCost)}, নিজে করলে ${fmt(selfServe)}। ${times}টির মধ্যে ${swapped}টি বদলালে অভ্যাস না ছেড়েই মাসে ${fmt(saving)} — বছরে ${fmt(saving * 12)} — থেকে যায়।`,
        monthlySaving: saving,
      });
    }
  }

  if (def.comparison === "USAGE" && entry.usesPerMonth !== undefined && Number.isFinite(entry.usesPerMonth) && monthlySpend > 0) {
    const uses = toCount(entry.usesPerMonth);
    if (uses === 0) {
      nudges.push({
        code: "UNUSED_SUBSCRIPTION",
        severity: "alert",
        entryId: entry.id,
        category: entry.category,
        titleEn: `${name} was not used at all this month`,
        titleBn: `${nameBn} এ মাসে একবারও ব্যবহার হয়নি`,
        bodyEn: `${fmt(monthlySpend)} a month is being charged for something you opened zero times. Over a year that is ${fmt(monthlySpend * 12)}.`,
        bodyBn: `যেটি একবারও খোলা হয়নি, তার জন্য মাসে ${fmt(monthlySpend)} কাটছে। বছরে এটি ${fmt(monthlySpend * 12)}।`,
        monthlySaving: monthlySpend,
      });
    } else if (uses <= 2) {
      const perUse = monthlySpend / uses;
      nudges.push({
        code: "LOW_USE_SUBSCRIPTION",
        severity: "watch",
        entryId: entry.id,
        category: entry.category,
        titleEn: `${name} works out to ${fmt(perUse)} per use`,
        titleBn: `${nameBn}-এ প্রতিবার ব্যবহারের খরচ ${fmt(perUse)}`,
        bodyEn: `${fmt(monthlySpend)} a month across ${uses} use${uses === 1 ? "" : "s"} is ${fmt(perUse)} each time. Worth deciding deliberately rather than letting it renew.`,
        bodyBn: `${uses} বার ব্যবহারের জন্য মাসে ${fmt(monthlySpend)} মানে প্রতিবার ${fmt(perUse)}। নিজে থেকে নবায়ন হতে দেওয়ার বদলে ভেবে সিদ্ধান্ত নেওয়াই ভালো।`,
        monthlySaving: monthlySpend,
      });
    }
  }

  return nudges;
}

export function summariseHabits({
  entries,
  monthlyIncome = 0,
  horizonYears = 5,
}: {
  entries: HabitEntry[];
  monthlyIncome?: number;
  horizonYears?: number;
}): HabitSummary {
  const safeEntries = (entries ?? []).filter((e) => HABIT_CATEGORIES[e.category]);
  const safeHorizon = Math.max(1, Math.min(40, Number.isFinite(horizonYears) ? horizonYears : 5));

  const spends = safeEntries.map((entry) => {
    const monthlySpend = Math.round(toCount(entry.unitCost) * toCount(entry.timesPerMonth));
    return { entry, monthlySpend };
  });

  const totalMonthly = spends.reduce((sum, s) => sum + s.monthlySpend, 0);

  const results: HabitEntryResult[] = spends.map(({ entry, monthlySpend }) => {
    const def = HABIT_CATEGORIES[entry.category];
    const nudges = buildEntryNudges(entry, monthlySpend, def);
    const cap = toCount(entry.monthlyCap);
    const uses = entry.usesPerMonth;

    return {
      entry,
      monthlySpend,
      yearlySpend: monthlySpend * 12,
      shareOfTrackedPct:
        totalMonthly > 0 ? Math.round((monthlySpend / totalMonthly) * 1000) / 10 : 0,
      overCapBy: cap > 0 ? Math.max(0, monthlySpend - cap) : 0,
      costPerUse:
        def.comparison === "USAGE" && uses !== undefined && Number.isFinite(uses) && uses > 0
          ? Math.round((monthlySpend / uses) * 100) / 100
          : null,
      nudges,
      // Two nudges on one habit usually describe the same taka from different angles,
      // so the headline saving takes the largest rather than adding them up.
      bestMonthlySaving: nudges.reduce((max, n) => Math.max(max, n.monthlySaving), 0),
    };
  });

  const categoryTotals: CategoryTotal[] = HABIT_CATEGORY_IDS.map((category) => {
    const inCategory = results.filter((r) => r.entry.category === category);
    const monthlySpend = inCategory.reduce((sum, r) => sum + r.monthlySpend, 0);
    return {
      category,
      monthlySpend,
      yearlySpend: monthlySpend * 12,
      pctOfTracked: totalMonthly > 0 ? Math.round((monthlySpend / totalMonthly) * 1000) / 10 : 0,
      entryCount: inCategory.length,
    };
  }).filter((c) => c.entryCount > 0);

  const portfolioNudges: HabitNudge[] = [];

  const dominant = [...categoryTotals].sort((a, b) => b.monthlySpend - a.monthlySpend)[0];
  if (dominant && categoryTotals.length > 1 && dominant.pctOfTracked >= 40) {
    const def = HABIT_CATEGORIES[dominant.category];
    portfolioNudges.push({
      code: "CATEGORY_DOMINATES",
      severity: "info",
      category: dominant.category,
      titleEn: `${def.titleEn} is ${dominant.pctOfTracked}% of everything you track`,
      titleBn: `আপনার ট্র্যাক করা খরচের ${dominant.pctOfTracked}% হলো ${def.titleBn}`,
      bodyEn: `${fmt(dominant.monthlySpend)} a month, ${fmt(dominant.yearlySpend)} a year. One change here moves more than cutting everything else at once.`,
      bodyBn: `মাসে ${fmt(dominant.monthlySpend)}, বছরে ${fmt(dominant.yearlySpend)}। বাকি সব একসাথে কমানোর চেয়ে এখানে একটি পরিবর্তনই বেশি কাজে দেবে।`,
      monthlySaving: 0,
    });
  }

  const shareOfIncomePct =
    monthlyIncome > 0 ? Math.round((totalMonthly / monthlyIncome) * 1000) / 10 : null;

  if (shareOfIncomePct !== null && shareOfIncomePct >= 15) {
    portfolioNudges.push({
      code: "INCOME_SHARE",
      severity: "alert",
      titleEn: `${shareOfIncomePct}% of your monthly income goes to these habits`,
      titleBn: `আপনার মাসিক আয়ের ${shareOfIncomePct}% যাচ্ছে এই অভ্যাসগুলোতে`,
      bodyEn: `${fmt(totalMonthly)} of ${fmt(monthlyIncome)} every month, on spending small enough that none of it felt like a decision.`,
      bodyBn: `প্রতি মাসে ${fmt(monthlyIncome)} আয়ের মধ্যে ${fmt(totalMonthly)} — এমন খরচে, যার কোনোটিই আলাদা করে সিদ্ধান্ত বলে মনে হয়নি।`,
      monthlySaving: 0,
    });
  }

  const identifiedMonthlySaving = results.reduce((sum, r) => sum + r.bestMonthlySaving, 0);

  return {
    entries: results,
    categoryTotals,
    totalMonthly,
    totalYearly: totalMonthly * 12,
    shareOfIncomePct,
    identifiedMonthlySaving,
    identifiedYearlySaving: identifiedMonthlySaving * 12,
    opportunityHorizonYears: safeHorizon,
    opportunityValue: Math.round(
      futureValueOfMonthly(identifiedMonthlySaving, BENCHMARK_NET_RATE_PCT, safeHorizon)
    ),
    portfolioNudges,
  };
}

/** A starter set so the tool opens with something recognisable rather than an empty form. */
export function defaultHabitEntries(): HabitEntry[] {
  return [
    {
      id: "h-data",
      category: "MOBILE_DATA",
      label: "",
      unitCost: 49,
      timesPerMonth: 8,
      monthlyCap: 0,
      bundleCost: 299,
    },
    {
      id: "h-food",
      category: "FOOD_DELIVERY",
      label: "",
      unitCost: 450,
      timesPerMonth: 10,
      monthlyCap: 3_000,
      selfServeCost: 120,
    },
    {
      id: "h-ride",
      category: "RIDE_SHARING",
      label: "",
      unitCost: 180,
      timesPerMonth: 20,
      monthlyCap: 0,
      selfServeCost: 40,
    },
    {
      id: "h-sub",
      category: "SUBSCRIPTION",
      label: "",
      unitCost: 600,
      timesPerMonth: 1,
      monthlyCap: 0,
      usesPerMonth: 2,
    },
  ];
}
