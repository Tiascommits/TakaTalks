import { DEFAULT_INFLATION_PCT } from "@/config/inflation";

/**
 * Comparative yield and after-tax return matrix for Bangladeshi savings and
 * investment instruments.
 *
 * Covers:
 * - National Savings Directorate (Sanchayapatra) rates by holding size, and caps
 * - Commercial Bank FDR with 10% (PSR) vs 15% (no PSR) TDS
 * - Bangladesh Govt Treasury Bonds & Sukuk (5% TDS)
 * - Bank DPS compounding
 * - Real inflation-adjusted purchasing power returns
 */

/** The rate for a total holding up to maxAmount. One rate covers the whole holding. */
export interface SanchayTier {
  maxAmount: number;
  ratePct: number;
}

export interface InstrumentSpec {
  id: string;
  nameEn: string;
  nameBn: string;
  category: "SANCHAYAPATRA" | "GOVT_BOND" | "BANK_DEPOSIT" | "MUTUAL_FUND";
  baseRatePct: number;
  // If tiered (e.g. Sanchayapatra), the holding's size picks one rate for all of it
  tiers?: SanchayTier[];
  minTermYears: number;
  maxTermYears: number;
  individualCap: number | null;
  jointCap: number | null;
  tdsRatePct: (hasPSR: boolean, amount: number) => number;
  sovereignGuaranteed: boolean;
  depositInsuranceCovered: boolean;
  compounds?: boolean;
  isMarketLinked?: boolean;
  liquidityEn: string;
  liquidityBn: string;
  eligibilityEn: string;
  eligibilityBn: string;
  /** Date the rate and source tax were last checked against `source` (YYYY-MM-DD). */
  asOf: string;
  source: string;
}

// Sanchayapatra rates for purchases from 1 Jul 2025, kept unchanged for Jul-Dec 2026; the
// lower rate applies once the total holding is above 7.5 lakh (Prothom Alo English and
// Bangla Tribune, 2 Jul 2026; Prothom Alo English and Dhaka Tribune, 4 Jan 2026).
// owner-confirm: no source says outright that the lower rate covers the whole holding rather
// than only the part above 7.5 lakh. Modelled as the whole holding, per the critique.
// shortcut: rates are the at-maturity rates; the year-by-year early-encashment ladder is not
// modelled. Upgrade when the matrix offers an "encash early" option.
const SANCHAYA_AS_OF = "2026-07-02";
const SANCHAYA_SOURCE =
  "National Savings Directorate rates from 1 Jul 2025, kept for Jul-Dec 2026 (Prothom Alo, Bangla Tribune, 2 Jul 2026)";
const SANCHAYA_TIER_SPLIT = 750_000;

// Source tax on Sanchayapatra profit: 5% when the total holding is up to 5 lakh, 10% above
// (NBR letter reported by Bangla Tribune, 3 Feb 2026; Prothom Alo, 5 Feb 2026). Pensioner
// profit is exempt for holdings up to 5 lakh (KPMG Bangladesh Tax 2026).
// owner-confirm: Dhaka Tribune (14 Jun 2026) and Bangla Tribune (19 Jul 2026) put the 5% band
// at up to 10 lakh, and from 1 Jul 2026 the Finance Act 2026 makes this an adjustable advance
// tax; whether the 5% band survives is not confirmed.
const sanchayaTds = (_hasPSR: boolean, amount: number) => (amount <= 500_000 ? 5 : 10);

