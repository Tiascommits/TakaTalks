/**
 * Comparative yield and after-tax return matrix for Bangladeshi savings and
 * investment instruments.
 *
 * Covers:
 * - National Savings Directorate (Sanchayapatra) tiered slab rates and caps
 * - Commercial Bank FDR with 10% (PSR) vs 15% (no PSR) TDS
 * - Bangladesh Govt Treasury Bonds & Sukuk (5% TDS)
 * - Bank DPS compounding
 * - Real inflation-adjusted purchasing power returns
 */

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
  // If tiered (e.g. Sanchayapatra), slabs specify rate up to amount
  tiers?: SanchayTier[];
  minTermYears: number;
  maxTermYears: number;
  individualCap: number | null;
  jointCap: number | null;
  tdsRatePct: (hasPSR: boolean, amount: number) => number;
  sovereignGuaranteed: boolean;
  depositInsuranceCovered: boolean;
  liquidityEn: string;
  liquidityBn: string;
  eligibilityEn: string;
  eligibilityBn: string;
}

export const INSTRUMENT_CATALOG: InstrumentSpec[] = [
  {
    id: "paribar-sanchaya",
    nameEn: "5-Year Paribar Sanchayapatra",
    nameBn: "৫-বছর মেয়াদী পরিবার সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.52,
    tiers: [
      { maxAmount: 1_500_000, ratePct: 11.52 },
      { maxAmount: 3_000_000, ratePct: 11.04 },
      { maxAmount: 4_500_000, ratePct: 10.56 },
    ],
    minTermYears: 1,
    maxTermYears: 5,
    individualCap: 4_500_000,
    jointCap: null, // Only individual for women 18+, disabled, or physical challenge
    tdsRatePct: (_hasPSR, amount) => (amount <= 500_000 ? 5 : 10),
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    liquidityEn: "Premature encashment permitted after 1 year with penalty slab.",
    liquidityBn: "১ বছর পর নির্দিষ্ট জরিমানা কেটে মেয়াদপূর্তির আগেই ভাঙানো যায়।",
    eligibilityEn: "Adult Bangladeshi women (18+), physically challenged, or senior citizens.",
    eligibilityBn: "১৮ বছর বা তদূর্ধ্ব যেকোনো বাংলাদেশি নারী, শারীরিক প্রতিবন্ধী বা সিনিয়র সিটিজেন।",
  },
  {
    id: "three-month-sanchaya",
    nameEn: "3-Month Profit Sanchayapatra",
    nameBn: "৩-মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.04,
    tiers: [
      { maxAmount: 1_500_000, ratePct: 11.04 },
      { maxAmount: 3_000_000, ratePct: 10.50 },
      { maxAmount: 5_000_000, ratePct: 9.97 },
    ],
    minTermYears: 1,
    maxTermYears: 3,
    individualCap: 3_000_000,
    jointCap: 6_000_000,
    tdsRatePct: (_hasPSR, amount) => (amount <= 500_000 ? 5 : 10),
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    liquidityEn: "Quarterly profit payout. Premature encashment allowed after 1 year.",
    liquidityBn: "প্রতি ৩ মাস অন্তর মুনাফা। ১ বছর পর মূলধন ভাঙানোর সুযোগ আছে।",
    eligibilityEn: "All adult Bangladeshi citizens (male, female, individual, or joint).",
    eligibilityBn: "সকল প্রাপ্তবয়স্ক বাংলাদেশি নাগরিক (একক বা যৌথ নামে)।",
  },
  {
    id: "pensioner-sanchaya",
    nameEn: "5-Year Pensioner Sanchayapatra",
    nameBn: "৫-বছর মেয়াদী পেনশনার সঞ্চয়পত্র",
    category: "SANCHAYAPATRA",
    baseRatePct: 11.76,
    tiers: [
      { maxAmount: 1_500_000, ratePct: 11.76 },
      { maxAmount: 3_000_000, ratePct: 11.28 },
      { maxAmount: 5_000_000, ratePct: 10.75 },
    ],
    minTermYears: 1,
    maxTermYears: 5,
    individualCap: 5_000_000,
    jointCap: null,
    tdsRatePct: (_hasPSR, amount) => (amount <= 500_000 ? 5 : 10),
    sovereignGuaranteed: true,
    depositInsuranceCovered: false,
    liquidityEn: "Quarterly profit. Encashable prematurely under rules.",
    liquidityBn: "প্রতি ৩ মাস পর পর মুনাফা। সরকারি নিয়ম মেনে ভাঙানো যায়।",
    eligibilityEn: "Retired government, semi-govt, autonomous, or military employees.",
    eligibilityBn: "অবসরপ্রাপ্ত সরকারি, আধা-সরকারি, স্বায়ত্তশাসিত ও সামরিক বাহিনীর কর্মকর্তা-কর্মচারী।",
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
    liquidityEn: "Surrenderable to Asset Management Company (AMC) at weekly NAV.",
    liquidityBn: "সাপ্তাহিক নেট অ্যাসেট ভ্যালু (NAV) অনুযায়ী ফান্ড ম্যানেজারের কাছে বিক্রয়যোগ্য।",
    eligibilityEn: "All Bangladeshi citizens and non-resident Bangladeshis (NRB).",
    eligibilityBn: "সকল বাংলাদেশি ও প্রবাসী বাংলাদেশি (NRB) নাগরিক।",
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
  liquidityEn: string;
  liquidityBn: string;
  eligibilityEn: string;
  eligibilityBn: string;
}

/**
 * Computes effective interest rate for tiered instruments like Sanchayapatra.
 */
function computeEffectiveRate(spec: InstrumentSpec, amount: number): number {
  if (!spec.tiers || spec.tiers.length === 0) {
    return spec.baseRatePct;
  }

  let remaining = amount;
  let totalInterest = 0;
  let prevCap = 0;

  for (const tier of spec.tiers) {
    if (remaining <= 0) break;
    const tierCapacity = tier.maxAmount - prevCap;
    const chunk = Math.min(remaining, tierCapacity);
    totalInterest += chunk * (tier.ratePct / 100);
    remaining -= chunk;
    prevCap = tier.maxAmount;
  }

  if (remaining > 0) {
    // Portion above highest tier
    const lastTier = spec.tiers[spec.tiers.length - 1];
    totalInterest += remaining * (lastTier.ratePct / 100);
  }

  return (totalInterest / amount) * 100;
}

/**
 * Evaluates all instruments for a given investment amount, horizon, and tax status.
 */
export function compareInstruments({
  amount,
  tenureYears = 3,
  hasPSR = true,
  inflationPct = 8.5,
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

    // Compound maturity for simple fixed deposits / bonds
    const netRateDecimal = netAnnualRate / 100;
    const totalMaturityValue = Math.round(
      safeAmount * Math.pow(1 + netRateDecimal, safeYears)
    );

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
      liquidityEn: spec.liquidityEn,
      liquidityBn: spec.liquidityBn,
      eligibilityEn: spec.eligibilityEn,
      eligibilityBn: spec.eligibilityBn,
    };
  }).sort((a, b) => b.netRatePct - a.netRatePct);
}
