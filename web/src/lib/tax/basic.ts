import { TAX_RULES, TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { slabTax } from "./calculate";
import type { SlabRow } from "./types";

export interface BasicTaxInput {
  income: number;
  categoryId: string;
  disabledChildren: number;
  isSalary?: boolean;
}

export interface BasicTaxResult {
  taxFree: number;
  salaryExemption: number;
  taxableIncome: number;
  incomeAboveTaxFree: number;
  slabRows: SlabRow[];
  basicTax: number;
}

export const EMPTY_BASIC_TAX_INPUT: BasicTaxInput = {
  income: 0,
  categoryId: TAXPAYER_CATEGORIES[0].id,
  disabledChildren: 0,
  isSalary: false,
};

/**
 * The slab-only tax on a single total-income figure — the "basic" calculation
 * from the video script, deliberately excluding TDS, investment rebate,
 * minimum tax and surcharge so it matches that walkthrough exactly.
 * Supports the statutory 1/3 employment exemption when isSalary is true.
 */
export function calculateBasicTax(input: BasicTaxInput): BasicTaxResult {
  const category = TAXPAYER_CATEGORIES.find((c) => c.id === input.categoryId) ?? TAXPAYER_CATEGORIES[0];
  const income = Number.isFinite(input.income) && input.income > 0 ? input.income : 0;
  const disabledChildren =
    Number.isFinite(input.disabledChildren) && input.disabledChildren > 0
      ? Math.floor(input.disabledChildren)
      : 0;

  const salaryExemption = input.isSalary
    ? Math.min(Math.round(income * TAX_RULES.salaryExemptionFraction), TAX_RULES.salaryExemptionCap)
    : 0;
  const taxableIncome = Math.max(0, income - salaryExemption);

  const taxFree = category.taxFreeLimit + disabledChildren * TAX_RULES.disabledChildTaxFreeAddOn;
  const incomeAboveTaxFree = Math.max(0, taxableIncome - taxFree);
  const { tax, rows } = slabTax(incomeAboveTaxFree);

  return { taxFree, salaryExemption, taxableIncome, incomeAboveTaxFree, slabRows: rows, basicTax: tax };
}
