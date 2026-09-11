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

// Bangladesh's Deposit Protection Act (2026): per-depositor, per-bank cover,
// only triggered on formal liquidation. Shown in a permanent, non-dismissible
// panel above the scorecard per the prompt.
export const DEPOSIT_INSURANCE_COVER_BDT = 200_000;

export const MARGINAL_TAX_RATE_OPTIONS = [0, 0.1, 0.15, 0.2, 0.25, 0.3] as const;
