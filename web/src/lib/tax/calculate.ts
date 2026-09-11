import { TAX_RULES, TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import type { SlabRow, TaxCalculationResult, TaxCalculatorInput } from "./types";

const NUMERIC_FIELDS = [
  "basicMonthly",
  "allowanceMonthly",
  "bonusAnnual",
  "employerPFMonthly",
  "businessAnnual",
  "housePropertyAnnual",
  "otherIncomeAnnual",
  "freelanceAnnual",
  "cgSharesFund",
  "cgWithin5Years",
  "cgAfter5Years",
  "cgLand",
  "cgGold",
  "invSanchayAnnual",
  "invBondAnnual",
  "invMFAnnual",
  "invStockAnnual",
  "invLifeAnnual",
  "invPFMonthly",
  "invDPSMonthly",
  "invDonationAnnual",
  "aitPaid",
  "netWealth",
] as const satisfies readonly (keyof TaxCalculatorInput)[];

/**
 * Money can't be negative and a browser number input can still be made to
 * emit NaN (empty field) or a negative value (pasted, or driven via the
 * API/tracker path rather than the min=0 UI control). Clamp everything to a
 * finite, non-negative number before it touches the tax math, so garbage
 * input degrades to "treated as zero" instead of producing a nonsensical
 * negative tax or NaN propagating through the whole breakdown.
 */
function sanitizeInput(input: TaxCalculatorInput): TaxCalculatorInput {
  const clean: TaxCalculatorInput = { ...input };
  for (const key of NUMERIC_FIELDS) {
    const v = clean[key];
    clean[key] = Number.isFinite(v) && v > 0 ? v : 0;
  }
  clean.disabledChildren =
    Number.isFinite(input.disabledChildren) && input.disabledChildren > 0
      ? Math.floor(input.disabledChildren)
      : 0;
  return clean;
}

function slabTax(amount: number): { tax: number; rows: SlabRow[] } {
  let remaining = Math.max(0, amount);
  let tax = 0;
  const rows: SlabRow[] = [];
  for (const s of TAX_RULES.slabs) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, s.amt);
    const t = chunk * s.rate;
    tax += t;
    if (chunk > 0) rows.push({ rate: s.rate, chunk, tax: t });
    remaining -= chunk;
  }
  return { tax, rows };
}

