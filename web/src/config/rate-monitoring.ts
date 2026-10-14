/**
 * Constants for Module 3/4 (rate monitoring + scorecard). Kept out of
 * calculation/UI code for the same reason tax-rules-2025-26.ts is: these
 * are policy/threshold numbers that change independently of the logic that
 * uses them.
 */

// FDR tenors this MVP tracks. Matches the reference demo
// (tools/fdr-comparison/fdr-dps-comparison.html).
export const FDR_TERMS_MONTHS = [3, 6, 12] as const;

// A day-over-day rate move at or above this many percentage points is
// flagged in the admin digest as worth a human look.
export const SIGNIFICANT_CHANGE_THRESHOLD_PCT = 0.25;

// Deposit Protection Ordinance 2025 (replaced the Bank Deposit Insurance Act
// 2000): per-depositor, per-bank cover, paid on liquidation or resolution.
// Checked 2026-10-15: UNB, 23 Nov 2025 (ordinance promulgated; payout on
// liquidation or resolution); Dhaka Tribune, "Max Tk2 lakh to be returned
// upon bank, NBFI closure". Shown in a permanent, non-dismissible panel
// above the scorecard per the prompt.
export const DEPOSIT_INSURANCE_COVER_BDT = 200_000;

// Source tax (TDS) a bank deducts from an individual's FDR interest: Income
// Tax Act 2023 s.102 at 10%, raised by 50% under s.142 (so 15%) when the
// depositor shows no proof of submission of return (PSR). Checked 2026-10-15:
// - PwC Worldwide Tax Summaries, Bangladesh, Corporate, "Withholding taxes"
//   (last reviewed 31 Jul 2026): "interest on saving deposits, fixed deposits,
//   etc." 10% for persons other than company/trust/AoP; +50% without PSR.
// - The Daily Star, 7 Jun 2026, "Time to review tax deduction at source
//   provisions on bank and NBFI deposits": 10% for individuals, an additional
//   50% without proof of return submission.
// - Dhaka Tribune, 10 Aug 2026, "Banks warned on source tax deduction from
//   deposit" (Bangladesh Bank circular): s.102 deduction, s.142 50% uplift.
export const FDR_SOURCE_TAX = { withPsr: 0.1, withoutPsr: 0.15 } as const;

// Bangladesh Bank's minimum Capital to Risk-weighted Assets Ratio (CRAR)
// requirement, shown next to any disclosed CAR figure on the bank-health
// panel so a user has context without us interpreting it for them. See
// prompts/03-annual-report-extraction.md and docs/product-notes.md for why
// this matters given documented sector-wide capital stress.
export const CRAR_REGULATORY_MINIMUM_PCT = 12.5;
