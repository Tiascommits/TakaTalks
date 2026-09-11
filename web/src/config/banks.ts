import type { BankType } from "@prisma/client";

/**
 * The scraper-list scope for Module 3/4 (see prompts/02-rate-monitoring-and-scorecard.md).
 * Every bank here needs manual verification of its rate-card page before a
 * real adapter is written for it — until then it either runs on the
 * manual-seed adapter (see src/lib/rates/seed-rates.ts) or has no adapter
 * registered at all and shows "not available" on the scorecard.
 *
 * `websiteUrl` / `rateCardUrl` are left null for all of these: none has
 * been verified against a live bank site yet, so nothing is guessed here.
 */
export type BankConfig = {
  shortCode: string;
  name: string;
  type: BankType;
};

export const BANKS: BankConfig[] = [
  { shortCode: "AB", name: "AB Bank PLC", type: "PRIVATE" },
  { shortCode: "MIDLAND", name: "Midland Bank PLC", type: "PRIVATE" },
  { shortCode: "ONE", name: "One Bank PLC", type: "PRIVATE" },
  { shortCode: "NATIONAL", name: "National Bank PLC", type: "PRIVATE" },
  { shortCode: "CITY", name: "The City Bank PLC", type: "PRIVATE" },
  { shortCode: "IFIC", name: "IFIC Bank PLC", type: "PRIVATE" },
  { shortCode: "SONALI", name: "Sonali Bank PLC", type: "STATE_OWNED" },
  { shortCode: "EBL", name: "Eastern Bank PLC", type: "PRIVATE" },
  { shortCode: "SCB", name: "Standard Chartered Bank", type: "FOREIGN" },
];