export function calculateTax(rawInput: TaxCalculatorInput): TaxCalculationResult {
  const input = sanitizeInput(rawInput);
  const category = TAXPAYER_CATEGORIES.find((c) => c.id === input.categoryId);
  const taxFree =
    (category?.taxFreeLimit ?? TAXPAYER_CATEGORIES[0].taxFreeLimit) +
    input.disabledChildren * TAX_RULES.disabledChildTaxFreeAddOn;

  // Salary
  const grossSalary =
    (input.basicMonthly + input.allowanceMonthly) * 12 +
    input.bonusAnnual +
    input.employerPFMonthly * 12;
  const salaryExemption = Math.min(
    grossSalary * TAX_RULES.salaryExemptionFraction,
    TAX_RULES.salaryExemptionCap
  );
  const taxableSalary = Math.max(0, grossSalary - salaryExemption);

  const business = input.businessAnnual;
  const houseProperty = input.housePropertyAnnual;
  const freelanceIncome = input.freelanceAnnual;
  // No confirmed concessional rule yet (see todo/needs-us-both/freelance-tax-rule.md) —
  // freelanceExemptionFraction stays 0 until TAX_RULES.freelanceConcessionalRuleConfirmed
  // is flipped, so this is currently taxed identically to other income.
  const freelanceTaxable = TAX_RULES.freelanceConcessionalRuleConfirmed
    ? freelanceIncome * (1 - TAX_RULES.freelanceExemptionFraction)
    : freelanceIncome;
  const otherIncome = input.otherIncomeAnnual;

  // Capital gains
  const sharesFundGain = input.cgSharesFund;
  const sharesFundExempt = Math.min(sharesFundGain, TAX_RULES.sharesFundExemption);
  const sharesFundTaxable = Math.max(0, sharesFundGain - TAX_RULES.sharesFundExemption);
  const cgWithin5 = input.cgWithin5Years;
  const cgAfter5 = input.cgAfter5Years;
  const cgLand = input.cgLand;
  const cgGold = input.cgGold;

  const slabBase =
    taxableSalary + business + houseProperty + otherIncome + freelanceTaxable + cgWithin5 + cgLand;
  const incomeAboveTaxFree = Math.max(0, slabBase - taxFree);
  const { tax: baseSlabTax, rows: slabRows } = slabTax(incomeAboveTaxFree);

  const flatShareTax = sharesFundTaxable * TAX_RULES.capitalGainsFlatRateSharesFund;
  const flatAfter5Tax = cgAfter5 * TAX_RULES.capitalGainsFlatRateAfter5Years;
  const flatGoldTax = cgGold * TAX_RULES.capitalGainsFlatRateGold;
  const flatCGTax = flatShareTax + flatAfter5Tax + flatGoldTax;
  const grossTax = baseSlabTax + flatCGTax;

  // Investments
  const sharedGroupRaw = input.invSanchayAnnual + input.invBondAnnual + input.invMFAnnual;
  const sharedGroupCapped = Math.min(sharedGroupRaw, TAX_RULES.sharedGroupCap);
  const dpsAnnual = input.invDPSMonthly * 12;
  const dpsEligible = Math.min(dpsAnnual, TAX_RULES.dpsCap);
  const pfAnnual = input.invPFMonthly * 12;
  const totalInvestment =
    sharedGroupCapped +
    dpsEligible +
    input.invStockAnnual +
    input.invLifeAnnual +
    pfAnnual +
    input.invDonationAnnual;

  const rebate3pct = TAX_RULES.rebateRateOfIncome * slabBase;
  const rebate10pct = TAX_RULES.rebateRateOfInvestment * totalInvestment;
  const rebate = Math.min(rebate3pct, rebate10pct, TAX_RULES.rebateCap);

  let taxAfterRebate = Math.max(0, grossTax - rebate);

  const minFloor = input.firstTimeFiler ? TAX_RULES.minTaxFirstTime : TAX_RULES.minTaxRegular;
  let minApplied = false;
  const totalIncomeAll = slabBase + sharesFundGain + cgAfter5 + cgGold;
  if (totalIncomeAll > taxFree && taxAfterRebate < minFloor) {
    taxAfterRebate = minFloor;
    minApplied = true;
  }

  // Surcharge (net wealth, opt-in)
  let surchargeRate = 0;
  for (const t of TAX_RULES.surchargeThresholds) {
    if (
      input.netWealth > t.above ||
      (t.above === 40000000 && (input.multiCar || input.bigHouse))
    ) {
      surchargeRate = t.rate;
      break;
    }
  }
  const surchargeAmt = taxAfterRebate * surchargeRate;
  const totalLiability = taxAfterRebate + surchargeAmt;
  const netPayable = totalLiability - input.aitPaid;

  const hasAnyIncome =
    grossSalary !== 0 ||
    business !== 0 ||
    houseProperty !== 0 ||
    otherIncome !== 0 ||
    freelanceIncome !== 0 ||
    sharesFundGain !== 0 ||
    cgWithin5 !== 0 ||
    cgAfter5 !== 0 ||
    cgLand !== 0 ||
    cgGold !== 0;

  return {
    taxFree,
    grossSalary,
    salaryExemption,
    taxableSalary,
    business,
    houseProperty,
    otherIncome,
    freelanceIncome,
    freelanceTaxable,
    sharesFundGain,
    sharesFundExempt,
    sharesFundTaxable,
    cgWithin5,
    cgLand,
    slabBase,
    incomeAboveTaxFree,
    baseSlabTax,
    slabRows,
    flatShareTax,
    flatAfter5Tax,
    flatGoldTax,
    flatCGTax,
    grossTax,
    sharedGroupRaw,
    sharedGroupCapped,
    dpsAnnual,
    dpsEligible,
    pfAnnual,
    totalInvestment,
    rebate3pct,
    rebate10pct,
    rebate,
    taxAfterRebate,
    minApplied,
    minFloor,
    surchargeRate,
    surchargeAmt,
    totalLiability,
    netPayable,
    hasAnyIncome,
  };
}