export const INSTRUMENT_CATALOG: InstrumentSpec[] = [
  {
    id: "paribar-sanchaya",
    nameEn: "5-Year Paribar Sanchayapatra",
    nameBn: "৫-বছর মেয়াদী পরিবার সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.93,
    tiers: [
      { maxAmount: SANCHAYA_TIER_SPLIT, ratePct: 11.93 },
      { maxAmount: Infinity, ratePct: 11.8 },
    ],
    minTermYears: 1,
    maxTermYears: 5,
    // owner-confirm: 45 lakh per older guides; Prime Bank's FAQ (Apr 2025) says up to 1 crore
    // including other Sanchayapatra.
    individualCap: 4_500_000,
    jointCap: null, // Only individual for women 18+, disabled, or physical challenge
    tdsRatePct: sanchayaTds,
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    compounds: false,
    liquidityEn: "Premature encashment permitted after 1 year with penalty slab.",
    liquidityBn: "১ বছর পর নির্দিষ্ট জরিমানা কেটে মেয়াদপূর্তির আগেই ভাঙানো যায়।",
    eligibilityEn: "Adult Bangladeshi women (18+), physically challenged, or senior citizens.",
    eligibilityBn: "১৮ বছর বা তদূর্ধ্ব যেকোনো বাংলাদেশি নারী, শারীরিক প্রতিবন্ধী বা সিনিয়র সিটিজেন।",
    asOf: SANCHAYA_AS_OF,
    source: SANCHAYA_SOURCE,
  },
  {
    id: "bangladesh-sanchaya",
    nameEn: "5-Year Bangladesh Sanchayapatra",
    nameBn: "৫-বছর মেয়াদী বাংলাদেশ সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.83,
    tiers: [
      { maxAmount: SANCHAYA_TIER_SPLIT, ratePct: 11.83 },
      { maxAmount: Infinity, ratePct: 11.8 },
    ],
    minTermYears: 1,
    maxTermYears: 5,
    // 30 lakh single, 60 lakh joint (Prime Bank Sanchayapatra FAQ, Apr 2025; Daily Star guide).
    individualCap: 3_000_000,
    jointCap: 6_000_000,
    tdsRatePct: sanchayaTds,
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    compounds: false,
    liquidityEn: "Profit is paid with the principal at maturity. Early encashment after 1 year pays a lower rate.",
    liquidityBn: "মেয়াদ শেষে মূলধনের সাথে মুনাফা। ১ বছর পর আগেভাগে ভাঙালে কম হারে মুনাফা।",
    eligibilityEn: "Any adult Bangladeshi, in a single or joint name.",
    eligibilityBn: "যেকোনো প্রাপ্তবয়স্ক বাংলাদেশি, একক বা যৌথ নামে।",
    asOf: SANCHAYA_AS_OF,
    source: SANCHAYA_SOURCE,
  },
  {
    id: "three-month-sanchaya",
    nameEn: "3-Month Profit Sanchayapatra",
    nameBn: "৩-মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.82,
    tiers: [
      { maxAmount: SANCHAYA_TIER_SPLIT, ratePct: 11.82 },
      { maxAmount: Infinity, ratePct: 11.77 },
    ],
    minTermYears: 1,
    maxTermYears: 3,
    individualCap: 3_000_000,
    jointCap: 6_000_000,
    tdsRatePct: sanchayaTds,
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    compounds: false,
    liquidityEn: "Quarterly profit payout. Premature encashment allowed after 1 year.",
    liquidityBn: "প্রতি ৩ মাস অন্তর মুনাফা। ১ বছর পর মূলধন ভাঙানোর সুযোগ আছে।",
    eligibilityEn: "All adult Bangladeshi citizens (male, female, individual, or joint).",
    eligibilityBn: "সকল প্রাপ্তবয়স্ক বাংলাদেশি নাগরিক (একক বা যৌথ নামে)।",
    asOf: SANCHAYA_AS_OF,
    source: SANCHAYA_SOURCE,
  },
  {
    id: "pensioner-sanchaya",
    nameEn: "5-Year Pensioner Sanchayapatra",
    nameBn: "৫-বছর মেয়াদী পেনশনার সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.98,
    tiers: [
      { maxAmount: SANCHAYA_TIER_SPLIT, ratePct: 11.98 },
      { maxAmount: Infinity, ratePct: 11.8 },
    ],
    minTermYears: 1,
    maxTermYears: 5,
    individualCap: 5_000_000,
    jointCap: null,
    tdsRatePct: (hasPSR, amount) => (amount <= 500_000 ? 0 : sanchayaTds(hasPSR, amount)),
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    compounds: false,
    liquidityEn: "Quarterly profit. Encashable prematurely under rules.",
    liquidityBn: "প্রতি ৩ মাস পর পর মুনাফা। সরকারি নিয়ম মেনে ভাঙানো যায়।",
    eligibilityEn: "Retired government, semi-govt, autonomous, or military employees.",
    eligibilityBn: "অবসরপ্রাপ্ত সরকারি, আধা-সরকারি, স্বায়ত্তশাসিত ও সামরিক বাহিনীর কর্মকর্তা-কর্মচারী।",
    asOf: SANCHAYA_AS_OF,
    source: SANCHAYA_SOURCE,
  },
  {
    id: "treasury-bond-sukuk",
    nameEn: "Bangladesh Govt Treasury Bonds / Sukuk",
    nameBn: "বাংলাদেশ ব্যাংক ট্রেজারি বন্ড / সরকারি সুকুক",
    category: "GOVT_BOND",
    baseRatePct: 11.85,
    minTermYears: 2,
    maxTermYears: 20,
    individualCap: null, // No cap for individuals via primary auction or DSE
    jointCap: null,
    tdsRatePct: () => 5, // Statutory 5% source tax on G-Sec
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    liquidityEn: "Tradable on DSE secondary debt board or through scheduled bank.",
    liquidityBn: "ডিএসই ডেট বোর্ড বা তফসিলি ব্যাংকের মাধ্যমে সেকেন্ডারি মার্কেটে বিক্রয়যোগ্য।",
    eligibilityEn: "Any individual or institutional investor with a BPID account.",
    eligibilityBn: "বিপিআইডি (BPID) হিসাবধারী যেকোনো ব্যক্তি বা প্রাতিষ্ঠানিক বিনিয়োগকারী।",
    // owner-confirm: yield and the 5% source tax were set without a source on 2026-09-13.
    asOf: "2026-09-13",
    source: "Illustrative yield, not a quoted auction rate",
  },
  {
    id: "bank-fdr-top",
    nameEn: "Commercial Bank Fixed Deposit (FDR)",
    nameBn: "বাণিজ্যিক ব্যাংক ফিক্সড ডিপোজিট (এফডিআর)",
    category: "BANK_DEPOSIT",
    baseRatePct: 9.75,
    minTermYears: 1,
    maxTermYears: 5,
    individualCap: null,
    jointCap: null,
    tdsRatePct: (hasPSR) => (hasPSR ? 10 : 15),
    sovereignGuaranteed: false,
    depositInsuranceCovered: true, // Up to ৳2,00,000 per depositor
    liquidityEn: "High. Can be encashed anytime or used as collateral for overdraft loans.",
    liquidityBn: "উচ্চ। যেকোনো দিন ভাঙানো যায় অথবা ৯০% পর্যন্ত ওভারড্রাফট লোন নেওয়া যায়।",
    eligibilityEn: "Any individual, minor with guardian, or business entity.",
    eligibilityBn: "যেকোনো ব্যক্তি, অভিভাবকসহ নাবালক বা বাণিজ্যিক প্রতিষ্ঠান।",
    // owner-confirm: illustrative top-bank rate set without a source on 2026-09-13. The 10%/15%
    // source tax (15% without proof of return) matches the law per the 14 Oct 2026 critique.
    asOf: "2026-09-13",
    source: "Illustrative bank rate, not a quote; check /rates or your bank",
  },
  {
    id: "mutual-fund-unit",
    nameEn: "Open-End Shariah / Growth Mutual Fund",
    nameBn: "ওপেন-এন্ড শরীয়াহ / মিউচুয়াল ফান্ড",
    category: "MUTUAL_FUND",
    baseRatePct: 8.75,
    minTermYears: 1,
    maxTermYears: 10,
    individualCap: null,
    jointCap: null,
    tdsRatePct: (hasPSR) => (hasPSR ? 10 : 15),
    sovereignGuaranteed: false,
    depositInsuranceCovered: false,
    compounds: false,
    isMarketLinked: true,
    liquidityEn: "Indicative yield. Market-linked returns fluctuate with weekly NAV; no guaranteed yield.",
    liquidityBn: "প্রাক্কলিত আয়। বাজার-ভিত্তিক রিটার্ন (সাপ্তাহিক NAV ওঠানামার ঝুঁকি রয়েছে, সরকারি গ্যারান্টি নেই)।",
    eligibilityEn: "All Bangladeshi citizens and non-resident Bangladeshis (NRB).",
    eligibilityBn: "সকল বাংলাদেশি ও প্রবাসী বাংলাদেশি (NRB) নাগরিক।",
    // owner-confirm: illustrative yield set without a source on 2026-09-13.
    asOf: "2026-09-13",
    source: "Illustrative yield; mutual fund returns are not fixed",
  },
];

