import { TAX_RULES } from "@/config/tax-rules-2025-26";
import type { OptimizerResult, OptimizerSuggestion, TaxCalculationResult } from "./types";

/**
 * Given a computed tax result, work out how much more the person would need
 * to invest — and in which eligible instrument, respecting individual caps —
 * to reach the maximum legal rebate. Pure arithmetic, no advice on which
 * instrument performs best.
 */
export function calculateOptimizer(r: TaxCalculationResult): OptimizerResult {
  const hasTaxableIncome = r.slabBase > r.taxFree && r.grossTax > 0;

  // Rebate can never exceed 3% of taxable income or the hard cap, no matter
  // how much more is invested.
  const maxRebate = Math.min(r.rebate3pct, TAX_RULES.rebateCap);
  const rebateGap = Math.max(0, maxRebate - r.rebate);
  const taxSaving = rebateGap; // each extra taka of rebate is a taka of tax saved

  // rebate = min(3% * income, 10% * investment, cap) — to close the gap from
  // the investment side, total eligible investment must reach maxRebate / 10%.
  const investmentNeeded = maxRebate / TAX_RULES.rebateRateOfInvestment;
  const additionalInvestmentNeeded = Math.max(0, investmentNeeded - r.totalInvestment);

  const sanchayGroupRemaining = Math.max(0, TAX_RULES.sharedGroupCap - r.sharedGroupCapped);
  const dpsRemaining = Math.max(0, TAX_RULES.dpsCap - r.dpsEligible);

  const suggestions: OptimizerSuggestion[] = [];
  let remaining = additionalInvestmentNeeded;

  if (remaining > 0 && sanchayGroupRemaining > 0) {
    const fill = Math.min(remaining, sanchayGroupRemaining);
    suggestions.push({
      instrumentId: "sanchay_group",
      investMore: fill,
      capRemaining: sanchayGroupRemaining,
      taxSavingFromThis: fill * TAX_RULES.rebateRateOfInvestment,
    });
    remaining -= fill;
  }

  if (remaining > 0 && dpsRemaining > 0) {
    const fill = Math.min(remaining, dpsRemaining);
    suggestions.push({
      instrumentId: "dps",
      investMore: fill,
      taxSavingFromThis: fill * TAX_RULES.rebateRateOfInvestment,
    });
    remaining -= fill;
  }

  if (remaining > 0) {
    suggestions.push({
      instrumentId: "uncapped",
      investMore: remaining,
      taxSavingFromThis: remaining * TAX_RULES.rebateRateOfInvestment,
    });
    remaining = 0;
  }

  return {
    maxRebate,
    rebateGap,
    taxSaving,
    additionalInvestmentNeeded,
    investmentNeeded,
    suggestions,
    alreadyAtMax: hasTaxableIncome && rebateGap <= 0,
    hasTaxableIncome,
  };
}
