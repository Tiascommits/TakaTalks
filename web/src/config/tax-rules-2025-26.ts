/**
 * Bangladesh income tax rules for income year 2025-26 (1 Jul 2025 - 30 Jun 2026),
 * assessment year 2026-27: Income Tax Act 2023 as amended by the Finance
 * Ordinance 2025 and the Finance Act 2026 (passed 29 Jun 2026).
 *
 * Every value cites its source; all were read on 2026-10-15. The gazette text
 * was not reachable, so the citations are Big-4 guides cross-checked with a
 * second source:
 *   [KPMG26]  KPMG Bangladesh, "Bangladesh Tax 2026", 15 Jul 2026, page noted.
 *             https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Tax/Bangladesh_Tax_2026.pdf
 *   [KPMGFO]  KPMG, "Salient features of Finance Ordinance 2025", Jun 2025.
 *   [PWC]     PwC Worldwide Tax Summaries, Bangladesh individual, reviewed 31 Jul 2026.
 *             https://taxsummaries.pwc.com/bangladesh/individual
 *
 * Review this file every national budget (June/July) before the new fiscal year
 * begins. Do not hardcode any of these numbers into calculation logic — change
 * them here only, and add a worked-example test (src/lib/tax/worked-examples.test.ts).
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

// Tax-free thresholds for AY 2026-27: [KPMG26] p46; [PWC]; bdnews24 and UNB, 29 Jun 2026
// (general 4 lakh); Daily Star Bangla, 2 Jul 2026 (war-wounded and July fighters 5.5 lakh).
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
    // Gazetted war-wounded freedom fighters only, not every freedom fighter [KPMG26] p46.
    id: "freedom_fighter",
    label: "গেজেটভুক্ত যুদ্ধাহত মুক্তিযোদ্ধা / জুলাই যোদ্ধা",
    labelEn: "Gazetted war-wounded freedom fighter / July fighter",
    taxFreeLimit: 550000,
  },
];

export const TAX_RULES = {
  // Returns being filed now cover income earned 1 Jul 2025 - 30 Jun 2026.
  incomeYear: "2025-26",
  assessmentYear: "2026-27",
  yearLabel: {
    en: "Income year 2025-26 (assessment year 2026-27)",
    bn: "আয়বর্ষ ২০২৫-২৬ (করবর্ষ ২০২৬-২৭)",
  },

  // Bands above the threshold, AY 2026-27 and 2027-28; the old 5% band is gone:
  // [KPMG26] p46 table "AY 2026/27 and AY 2027/28"; [KPMGFO]; bdnews24, 29 Jun 2026.
  slabs: [
    { amt: 300000, rate: 0.1 },
    { amt: 400000, rate: 0.15 },
    { amt: 500000, rate: 0.2 },
    { amt: 2000000, rate: 0.25 },
    { amt: Infinity, rate: 0.3 },
  ] satisfies SlabRule[],

  // Parent or legal guardian of a person with disability: +50,000 [KPMG26] p46.
  // owner-confirm: KPMG says "(maximum one)" parent; whether it is per disabled child
  // or once per parent is not confirmed by a second source. Kept per child.
  disabledChildTaxFreeAddOn: 50000,

  // Lower of 1/3 of salary income or 5 lakh: [KPMG26] p45; [PWC].
  salaryExemptionFraction: 1 / 3,
  salaryExemptionCap: 500000,

  // Listed shares + fund units: gains up to 50 lakh exempt, 15% above [KPMG26] p49; [PWC].
  sharesFundExemption: 5000000,
  capitalGainsFlatRateSharesFund: 0.15,
  // Other assets held over 5 years: 15% [KPMG26] p52; [PWC].
  capitalGainsFlatRateAfter5Years: 0.15,
  // Gold, silver, diamonds and coins: 5% [KPMG26] p52.
  // owner-confirm: Daily Star and Ittefaq (14-15 Jun 2026) reported a 15% budget proposal;
  // no source confirms what the passed Act says.
  capitalGainsFlatRateGold: 0.05,

  // Rebate = lowest of 3% of taxable income, 10% of eligible investment, 7.5 lakh:
  // [KPMG26] p47; [PWC]; Dhaka Tribune, 20 Jul 2026 (applies to AY 2026-27).
  rebateCap: 750000,
  rebateRateOfIncome: 0.03,
  rebateRateOfInvestment: 0.1,
  // Government securities (Sanchayapatra, govt bonds) up to 5 lakh: [KPMG26] p47; Prothom Alo,
  // 16 Jun 2026. Mutual funds are no longer in this group (see instruments below).
  sharedGroupCap: 500000,
  // DPS up to 1,20,000 a year: [KPMG26] p47; Prothom Alo, 16 Jun 2026.
  dpsCap: 120000,

  // Minimum tax for an individual with taxable income: flat 5,000 everywhere, 1,000 for a new
  // taxpayer (AY 2026-27 and 2027-28): [KPMG26] p47; [KPMGFO]; Dhaka Tribune, 5 Jul 2026.
  // owner-confirm: one Jun 2025 Daily Star snippet tied the 1,000 to income up to 4.5 lakh;
  // no 2026 source repeats it, so no income condition is applied.
  minTax: 5000,
  minTaxNewTaxpayer: 1000,

  // Filing windows replace a single due date: 1 Jul-30 Sep earns a credit, 1 Oct-31 Dec has no
  // credit and no additional tax, and additional tax applies from 1 Jan. First-time filers have
  // until 30 June. [KPMG26] p45 "File tax returns between..."; [PWC] "Tax administration".
  // owner-confirm: Big-4 guides only, gazette not read. judge.md had "30 Nov" (the old tax day);
  // both guides read 2026-10-22 give 31 Dec, and one LinkedIn post still says 30 Nov.
  returnNoExtraTaxBy: "2026-12-31",

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

  // Net wealth surcharge 10/20/30/35% above 4/10/20/50 crore; more than one car or an
  // 8,000 sq ft city house triggers 10%: [KPMG26] p48; [PWC]. The per-car environment
  // surcharge is not modelled.
  surchargeThresholds: [
    { above: 500000000, rate: 0.35 },
    { above: 200000000, rate: 0.3 },
    { above: 100000000, rate: 0.2 },
    { above: 40000000, rate: 0.1 },
  ] satisfies SurchargeThreshold[],

  instruments: [
    // Eligible investments: [KPMG26] p47. Mutual and unit funds are uncapped from the
    // Finance Act 2026 ([KPMG26] p47 "FA 2026 changes"; TBS on the passed bill).
    // owner-confirm: whether the uncapped mutual-fund rule covers investments made before
    // 1 Jul 2026 (this income year) is not stated by any source read.
    {
      id: "sanchay_group",
      label: "সঞ্চয়পত্র / Govt Bond",
      cap: 500000,
      note: "shared cap ৳৫ লাখ",
    },
    { id: "mutual_fund", label: "Mutual Fund / ETF / Unit fund", cap: null, note: "uncapped" },
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
