import type { RateAdapter, ScrapedRate } from "./types";
import { SEED_FDR_RATES, SEED_SOURCE_LABEL } from "../seed-rates";

/**
 * Stand-in adapter for a bank whose rate-card page hasn't been verified and
 * turned into a real scraper yet. Always tagged method: "MANUAL" so the UI
 * never presents this as a live, automated read.
 */
function manualSeedAdapter(bankShortCode: string): RateAdapter {
  return {
    bankShortCode,
    async scrape(): Promise<ScrapedRate[]> {
      const rows = SEED_FDR_RATES[bankShortCode] ?? [];
      return rows.map((r) => ({
        instrument: "FDR",
        termMonths: r.termMonths,
        ratePct: r.ratePct,
        method: "MANUAL",
        source: SEED_SOURCE_LABEL,
      }));
    },
  };
}

export const MANUAL_SEED_ADAPTERS: RateAdapter[] = Object.keys(SEED_FDR_RATES).map(
  manualSeedAdapter
);
