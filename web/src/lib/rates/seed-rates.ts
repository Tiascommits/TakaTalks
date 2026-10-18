/**
 * Manually curated FDR rates, carried over verbatim from
 * tools/fdr-comparison/fdr-dps-comparison.html (source: publicly published
 * bank rate roundup, dated 31 Dec 2025). This is NOT a live scrape — it's
 * the manual-seed adapter's data until a real per-bank adapter replaces it
 * (each one needs its rate-card page manually verified first, see
 * prompts/02-rate-monitoring-and-scorecard.md).
 *
 * Only banks with a real, previously-vetted number appear here. Banks added
 * to config/banks.ts without an entry here get no adapter at all, so the
 * scorecard honestly shows "not available" instead of a guessed figure.
 */
export const SEED_SOURCE_LABEL =
  "Manually curated, publicly published bank rate roundup, dated 31 Dec 2025 (not a live scrape)";

// The roundup's own date, stored as each seed snapshot's date so the page
// never shows a manual figure as checked today. Midday UTC reads as 31 Dec
// in every time zone.
export const SEED_AS_OF = new Date("2025-12-31T12:00:00Z");

// Only MIDLAND is left: every other bank with a seed now reads Bangladesh Bank's
// chart (adapters/bb-chart.ts, mapped in adapters/registry.ts).
export const SEED_FDR_RATES: Record<string, { termMonths: number; ratePct: number }[]> = {
  MIDLAND: [
    { termMonths: 3, ratePct: 10.15 },
    { termMonths: 6, ratePct: 10.25 },
    { termMonths: 12, ratePct: 9.9 },
  ],
};
