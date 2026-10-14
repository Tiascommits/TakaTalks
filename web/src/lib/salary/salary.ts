/**
 * Salary Offer Analyzer & Net Take-Home Calculation Engine for Bangladesh.
 *
 * Grounded in:
 * - Bangladesh Income Tax Act 2023 (Section 32 / Second Schedule: Part 1).
 * - Section 86: Deduction of tax at source from salary (TDS).
 * - The tax itself comes from calculateTax (src/lib/tax/calculate.ts), the
 *   same engine and rules config as /calculator.
 */

import { calculateTax } from "@/lib/tax/calculate";
import { EMPTY_TAX_INPUT } from "@/lib/tax/types";

export interface SalaryStructureInput {
  label: string;
  monthlyBasic: number;
  monthlyHouseRent?: number;
  monthlyMedical?: number;
  monthlyConveyance?: number;
  monthlyOtherAllowance?: number;
  festivalBonusesCount?: number; // default 2 (e.g. 2 x basic for Eid / Puja)
  pfContributionPct?: number; // default 10% of basic
  hasEmployerPFMatch?: boolean; // default true
  taxpayerCategoryId?: string; // a TAXPAYER_CATEGORIES id, default "general"
}

export interface SalaryBreakdownResult {
  label: string;
  // Monthly Cash Components
  monthlyBasic: number;
  monthlyHouseRent: number;
  monthlyMedical: number;
  monthlyConveyance: number;
  monthlyOtherAllowance: number;
  monthlyGrossCash: number;

  // Annual Totals
  annualBasic: number;
  annualHouseRent: number;
  annualMedical: number;
  annualConveyance: number;
  annualOtherAllowance: number;
  annualFestivalBonuses: number;
  annualGrossCashReceipts: number;

  // Provident Fund
  monthlyEmployeePF: number;
  annualEmployeePF: number;
  monthlyEmployerPF: number;
  annualEmployerPF: number;
  annualTotalPF: number;

  // Total Cost to Company (CTC)
  annualCTC: number;

  // Tax Math per Income Tax Act 2023
  totalEmploymentReceiptsForTax: number;
  statutoryExemption: number;
  taxableSalary: number;
  taxFreeLimit: number;
  annualTax: number;
  monthlyTDS: number;
  effectiveTaxRatePct: number;

  // Net In-Hand Take-Home
  netMonthlyInHand: number;
  netAnnualInHand: number;

  // Total Real Annual Wealth Created (In-hand cash + Total PF)
  annualTotalWealth: number;
}

export interface SalaryComparisonResult {
  current: SalaryBreakdownResult;
  offers: SalaryBreakdownResult[];
  winnerMonthlyInHand: string;
  winnerTotalWealth: string;
}

/**
 * Computes exact salary components, statutory exemption, TDS, and net in-hand pay.
 */
