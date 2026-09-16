import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";
import type { RateAdapter, ScrapedRate } from "./types";

const PAGE_URL = "https://www.ificbank.com.bd/deposit-rate";

/**
 * Verified live on 2026-09-16: ificbank.com.bd's deposit-rate page has no
 * HTML rate table — it embeds a PDF ("...Latest Deposit...<date>.pdf",
 * filename changes on every rate revision) via an iframe, with a "Download"
 * link alongside it. That link text is generic (every embedded PDF on the
 * page, including an unrelated "Declared Interest Rate" annex, is also
 * labelled "Download"), so the right one is picked by filename instead.
 *
 * Reuses the same `pdf-parse` dependency Module 5 uses for report
 * extraction. The PDF's "G. Term Deposit" table lists 6 amount tiers x 6
 * tenors (1/3/6 months, 1/2/3 years); like national-bank.ts, this takes the
 * smallest tier ("Up to Tk. 1,00,000") as the representative rate, for
 * comparability across banks — larger deposits get better rates on IFIC's
 * own table.
 */
export const ificBankAdapter: RateAdapter = {
  bankShortCode: "IFIC",
  async scrape(): Promise<ScrapedRate[]> {
    const pageRes = await fetch(PAGE_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!pageRes.ok) throw new Error(`IFIC Bank page fetch failed: HTTP ${pageRes.status}`);
    const $ = cheerio.load(await pageRes.text());

    const pdfHref = $("a[href$='.pdf']")
      .toArray()
      .map((el) => $(el).attr("href") ?? "")
      .find((href) => /latest[\s_-]*deposit/i.test(href) && !/islamic/i.test(href));
    if (!pdfHref) {
      throw new Error("IFIC Bank: no 'Latest Deposit' rate PDF link found — page structure may have changed");
    }

    const pdfUrl = new URL(pdfHref, PAGE_URL).toString();
    const pdfRes = await fetch(pdfUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!pdfRes.ok) throw new Error(`IFIC Bank PDF fetch failed: HTTP ${pdfRes.status}`);
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    const parser = new PDFParse({ data: pdfBuffer });
    let text: string;
    try {
      text = (await parser.getText()).text.replace(/\s+/g, " ");
    } finally {
      await parser.destroy();
    }

    const headerMatch = text.match(/1 Month 0?3 Months? 0?6 Months? 1 Year 2 Years? 3 Years?/i);
    if (!headerMatch) {
      throw new Error("IFIC Bank: term-deposit tenor header not found in PDF — layout may have changed");
    }

    const afterHeader = text.slice(headerMatch.index! + headerMatch[0].length);
    const rowMatch = afterHeader.match(
      /^\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%/
    );
    if (!rowMatch) {
      throw new Error("IFIC Bank: smallest-tier term-deposit row not found after tenor header");
    }

    const [, , threeMonth, sixMonth, oneYear] = rowMatch;
    return [
      { instrument: "FDR", termMonths: 3, ratePct: parseFloat(threeMonth), method: "SCRAPED", source: pdfUrl },
      { instrument: "FDR", termMonths: 6, ratePct: parseFloat(sixMonth), method: "SCRAPED", source: pdfUrl },
      { instrument: "FDR", termMonths: 12, ratePct: parseFloat(oneYear), method: "SCRAPED", source: pdfUrl },
    ];
  },
};
