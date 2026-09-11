import type { RateAdapter } from "./types";
import { MANUAL_SEED_ADAPTERS } from "./manual-seed";
import { abBankAdapter } from "./ab-bank";
import { nationalBankAdapter } from "./national-bank";

/**
 * Every bank in config/banks.ts that has no entry here gets no scrape
 * attempt at all — it shows up on the scorecard as "not available" rather
 * than silently missing or guessed. Add a bank here only after its
 * rate-card page has been manually verified (see
 * prompts/02-rate-monitoring-and-scorecard.md), replacing its manual-seed
 * entry with a real per-bank adapter once one exists.
 *
 * AB and National Bank were verified live on 2026-09-11 (see
 * todo/needs-us-both/confirm-new-bank-list.md for what was checked and
 * what wasn't) and get real adapters here, overriding their manual-seed
 * entries. Everything else in MANUAL_SEED_ADAPTERS stays on manual-seed —
 * their rate-card pages are either JS-rendered, PDF-only, or too
 * irregularly structured to parse reliably as of that verification pass.
 */
export const RATE_ADAPTERS = new Map<string, RateAdapter>([
  ...[...MANUAL_SEED_ADAPTERS].map((a): [string, RateAdapter] => [a.bankShortCode, a]),
  [abBankAdapter.bankShortCode, abBankAdapter],
  [nationalBankAdapter.bankShortCode, nationalBankAdapter],
]);
