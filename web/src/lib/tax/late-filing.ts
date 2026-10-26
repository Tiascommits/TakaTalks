import { TAX_RULES } from "@/config/tax-rules-2025-26";

/** Additional tax for each late-filing window after the no-extra-tax date, on this net payable tax. */
export function lateFilingExtraTax(netPayable: number): { until: string; amount: number }[] {
  const base = Math.max(netPayable, 0);
  return TAX_RULES.lateFilingExtraTax.map(({ until, rate, min }) => ({
    until,
    amount: Math.max(Math.round(base * rate), min),
  }));
}
