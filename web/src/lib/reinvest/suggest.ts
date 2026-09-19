/**
 * Deterministic reinvestment-category scoring.
 *
 * Phase 5 ("AI reinvestment suggestions" in the README roadmap) was
 * originally deferred pending real cross-user usage data to ground
 * suggestion quality. That data still doesn't exist, so this module does
 * NOT use any aggregate/cross-user signal — it only reasons over the one
 * person's own already-computed numbers:
 *   - after-tax, inflation-adjusted returns per instrument category, from
 *     the same logic as /instruments (src/lib/instruments/instruments.ts)
 *   - their remaining tax-rebate headroom, from the same logic as the
 *     /calculator rebate optimizer (src/lib/tax/optimizer.ts)
 *   - a goal horizon (years until the money is needed) they enter directly
 *
 * It stays firmly on the math side of the "advice vs. math" line in
 * docs/product-notes.md: the output is a ranked list of instrument
 * *categories* (Sanchayapatra / Govt Bond / Bank FDR / Mutual Fund) with a
 * transparent, auditable score breakdown — never a specific bank or
 * product name, and never a "put your money here" verdict. Every number in
 * the reasoning strings is one already computed above; nothing is invented
 * or phrased by a model. See the module doc comment in
 * prisma/schema.prisma's ReinvestSuggestion for how a run gets logged.
 */

import {
  compareInstruments,
  INSTRUMENT_CATALOG,
  type InstrumentComparisonItem,
} from "@/lib/instruments/instruments";
import { calculateOptimizer } from "@/lib/tax/optimizer";
import { TAX_RULES } from "@/config/tax-rules-2025-26";
import type { TaxCalculationResult } from "@/lib/tax/types";

export type ReinvestCategoryId = "SANCHAYAPATRA" | "GOVT_BOND" | "BANK_DEPOSIT" | "MUTUAL_FUND";

export const REINVEST_CATEGORY_IDS: ReinvestCategoryId[] = [
  "SANCHAYAPATRA",
  "GOVT_BOND",
  "BANK_DEPOSIT",
  "MUTUAL_FUND",
];

export const REINVEST_CATEGORY_LABELS: Record<ReinvestCategoryId, { en: string; bn: string }> = {
  SANCHAYAPATRA: { en: "Sanchayapatra (Govt. Savings Certificate)", bn: "সঞ্চয়পত্র" },
  GOVT_BOND: { en: "Govt Treasury Bond / Sukuk", bn: "সরকারি ট্রেজারি বন্ড / সুকুক" },
  BANK_DEPOSIT: { en: "Bank Fixed Deposit (FDR)", bn: "ব্যাংক ফিক্সড ডিপোজিট (এফডিআর)" },
  MUTUAL_FUND: { en: "Mutual Fund", bn: "মিউচুয়াল ফান্ড" },
};

// This is a category-level, non-quantitative liquidity note — it restates
// the same `liquidityEn`/`liquidityBn` facts already shown per-instrument
// on /instruments, only used here to decide whether a short goal horizon
// should count against a category (see horizonFit below). It never
// contributes a number of its own.
const RELATIVELY_LIQUID_CATEGORIES: ReadonlySet<ReinvestCategoryId> = new Set(["BANK_DEPOSIT"]);

export interface ReinvestCategoryScore {
  category: ReinvestCategoryId;
  nameEn: string;
  nameBn: string;
  /** id of the INSTRUMENT_CATALOG entry this category's numbers are drawn from (its best net-yield option in this category) */
  representativeInstrumentId: string;
  nominalGrossRatePct: number;
  netRatePct: number;
  realYieldPct: number;
  totalMaturityValue: number;
  tdsPct: number;
  rebateEligible: boolean;
  /** how much of reinvestAmount would still count toward unused tax-rebate headroom this year */
  rebateEligibleAmount: number;
  estimatedTaxSaving: number;
  horizonFit: "under" | "good" | "over";
  minTermYears: number;
  maxTermYears: number;
  sovereignGuaranteed: boolean;
  depositInsuranceCovered: boolean;
  /** transparent, auditable score components — every value here is echoed in the reasoning strings */
  scoreBreakdown: {
    realYieldPoints: number;
    rebatePoints: number;
    horizonFitPoints: number;
    total: number;
  };
  reasonsEn: string[];
  reasonsBn: string[];
}

