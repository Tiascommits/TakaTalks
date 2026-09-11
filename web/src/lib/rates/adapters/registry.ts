import type { RateAdapter } from "./types";
import { MANUAL_SEED_ADAPTERS } from "./manual-seed";

/**
 * Every bank in config/banks.ts that has no entry here gets no scrape
 * attempt at all — it shows up on the scorecard as "not available" rather
 * than silently missing or guessed. Add a bank here only after its
 * rate-card page has been manually verified (see
 * prompts/02-rate-monitoring-and-scorecard.md), replacing its manual-seed
 * entry with a real per-bank adapter once one exists.
 */
export const RATE_ADAPTERS = new Map<string, RateAdapter>(
  [...MANUAL_SEED_ADAPTERS].map((a) => [a.bankShortCode, a])
);
