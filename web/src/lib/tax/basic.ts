import { TAX_RULES, TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { slabTax } from "./calculate";
import type { SlabRow } from "./types";

export interface BasicTaxInput {
  income: number;
  categoryId: string;
  disabledChildren: number;
}

export interface BasicTaxResult {
  taxFree: number;
  incomeAboveTaxFree: number;
  slabRows: SlabRow[];
  basicTax: number;
}

export const EMPTY_BASIC_TAX_INPUT: BasicTaxInput = {
  income: 0,
  categoryId: TAXPAYER_CATEGORIES[0].id,
  disabledChildren: 0,
};

/**
 * The slab-only tax on a single total-income figure — the "basic" calculation
 * from the video script, deliberately excluding TDS, investment rebate,
 * minimum tax and surcharge so it matches that walkthrough exactly.
 */
export function calculateBasicTax(input: BasicTaxInput): BasicTaxResult {
  const category = TAXPAYER_CATEGORIES.find((c) => c.id === input.categoryId) ?? TAXPAYER_CATEGORIES[0];
  const income = Number.isFinite(input.income) && input.income > 0 ? input.income : 0;
  const disabledChildren =
    Number.isFinite(input.disabledChildren) && input.disabledChildren > 0
      ? Math.floor(input.disabledChildren)
      : 0;

  const taxFree = category.taxFreeLimit + disabledChildren * TAX_RULES.disabledChildTaxFreeAddOn;
  const incomeAboveTaxFree = Math.max(0, income - taxFree);
  const { tax, rows } = slabTax(incomeAboveTaxFree);

  return { taxFree, incomeAboveTaxFree, slabRows: rows, basicTax: tax };
}
