import type { RateAdapter } from "./types";
import { MANUAL_SEED_ADAPTERS } from "./manual-seed";
import { bbChartAdapter } from "./bb-chart";

/**
 * Every bank in config/banks.ts that has no entry here gets no scrape
 * attempt at all — it shows up on the scorecard as "not available" rather
 * than silently missing or guessed.
 *
 * Since 2026-10-16 the source is Bangladesh Bank's monthly announced-rate chart
 * (config/rate-monitoring.ts BB_DEPOSIT_CHART_URL), which replaced the AB,
 * National and IFIC per-bank scrapers and the One and City manual seeds.
 * The chart prints each bank under its own short code; each mapping below was
 * matched by hand against the chart of September 2026.
 * Not mapped, on purpose:
 *   - MIDLAND: the chart's "MDBL" is probably Midland Bank, but no source
 *     confirmed the code, so it stays on its manual seed until someone does.
 *   - SCB: the chart gives Standard Chartered 0.05-4.12%, real figures that the
 *     1% plausibility floor (meant to catch wrong-column parses) would reject
 *     every day; it stays "not available".
 */
const BB_CHART_CODES: Record<string, string> = {
  AB: "AB-BANK",
  ONE: "ONE BANK",
  NATIONAL: "NBL",
  CITY: "THE CITY",
  IFIC: "IFIC",
  SONALI: "SONALI",
  EBL: "EBL",
};

export const RATE_ADAPTERS = new Map<string, RateAdapter>([
  ...[...MANUAL_SEED_ADAPTERS].map((a): [string, RateAdapter] => [a.bankShortCode, a]),
  ...Object.entries(BB_CHART_CODES).map(([shortCode, code]): [string, RateAdapter] => [shortCode, bbChartAdapter(shortCode, code)]),
]);
