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

export const SEED_FDR_RATES: Record<string, { termMonths: number; ratePct: number }[]> = {
  AB: [
    { termMonths: 3, ratePct: 12.0 },
    { termMonths: 6, ratePct: 12.15 },
    { termMonths: 12, ratePct: 12.0 },
  ],
  MIDLAND: [
    { termMonths: 3, ratePct: 10.15 },
    { termMonths: 6, ratePct: 10.25 },
    { termMonths: 12, ratePct: 9.9 },
  ],
  ONE: [
    { termMonths: 3, ratePct: 10.0 },
    { termMonths: 6, ratePct: 10.25 },
    { termMonths: 12, ratePct: 10.5 },
  ],
  NATIONAL: [
    { termMonths: 3, ratePct: 8.75 },
    { termMonths: 6, ratePct: 9.0 },
    { termMonths: 12, ratePct: 9.75 },
  ],
  CITY: [
    { termMonths: 3, ratePct: 8.5 },
    { termMonths: 6, ratePct: 8.75 },
    { termMonths: 12, ratePct: 9.25 },
  ],
  IFIC: [
    { termMonths: 3, ratePct: 9.0 },
    { termMonths: 6, ratePct: 9.5 },
    { termMonths: 12, ratePct: 9.5 },
  ],
};
