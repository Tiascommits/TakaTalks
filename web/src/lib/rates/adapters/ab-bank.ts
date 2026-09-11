import * as cheerio from "cheerio";
import type { RateAdapter, ScrapedRate } from "./types";

const URL = "https://abbl.com/rates-and-charge/fixed-deposit-rates/";

/**
 * Verified live on 2026-09-11: abbl.com serves a plain server-rendered
 * `.deposit-table`, first section is the base "Fixed Deposit (Time
 * Deposits)" product. Only rows in that first section are taken — later
 * rows in the same table belong to named variants ("Profit First" etc.),
 * marked by a `td.full-row` sub-header, which we deliberately stop at so
 * they don't get mixed into the plain-FDR comparison figure.
 */
export const abBankAdapter: RateAdapter = {
  bankShortCode: "AB",
  async scrape(): Promise<ScrapedRate[]> {
    const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`AB Bank fetch failed: HTTP ${res.status}`);
    const $ = cheerio.load(await res.text());

    const rates: ScrapedRate[] = [];
    const table = $(".deposit-table").first();

    for (const row of table.find("tbody > tr").toArray()) {
      const cells = $(row).find("td");
      if (cells.first().hasClass("full-row")) break; // next named product starts here (may be a single colspan cell)
      if (cells.length < 2) continue;

      const label = $(cells[0]).text().trim();
      const rateText = $(cells[1]).text().trim();
      const rateMatch = rateText.match(/([\d.]+)\s*%/);
      if (!rateMatch) continue;
      const ratePct = parseFloat(rateMatch[1]);

      const monthMatch = label.match(/(\d+)\s*\(\w+\)\s*Months?/i);
      const yearMatch = label.match(/(\d+)\s*\(\w+\)\s*Years?/i);
      const termMonths = monthMatch
        ? parseInt(monthMatch[1], 10)
        : yearMatch
          ? parseInt(yearMatch[1], 10) * 12
          : null;

      if (termMonths === null || ![3, 6, 12].includes(termMonths)) continue;
      rates.push({ instrument: "FDR", termMonths, ratePct, method: "SCRAPED", source: URL });
    }

    if (rates.length === 0) throw new Error("AB Bank: no matching FDR rows found — page structure may have changed");
    return rates;
  },
};
