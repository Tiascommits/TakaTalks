import * as cheerio from "cheerio";
import { BB_CHART_FDR_COLUMN, BB_DEPOSIT_CHART_URL, FDR_TERMS_MONTHS } from "@/config/rate-monitoring";
import { readBodyCapped } from "@/lib/net/safe-fetch";
import type { RateAdapter, ScrapedRate } from "./types";

export type BbRate = { min: number; max: number };
export type BbChart = {
  /** The chart's own month ("September, 2026"), as the 1st of that month, midday UTC so it reads the same everywhere. */
  month: Date;
  /** Bank code as the chart prints it (e.g. "AB-BANK") -> its five fixed-deposit tenor cells, as printed.
   *  Parsed per bank by its adapter, so one odd cell in another bank's row (or an untracked tenor) fails nobody else. */
  fdr: Map<string, string[]>;
};

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
// Name, savings, five SND bands, then five fixed-deposit tenors: 12 cells per bank row.
const CELLS_PER_BANK = 12;
const FIRST_FDR_CELL = 7;

/** "8.50" -> 8.5–8.5, "8.50-8.90" -> 8.5–8.9, "" -> null. Anything else throws: a changed format must fail loudly. */
export function parseBbRate(text: string): BbRate | null {
  const s = text.replace(/\s+/g, "");
  if (s === "" || s === "-") return null;
  const m = /^(\d+(?:\.\d+)?)(?:[-\u2013\u2014](\d+(?:\.\d+)?))?$/.exec(s); // hyphen, en or em dash
  if (!m) throw new Error(`Bangladesh Bank chart: unreadable rate "${text}"`);
  const a = parseFloat(m[1]!);
  const b = m[2] ? parseFloat(m[2]) : a;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

/** Parses the chart's HTML table. Throws if the header layout or the month line is not what was verified. */
export function parseBbChart(html: string): BbChart {
  const $ = cheerio.load(html);
  const table = $("table").first();
  const header = table.find("tr").eq(1).find("td,th").map((_, c) => $(c).text().replace(/\s+/g, " ").trim()).get();
  if (!/^3 months but\s*<\s*6 months$/i.test(header[5] ?? "") || !/^1 year but\s*<\s*2 years$/i.test(header[7] ?? "")) {
    throw new Error("Bangladesh Bank chart: fixed-deposit tenor columns moved; nothing read");
  }
  let month: Date | null = null;
  const fdr = new Map<string, string[]>();
  for (const row of table.find("tr").toArray().slice(2)) {
    const cells = $(row).find("td,th").map((_, c) => $(c).text().replace(/\s+/g, " ").trim()).get();
    if (cells.length === 1) {
      const m = /^([A-Za-z]+),?\s+(\d{4})$/.exec(cells[0]!); // "September, 2026"; group rows ("SCBs", "PCBs") have no year
      const mi = m ? MONTHS.indexOf(m[1]!.toLowerCase()) : -1;
      if (m && mi >= 0) month = new Date(Date.UTC(Number(m[2]), mi, 1, 12));
      continue;
    }
    if (cells.length !== CELLS_PER_BANK || !cells[0]) continue;
    fdr.set(cells[0].toUpperCase(), cells.slice(FIRST_FDR_CELL));
  }
  if (!month) throw new Error("Bangladesh Bank chart: no month line found");
  if (fdr.size === 0) throw new Error("Bangladesh Bank chart: no bank rows found");
  return { month, fdr };
}

// One download serves every bank in a run; a second run more than 10 minutes later fetches again.
let cached: { at: number; chart: Promise<BbChart> } | null = null;
const CACHE_MS = 10 * 60_000;

export function fetchBbChart(now = Date.now()): Promise<BbChart> {
  if (cached && now - cached.at < CACHE_MS) return cached.chart;
  const chart = (async () => {
    const res = await fetch(BB_DEPOSIT_CHART_URL, {
      headers: { "User-Agent": "TakaTalks rate check (+https://www.takatalks.com); once a day" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Bangladesh Bank chart fetch failed: HTTP ${res.status}`);
    return parseBbChart((await readBodyCapped(res, 2_000_000, "Bangladesh Bank chart")).toString("utf8"));
  })();
  cached = { at: now, chart };
  // a failed download is retried by the next bank, not cached (unless a newer download already replaced it)
  chart.catch(() => {
    if (cached?.chart === chart) cached = null;
  });
  return chart;
}

/** A per-bank adapter reading that bank's row of the shared chart, so one missing row fails only that bank. */
export function bbChartAdapter(bankShortCode: string, chartCode: string, load: () => Promise<BbChart> = () => fetchBbChart()): RateAdapter {
  return {
    bankShortCode,
    async scrape(): Promise<ScrapedRate[]> {
      const chart = await load();
      const row = chart.fdr.get(chartCode);
      if (!row) throw new Error(`Bangladesh Bank chart: no row "${chartCode}" for ${chart.month.toISOString().slice(0, 7)}`);
      const rates: ScrapedRate[] = [];
      for (const termMonths of FDR_TERMS_MONTHS) {
        const r = parseBbRate(row[BB_CHART_FDR_COLUMN[termMonths]] ?? "");
        if (!r) continue; // the bank announces no rate for this tenor
        rates.push({
          instrument: "FDR",
          termMonths,
          ratePct: r.min,
          ...(r.max > r.min ? { ratePctMax: r.max } : {}),
          method: "SCRAPED",
          source: BB_DEPOSIT_CHART_URL,
          asOf: chart.month,
        });
      }
      if (rates.length === 0) throw new Error(`Bangladesh Bank chart: ${chartCode} has no 3-, 6- or 12-month rate`);
      return rates;
    },
  };
}