export interface ReinvestSuggestionResult {
  reinvestAmount: number;
  horizonYears: number;
  hasPSR: boolean;
  inflationPct: number;
  /** sorted descending by score; categories[0] is the suggested one to consider */
  categories: ReinvestCategoryScore[];
  topCategory: ReinvestCategoryId;
  hasTaxContext: boolean;
}

const REALYIELD_WEIGHT = 6; // points per 1% real (after-tax, after-inflation) annual yield
const REBATE_WEIGHT = 10; // points per 100% of reinvestAmount that would still earn a tax rebate
const HORIZON_FIT_BONUS = 8;
const HORIZON_MISMATCH_PENALTY_LOCKED = 6; // horizon shorter than the category's minimum term
const HORIZON_MISMATCH_PENALTY_LIQUID = 1; // same, but for a category that's realistically encashable anytime
const HORIZON_OVERSHOOT_PENALTY = 2; // horizon well beyond the category's typical max term (rollover risk, not a hard problem)

function clampAmount(amount: number): number {
  return Math.max(1_000, Number.isFinite(amount) ? amount : 100_000);
}

function clampHorizon(years: number): number {
  return Math.max(0.25, Math.min(30, Number.isFinite(years) ? years : 3));
}

function bestInCategory(
  items: InstrumentComparisonItem[],
  category: ReinvestCategoryId
): InstrumentComparisonItem {
  const inCategory = items.filter((i) => i.category === category);
  // compareInstruments already sorts by netRatePct desc, so [0] is the best
  // net-yield option in this category — but re-sort defensively since this
  // function shouldn't assume caller ordering.
  return [...inCategory].sort((a, b) => b.netRatePct - a.netRatePct)[0];
}

function termRangeFor(instrumentId: string): { minTermYears: number; maxTermYears: number } {
  const spec = INSTRUMENT_CATALOG.find((s) => s.id === instrumentId);
  return spec
    ? { minTermYears: spec.minTermYears, maxTermYears: spec.maxTermYears }
    : { minTermYears: 1, maxTermYears: 5 };
}

/**
 * Categories that count toward TAX_RULES.sharedGroupCap (Sanchayapatra +
 * Govt Bond + Mutual Fund, combined ৳5 lakh/year) — the same grouping
 * src/lib/tax/optimizer.ts's "sanchay_group" suggestion already uses. Bank
 * FDR is not a rebate-eligible investment under the Income Tax Act 2023's
 * Sixth Schedule instrument list (see TAX_RULES.instruments), so it never
 * gets a rebate bonus here.
 */
function isRebateEligible(category: ReinvestCategoryId): boolean {
  return category !== "BANK_DEPOSIT";
}

/**
 * Scores each instrument category for a given reinvestable amount, goal
 * horizon, and (optionally) tax situation. Pure function — no randomness,
 * no network/LLM calls, no aggregate data. Same inputs always produce the
 * same output, which is what lets a computed run be logged and shown again
 * unchanged later (see ReinvestSuggestion in prisma/schema.prisma).
 */