export function calculateSalaryBreakdown(
  input: SalaryStructureInput
): SalaryBreakdownResult {
  const basic = Math.max(0, Number.isFinite(input.monthlyBasic) ? input.monthlyBasic : 0);

  // Standard BD market convention if not broken down:
  // Basic is ~50-60%, House rent is ~25-30%, Medical is ~10%, Conveyance is ~5-10%
  const houseRent =
    input.monthlyHouseRent !== undefined
      ? Math.max(0, input.monthlyHouseRent)
      : Math.round(basic * 0.5);

  const medical =
    input.monthlyMedical !== undefined
      ? Math.max(0, input.monthlyMedical)
      : Math.round(basic * 0.1);

  const conveyance =
    input.monthlyConveyance !== undefined
      ? Math.max(0, input.monthlyConveyance)
      : Math.round(basic * 0.05);

  const other = Math.max(0, input.monthlyOtherAllowance ?? 0);
  const bonusCount = Math.max(0, input.festivalBonusesCount ?? 2);
  const pfPct = Math.max(0, Math.min(25, input.pfContributionPct ?? 10)) / 100;
  const hasEmployerMatch = input.hasEmployerPFMatch ?? true;

  const monthlyGrossCash = basic + houseRent + medical + conveyance + other;
  const annualBasic = basic * 12;
  const annualHouseRent = houseRent * 12;
  const annualMedical = medical * 12;
  const annualConveyance = conveyance * 12;
  const annualOtherAllowance = other * 12;
  const annualFestivalBonuses = Math.round(basic * bonusCount);
  const annualGrossCashReceipts =
    monthlyGrossCash * 12 + annualFestivalBonuses;

  // Provident Fund Math
  const monthlyEmployeePF = Math.round(basic * pfPct);
  const annualEmployeePF = monthlyEmployeePF * 12;
  const monthlyEmployerPF = hasEmployerMatch ? monthlyEmployeePF : 0;
  const annualEmployerPF = monthlyEmployerPF * 12;
  const annualTotalPF = annualEmployeePF + annualEmployerPF;

  // Total CTC = Cash receipts + Employer PF match
  const annualCTC = annualGrossCashReceipts + annualEmployerPF;

  // Tax per Income Tax Act 2023:
  // Receipts for tax = Gross cash + Employer PF contribution
  const totalEmploymentReceiptsForTax =
    annualGrossCashReceipts + annualEmployerPF;

  // Same engine as /calculator, so the 1/3 exemption, the rebate on the
  // employee's own PF contribution and the minimum tax all match it.
  const tax = calculateTax({
    ...EMPTY_TAX_INPUT,
    categoryId: input.taxpayerCategoryId ?? "general",
    basicMonthly: basic,
    allowanceMonthly: houseRent + medical + conveyance + other,
    bonusAnnual: annualFestivalBonuses,
    employerPFMonthly: monthlyEmployerPF,
    invPFMonthly: monthlyEmployeePF,
  });
  const statutoryExemption = Math.round(tax.salaryExemption);
  const taxableSalary = Math.round(tax.taxableSalary);
  const taxFreeLimit = tax.taxFree;
  const annualTax = Math.round(tax.totalLiability);
  const monthlyTDS = Math.round(annualTax / 12);

  const effectiveTaxRatePct =
    annualGrossCashReceipts > 0
      ? Math.round((annualTax / annualGrossCashReceipts) * 1000) / 10
      : 0;

  // Net Monthly In-Hand Cash (Bank Credit)
  const netMonthlyInHand = Math.max(
    0,
    monthlyGrossCash - monthlyEmployeePF - monthlyTDS
  );

  // Net Annual In-Hand Cash
  const netAnnualInHand = Math.max(
    0,
    annualGrossCashReceipts - annualEmployeePF - annualTax
  );

  // Total Annual Wealth = Net in-hand cash + Total PF accrued
  const annualTotalWealth = netAnnualInHand + annualTotalPF;

  return {
    label: input.label || "Offer",
    monthlyBasic: basic,
    monthlyHouseRent: houseRent,
    monthlyMedical: medical,
    monthlyConveyance: conveyance,
    monthlyOtherAllowance: other,
    monthlyGrossCash,
    annualBasic,
    annualHouseRent,
    annualMedical,
    annualConveyance,
    annualOtherAllowance,
    annualFestivalBonuses,
    annualGrossCashReceipts,
    monthlyEmployeePF,
    annualEmployeePF,
    monthlyEmployerPF,
    annualEmployerPF,
    annualTotalPF,
    annualCTC,
    totalEmploymentReceiptsForTax,
    statutoryExemption,
    taxableSalary,
    taxFreeLimit,
    annualTax,
    monthlyTDS,
    effectiveTaxRatePct,
    netMonthlyInHand,
    netAnnualInHand,
    annualTotalWealth,
  };
}

/**
 * Compares current salary against one or more job offers.
 */
export function compareSalaries(
  current: SalaryStructureInput,
  offers: SalaryStructureInput[]
): SalaryComparisonResult {
  const currentResult = calculateSalaryBreakdown(current);
  const offerResults = offers.map(calculateSalaryBreakdown);

  let bestMonthly = currentResult;
  let bestWealth = currentResult;

  for (const o of offerResults) {
    if (o.netMonthlyInHand > bestMonthly.netMonthlyInHand) {
      bestMonthly = o;
    }
    if (o.annualTotalWealth > bestWealth.annualTotalWealth) {
      bestWealth = o;
    }
  }

  return {
    current: currentResult,
    offers: offerResults,
    winnerMonthlyInHand: bestMonthly.label,
    winnerTotalWealth: bestWealth.label,
  };
}