export interface InstrumentComparisonItem {
  id: string;
  nameEn: string;
  nameBn: string;
  category: string;
  nominalGrossRatePct: number;
  tdsPct: number;
  netRatePct: number;
  annualGrossProfit: number;
  annualTDSTax: number;
  annualNetProfit: number;
  totalMaturityValue: number;
  realPurchasingPowerAtMaturity: number;
  realYieldPct: number;
  exceedsCap: boolean;
  capNotice: string | null;
  sovereignGuaranteed: boolean;
  depositInsuranceCovered: boolean;
  compounds?: boolean;
  isMarketLinked?: boolean;
  liquidityEn: string;
  liquidityBn: string;
  eligibilityEn: string;
  eligibilityBn: string;
  asOf: string;
  source: string;
}

/**
 * Sanchayapatra rates go by the size of the whole holding: one rate for all
 * of it, not blended band by band like tax slabs.
 */
function computeEffectiveRate(spec: InstrumentSpec, amount: number): number {
  if (!spec.tiers || spec.tiers.length === 0) {
    return spec.baseRatePct;
  }
  return (spec.tiers.find((t) => amount <= t.maxAmount) ?? spec.tiers[spec.tiers.length - 1]).ratePct;
}

/**
 * Evaluates all instruments for a given investment amount, horizon, and tax status.
 */