export function computeReinvestSuggestion(params: {
  reinvestAmount: number;
  horizonYears: number;
  hasPSR?: boolean;
  inflationPct?: number;
  taxResult?: TaxCalculationResult | null;
}): ReinvestSuggestionResult {
  const reinvestAmount = clampAmount(params.reinvestAmount);
  const horizonYears = clampHorizon(params.horizonYears);
  const hasPSR = params.hasPSR ?? true;
  const inflationPct = Math.max(0, Number.isFinite(params.inflationPct) ? params.inflationPct! : 8.5);

  // compareInstruments' tenureYears only affects the maturity-value
  // projection (compounding period), not the rate itself, and it's only
  // meaningfully modeled 1-20 years there.
  const tenureYears = Math.max(1, Math.min(20, Math.round(horizonYears)));
  const compared = compareInstruments({ amount: reinvestAmount, tenureYears, hasPSR, inflationPct });

  let optimizer: ReturnType<typeof calculateOptimizer> | null = null;
  if (params.taxResult) {
    optimizer = calculateOptimizer(params.taxResult);
  }
  // How much of a *new* investment would still fall inside the unused
  // "sanchay_group" (Sanchayapatra/Bond/MF) rebate headroom this year —
  // reuses the optimizer's own fill-order logic instead of recomputing it,
  // so this never disagrees with what /calculator already tells the person.
  const sanchayGroupHeadroom =
    optimizer?.suggestions.find((s) => s.instrumentId === "sanchay_group")?.investMore ?? 0;

  const categories: ReinvestCategoryScore[] = REINVEST_CATEGORY_IDS.map((category) => {
    const best = bestInCategory(compared, category);
    const { minTermYears, maxTermYears } = termRangeFor(best.id);
    const label = REINVEST_CATEGORY_LABELS[category];

    // --- Real (after-tax, after-inflation) yield ---
    const realYieldPoints = Math.round(best.realYieldPct * REALYIELD_WEIGHT * 10) / 10;

    // --- Tax-rebate headroom ---
    const rebateEligible = isRebateEligible(category);
    const rebateEligibleAmount = rebateEligible ? Math.min(reinvestAmount, sanchayGroupHeadroom) : 0;
    const rebateFraction = reinvestAmount > 0 ? rebateEligibleAmount / reinvestAmount : 0;
    const rebatePoints = Math.round(rebateFraction * REBATE_WEIGHT * 10) / 10;
    const estimatedTaxSaving = Math.round(rebateEligibleAmount * TAX_RULES.rebateRateOfInvestment);

    // --- Goal-horizon fit ---
    let horizonFit: "under" | "good" | "over";
    let horizonFitPoints: number;
    if (horizonYears < minTermYears) {
      horizonFit = "under";
      horizonFitPoints = -(
        RELATIVELY_LIQUID_CATEGORIES.has(category)
          ? HORIZON_MISMATCH_PENALTY_LIQUID
          : HORIZON_MISMATCH_PENALTY_LOCKED
      );
    } else if (horizonYears > maxTermYears * 2) {
      horizonFit = "over";
      horizonFitPoints = -HORIZON_OVERSHOOT_PENALTY;
    } else {
      horizonFit = "good";
      horizonFitPoints = HORIZON_FIT_BONUS;
    }

    const total = Math.round((realYieldPoints + rebatePoints + horizonFitPoints) * 10) / 10;

    const reasonsEn: string[] = [
      `After ${best.tdsPct}% source tax and ${inflationPct}% assumed inflation, this category's modeled real return is ${
        best.realYieldPct >= 0 ? "+" : ""
      }${best.realYieldPct}% a year (net rate ${best.netRatePct}% before inflation).`,
    ];
    const reasonsBn: string[] = [
      `${best.tdsPct}% উৎসে কর ও ধরে নেওয়া ${inflationPct}% মূল্যস্ফীতি বাদ দিয়ে এই ক্যাটাগরির প্রকৃত মুনাফা বছরে ${
        best.realYieldPct >= 0 ? "+" : ""
      }${best.realYieldPct}% (মূল্যস্ফীতির আগে নেট হার ${best.netRatePct}%)।`,
    ];

    if (rebateEligible && rebateEligibleAmount > 0) {
      reasonsEn.push(
        `Up to ৳${Math.round(rebateEligibleAmount).toLocaleString(
          "en-IN"
        )} of this would still count toward your unused tax-rebate room this year — an estimated ৳${estimatedTaxSaving.toLocaleString(
          "en-IN"
        )} off your tax, on top of the return itself.`
      );
      reasonsBn.push(
        `এর মধ্যে ৳${Math.round(rebateEligibleAmount).toLocaleString(
          "en-IN"
        )} পর্যন্ত এখনো অব্যবহৃত ট্যাক্স রেয়াতের সীমার মধ্যে পড়বে — আনুমানিক ৳${estimatedTaxSaving.toLocaleString(
          "en-IN"
        )} বাড়তি কর সাশ্রয়, শুধু মুনাফার বাইরেও।`
      );
    } else if (rebateEligible) {
      reasonsEn.push(
        "This category is normally rebate-eligible, but based on your tracked income/investments you've already used your rebate room this year, so no extra tax saving from that alone."
      );
      reasonsBn.push(
        "এই ক্যাটাগরি সাধারণত রেয়াতযোগ্য, কিন্তু আপনার ট্র্যাক করা আয়/বিনিয়োগ অনুযায়ী এই বছরের রেয়াতের সীমা আগেই পূরণ হয়ে গেছে, তাই এখান থেকে বাড়তি কর সাশ্রয় নেই।"
      );
    } else {
      reasonsEn.push(
        "Bank FDR interest isn't on the Income Tax Act's list of rebate-eligible investments, so this option is scored on after-tax return and liquidity only."
      );
      reasonsBn.push(
        "ব্যাংক এফডিআরের মুনাফা আয়কর আইনের রেয়াতযোগ্য বিনিয়োগের তালিকায় নেই, তাই এই অপশন শুধু ট্যাক্স-পরবর্তী মুনাফা ও তারল্যের ভিত্তিতে মূল্যায়ন করা হয়েছে।"
      );
    }

    if (horizonFit === "under") {
      reasonsEn.push(
        `Your ${horizonYears}-year horizon is shorter than this category's typical ${minTermYears}-year minimum term, so you may need to encash early${
          RELATIVELY_LIQUID_CATEGORIES.has(category) ? "" : ", likely at a reduced/penalty rate"
        }.`
      );
      reasonsBn.push(
        `আপনার ${horizonYears} বছরের সময়সীমা এই ক্যাটাগরির স্বাভাবিক ${minTermYears} বছরের ন্যূনতম মেয়াদের চেয়ে কম, তাই মেয়াদ শেষের আগেই ভাঙাতে হতে পারে${
          RELATIVELY_LIQUID_CATEGORIES.has(category) ? "" : ", সম্ভবত জরিমানাসহ কম হারে"
        }।`
      );
    } else if (horizonFit === "over") {
      reasonsEn.push(
        `Your ${horizonYears}-year horizon is well beyond this category's typical ${maxTermYears}-year term, so you'd likely reinvest more than once — future terms may carry a different rate than today's.`
      );
      reasonsBn.push(
        `আপনার ${horizonYears} বছরের সময়সীমা এই ক্যাটাগরির স্বাভাবিক ${maxTermYears} বছরের মেয়াদের চেয়ে অনেক বেশি, তাই একাধিকবার পুনঃবিনিয়োগ করতে হতে পারে — ভবিষ্যতের হার আজকের চেয়ে ভিন্ন হতে পারে।`
      );
    } else {
      reasonsEn.push(
        `Your ${horizonYears}-year horizon fits this category's typical ${minTermYears}-${maxTermYears}-year term without needing early encashment.`
      );
      reasonsBn.push(
        `আপনার ${horizonYears} বছরের সময়সীমা এই ক্যাটাগরির স্বাভাবিক ${minTermYears}-${maxTermYears} বছরের মেয়াদের সাথে মিলে যায়, আগেভাগে ভাঙানোর দরকার হবে না।`
      );
    }

    return {
      category,
      nameEn: label.en,
      nameBn: label.bn,
      representativeInstrumentId: best.id,
      nominalGrossRatePct: best.nominalGrossRatePct,
      netRatePct: best.netRatePct,
      realYieldPct: best.realYieldPct,
      totalMaturityValue: best.totalMaturityValue,
      tdsPct: best.tdsPct,
      rebateEligible,
      rebateEligibleAmount,
      estimatedTaxSaving,
      horizonFit,
      minTermYears,
      maxTermYears,
      sovereignGuaranteed: best.sovereignGuaranteed,
      depositInsuranceCovered: best.depositInsuranceCovered,
      scoreBreakdown: { realYieldPoints, rebatePoints, horizonFitPoints, total },
      reasonsEn,
      reasonsBn,
    };
  }).sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);

  return {
    reinvestAmount,
    horizonYears,
    hasPSR,
    inflationPct,
    categories,
    topCategory: categories[0].category,
    hasTaxContext: Boolean(params.taxResult),
  };
}
