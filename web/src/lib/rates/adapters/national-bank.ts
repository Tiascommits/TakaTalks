import * as cheerio from "cheerio";
import type { RateAdapter, ScrapedRate } from "./types";

const URL = "https://www.nblbd.com/interest-rate/deposit-rate";

/**
 * Verified live on 2026-09-11: nblbd.com lays out FDR rates in deeply
 * nested tables (amount-tier sub-tables inside each term's row), too
 * irregular to address by table/row position reliably. Instead this
 * flattens the relevant section to plain text (cheerio's .text() collapses
 * the nesting) and takes the *first* percentage figure following each
 * term's label, which corresponds to the smallest ("Up to 10 lac") amount
 * tier — the one most comparable to what a retail depositor sees.
 */
export const nationalBankAdapter: RateAdapter = {
  bankShortCode: "NATIONAL",
  async scrape(): Promise<ScrapedRate[]> {
    const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`National Bank fetch failed: HTTP ${res.status}`);
    const $ = cheerio.load(await res.text());
    const text = $.text().replace(/\s+/g, " ");

    const TERM_LABELS: { termMonths: 3 | 6 | 12; label: string }[] = [
      { termMonths: 3, label: "FDR for 3 Months" },
      { termMonths: 6, label: "FDR above 6 Months" },
      { termMonths: 12, label: "FDR for 1 Year and above" },
    ];

    const rates: ScrapedRate[] = [];
    for (const { termMonths, label } of TERM_LABELS) {
      const idx = text.indexOf(label);
      if (idx === -1) continue;
      const after = text.slice(idx + label.length, idx + label.length + 300);
      const rateMatch = after.match(/([\d.]+)\s*%/);
      if (!rateMatch) continue;
      rates.push({
        instrument: "FDR",
        termMonths,
        ratePct: parseFloat(rateMatch[1]),
        method: "SCRAPED",
        source: URL,
      });
    }

    if (rates.length === 0) throw new Error("National Bank: no matching FDR labels found — page structure may have changed");
    return rates;
  },
};
