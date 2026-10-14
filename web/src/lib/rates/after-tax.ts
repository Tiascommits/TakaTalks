/**
 * Deterministic after-tax return math — the one automated calculation the
 * prompt allows here, since it's arithmetic, not a judgment call about which
 * bank is safer. `taxRate` is the source tax the bank deducts from the
 * interest (see FDR_SOURCE_TAX in src/config/rate-monitoring.ts), which is
 * what actually lands in the account; the depositor's return settles the
 * final tax on it.
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
  taxRate: number
): AfterTaxResult {
  const years = termMonths / 12;
  const grossInterest = principal * (annualRatePct / 100) * years;
  const taxAmount = grossInterest * taxRate;
  const netInterest = grossInterest - taxAmount;
  const effectiveAfterTaxRatePct =
    principal > 0 && years > 0 ? (netInterest / years / principal) * 100 : 0;

  return { grossInterest, taxAmount, netInterest, effectiveAfterTaxRatePct };
}
