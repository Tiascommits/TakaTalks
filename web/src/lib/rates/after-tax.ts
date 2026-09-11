/**
 * Deterministic after-tax return math — the one automated calculation the
 * prompt allows here, since it's arithmetic, not a judgment call about which
 * bank is safer. Marginal tax rate is a direct input rather than derived
 * from a full tax-profile run: FDR/DPS interest is commonly deducted as
 * source tax (AIT) rather than taxed strictly at the slab-marginal rate,
 * and TAX_RULES (src/config/tax-rules-2025-26.ts) doesn't model an AIT
 * rate, so this doesn't guess one — the person picks their own rate, same
 * as the reference demo (tools/fdr-comparison/fdr-dps-comparison.html).
 */
export type AfterTaxResult = {
  grossInterest: number;
  taxAmount: number;
  netInterest: number;
  effectiveAfterTaxRatePct: number;
};

export function calculateAfterTaxReturn(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  marginalTaxRate: number
): AfterTaxResult {
  const years = termMonths / 12;
  const grossInterest = principal * (annualRatePct / 100) * years;
  const taxAmount = grossInterest * marginalTaxRate;
  const netInterest = grossInterest - taxAmount;
  const effectiveAfterTaxRatePct =
    principal > 0 && years > 0 ? (netInterest / years / principal) * 100 : 0;

  return { grossInterest, taxAmount, netInterest, effectiveAfterTaxRatePct };
}