export function compareInstruments({
  amount,
  tenureYears = 3,
  hasPSR = true,
  inflationPct = DEFAULT_INFLATION_PCT,
}: {
  amount: number;
  tenureYears?: number;
  hasPSR?: boolean;
  inflationPct?: number;
}): InstrumentComparisonItem[] {
  const safeAmount = Math.max(1_000, Number.isFinite(amount) ? amount : 100_000);
  const safeYears = Math.max(1, Math.min(20, tenureYears));
  const safeInflation = Math.max(0, inflationPct) / 100;

  return INSTRUMENT_CATALOG.map((spec) => {
    const effectiveGrossRate = computeEffectiveRate(spec, safeAmount);
    const tdsRate = spec.tdsRatePct(hasPSR, safeAmount);
    const netAnnualRate = effectiveGrossRate * (1 - tdsRate / 100);

    const annualGrossProfit = Math.round(safeAmount * (effectiveGrossRate / 100));
    const annualTDSTax = Math.round(annualGrossProfit * (tdsRate / 100));
    const annualNetProfit = annualGrossProfit - annualTDSTax;

    // Maturity calculation: Sanchayapatra pays periodic non-compounding profit;
    // Bank deposits and cumulative bonds compound annually.
    const netRateDecimal = netAnnualRate / 100;
    const isCompounding = spec.compounds !== false;
    const totalMaturityValue = isCompounding
      ? Math.round(safeAmount * Math.pow(1 + netRateDecimal, safeYears))
      : Math.round(safeAmount + annualNetProfit * safeYears);

    // Real purchasing power at maturity adjusted for inflation
    const realPurchasingPowerAtMaturity = Math.round(
      totalMaturityValue / Math.pow(1 + safeInflation, safeYears)
    );

    const realYieldPct =
      Math.round(
        (((1 + netRateDecimal) / (1 + safeInflation) - 1) * 100) * 10
      ) / 10;

    const exceedsCap =
      spec.individualCap !== null && safeAmount > spec.individualCap;

    const capNotice = exceedsCap
      ? `Investment exceeds individual statutory limit of ৳${(
          spec.individualCap! / 100_000
        ).toFixed(1)} Lakh.`
      : null;

    return {
      id: spec.id,
      nameEn: spec.nameEn,
      nameBn: spec.nameBn,
      category: spec.category,
      nominalGrossRatePct: Math.round(effectiveGrossRate * 100) / 100,
      tdsPct: tdsRate,
      netRatePct: Math.round(netAnnualRate * 100) / 100,
      annualGrossProfit,
      annualTDSTax,
      annualNetProfit,
      totalMaturityValue,
      realPurchasingPowerAtMaturity,
      realYieldPct,
      exceedsCap,
      capNotice,
      sovereignGuaranteed: spec.sovereignGuaranteed,
      depositInsuranceCovered: spec.depositInsuranceCovered,
      compounds: spec.compounds !== false,
      isMarketLinked: Boolean(spec.isMarketLinked),
      liquidityEn: spec.liquidityEn,
      liquidityBn: spec.liquidityBn,
      eligibilityEn: spec.eligibilityEn,
      eligibilityBn: spec.eligibilityBn,
      asOf: spec.asOf,
      source: spec.source,
    };
  }).sort((a, b) => b.netRatePct - a.netRatePct);
}
