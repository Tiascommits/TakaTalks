/**
 * Bangladesh income tax rules — Assessment Year 2025-26.
 * Source: NBR Paripatra 2025-26, Income Tax Act 2023, Finance Act summaries.
 *
 * Review this file every national budget (June/July) before the new fiscal year
 * begins. Do not hardcode any of these numbers into calculation logic — change
 * them here only.
 */

export type SlabRule = { amt: number; rate: number };
export type SurchargeThreshold = { above: number; rate: number };
export type InstrumentRule = {
  id: string;
  label: string;
  cap: number | null; // null = no individual cap modeled
  note: string;
};

export type TaxpayerCategory = {
  id: string;
  label: string;
  taxFreeLimit: number;
};

export const TAXPAYER_CATEGORIES: TaxpayerCategory[] = [
  { id: "general", label: "সাধারণ", taxFreeLimit: 400000 },
  { id: "woman_senior", label: "নারী / সিনিয়র সিটিজেন (৬৫+)", taxFreeLimit: 450000 },
  { id: "third_gender", label: "তৃতীয় লিঙ্গ", taxFreeLimit: 525000 },
  { id: "disabled", label: "প্রতিবন্ধী", taxFreeLimit: 525000 },
  { id: "freedom_fighter", label: "মুক্তিযোদ্ধা / জুলাই যোদ্ধা", taxFreeLimit: 550000 },
];

export const TAX_RULES = {
  sourceYear: "2025-26",

  slabs: [
    { amt: 300000, rate: 0.1 },
    { amt: 400000, rate: 0.15 },
    { amt: 500000, rate: 0.2 },
    { amt: 2000000, rate: 0.25 },
    { amt: Infinity, rate: 0.3 },
  ] satisfies SlabRule[],

  disabledChildTaxFreeAddOn: 50000,

  salaryExemptionFraction: 1 / 3,
  salaryExemptionCap: 500000,

  sharesFundExemption: 5000000, // 50 lakh, listed shares + fund units combined
  capitalGainsFlatRateAfter5Years: 0.15,
  capitalGainsFlatRateSharesFund: 0.15,
  capitalGainsFlatRateGold: 0.05,

  rebateCap: 750000,
  rebateRateOfIncome: 0.03,
  rebateRateOfInvestment: 0.1,
  sharedGroupCap: 500000, // sanchaypatra + govt bond + mutual fund, combined
  dpsCap: 120000, // per year

  minTaxFirstTime: 1000,
  minTaxRegular: 5000,

  surchargeThresholds: [
    { above: 500000000, rate: 0.35 },
    { above: 200000000, rate: 0.3 },
    { above: 100000000, rate: 0.2 },
    { above: 40000000, rate: 0.1 },
  ] satisfies SurchargeThreshold[],

  instruments: [
    {
      id: "sanchay_group",
      label: "সঞ্চয়পত্র / Govt Bond / Mutual Fund",
      cap: 500000,
      note: "shared cap ৳৫ লাখ",
    },
    { id: "stock", label: "DSE listed stock", cap: null, note: "no sub-cap modeled" },
    {
      id: "life",
      label: "জীবন বীমা প্রিমিয়াম",
      cap: null,
      note: "simplified (10%-of-sum-assured cap ignored)",
    },
    { id: "pf", label: "Provident Fund (নিজের অংশ)", cap: null, note: "annual" },
    { id: "dps", label: "DPS", cap: 120000, note: "max ৳১,২০,০০০/বছর" },
    { id: "donation", label: "দাতব্য প্রতিষ্ঠানে দান", cap: null, note: "approved charities" },
  ] satisfies InstrumentRule[],
};
