import type { RateInstrument, RateSourceMethod } from "@prisma/client";

export type ScrapedRate = {
  instrument: RateInstrument;
  termMonths: number;
  ratePct: number;
  method: RateSourceMethod;
  source: string;
  /** When the source itself last confirmed this rate. Omit for a live read, which is dated now. */
  asOf?: Date;
};

/**
 * One adapter per bank, by design (see prompts/02-rate-monitoring-and-scorecard.md):
 * rate-card page formats differ enough across banks that a single generic
 * scraper would be fragile everywhere at once. A broken adapter should only
 * ever take down that one bank's data, never the others.
 */
export interface RateAdapter {
  bankShortCode: string;
  scrape(): Promise<ScrapedRate[]>;
}
