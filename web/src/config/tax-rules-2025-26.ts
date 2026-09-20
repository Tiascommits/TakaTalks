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
  labelEn: string;
  taxFreeLimit: number;
};

export type TaxLocation = "dhaka_ctg" | "other_city" | "non_city";

export const MIN_TAX_BY_LOCATION: Record<TaxLocation, number> = {
  dhaka_ctg: 5000,
  other_city: 4000,
  non_city: 3000,
};

export const TAXPAYER_CATEGORIES: TaxpayerCategory[] = [
  { id: "general", label: "সাধারণ", labelEn: "General", taxFreeLimit: 400000 },
  {
    id: "woman_senior",
    label: "নারী / সিনিয়র সিটিজেন (৬৫+)",
    labelEn: "Woman / Senior citizen (65+)",
    taxFreeLimit: 450000,
  },
  { id: "third_gender", label: "তৃতীয় লিঙ্গ", labelEn: "Third gender", taxFreeLimit: 525000 },
  { id: "disabled", label: "প্রতিবন্ধী", labelEn: "Person with disability", taxFreeLimit: 525000 },
  {
    id: "freedom_fighter",
    label: "মুক্তিযোদ্ধা / জুলাই যোদ্ধা",
    labelEn: "Freedom fighter / July fighter",
    taxFreeLimit: 550000,
  },
];

export const TAX_RULES = {
  sourceYear: "2025-26",

  slabs: [
    { amt: 100000, rate: 0.05 },
    { amt: 300000, rate: 0.1 },
    { amt: 400000, rate: 0.15 },
    { amt: 500000, rate: 0.2 },
    { amt: 2000000, rate: 0.25 },
    { amt: Infinity, rate: 0.3 },
  ] satisfies SlabRule[],

  disabledChildTaxFreeAddOn: 50000,

  salaryExemptionFraction: 1 / 3,
  salaryExemptionCap: 450000,

  sharesFundExemption: 5000000, // 50 lakh, listed shares + fund units combined
  capitalGainsFlatRateAfter5Years: 0.15,
  capitalGainsFlatRateSharesFund: 0.15,
  capitalGainsFlatRateGold: 0.05,

  rebateCap: 750000,
  rebateRateOfIncome: 0.03,
  rebateRateOfInvestment: 0.1,
  sharedGroupCap: 500000, // sanchaypatra + govt bond + mutual fund, combined
  dpsCap: 120000, // per year

  minTaxByLocation: MIN_TAX_BY_LOCATION,
  minTaxFirstTime: 1000,
  minTaxRegular: 5000,

  // Freelance / IT-enabled export-service income: confirmed 2026-09-16
  // against the primary source — the Income Tax Act 2023, SIXTH SCHEDULE,
  // PART I ("Exclusion from the computation of total income"), paragraph
  // (21), as substituted by the Finance Act 2024 (Act No. V of 2024).
  // Taken from NBR's own authentic English text of the Act (Bangladesh
  // Gazette, Extraordinary, 16 October 2025):
  // https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf
  //
  // It excludes from total income — i.e. a 100% exemption, not a
  // concessional rate — "[a]ny income derived from the following business
  // of a person being a resident or a non-resident Bangladeshi individual
  // for the period from July 1, 2024 to June 30, 2027", listing 19
  // businesses at (a)-(s), of which (q) is "IT Freelancing" and the rest
  // are the software/ITES categories in ITES_CATEGORIES (src/lib/freelance).
  //
  // The paragraph carries one statutory proviso, which is why the
  // exemption is gated on an explicit opt-in (freelanceBankTransferCompliant)
  // and never assumed: "Provided that all income, expenditure and
  // investment of the business shall be performed wholly through bank
  // transfer from July 1, 2024".
  //
  // NOTE the end date: this exemption lapses for income earned after
  // 30 June 2027 unless extended again, so a future tax-year config must
  // not copy `true` forward without re-checking the Schedule.
  freelanceConcessionalRuleConfirmed: true,
  freelanceExemptionFraction: 1,
  freelanceExemptionEnds: "2027-06-30",

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
