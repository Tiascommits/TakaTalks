import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

export type FetchReportResult =
  | { status: "no_source" }
  | { status: "no_pdf_found" }
  | { status: "unchanged"; docUrl: string }
  | { status: "fetch_error"; errorMessage: string }
  | { status: "new_doc"; docUrl: string; pdfBuffer: Buffer };

export type PdfLink = { href: string; text: string };

/**
 * "Annual Report 2025", "AR_2025" (BRAC's S3 filenames use this and give
 * the anchor no text at all, so the href has to carry the match).
 */
const STRONG_REPORT = /annual[\s_-]*report|(?<![A-Za-z])AR[\s_-]?20\d{2}(?!\d)/i;

/**
 * Standard Chartered Bangladesh is a branch operation, not a listed
 * company — it publishes "Financial Statements <year>" and never an
 * "annual report". Accepted only when nothing scores on STRONG_REPORT.
 */
const MEDIUM_REPORT = /(audited[\s_-]*)?financial[\s_-]*statements?/i;

/**
 * Documents that sit next to the annual report on the same page and would
 * otherwise win on a naive "href contains annual" test. Real examples hit
 * while verifying the bank list: AB Bank's investor page links
 * `2014-annual-report-credit-rating.pdf` (a 12-year-old rating letter),
 * SCB's page is nothing but Basel III disclosures, and EBL links a
 * standalone `Directors_Report_2025.pdf`.
 */
const REPORT_NOISE =
  /credit[\s_-]*rating|brochure|reward|redemption|proxy|notice|agm|psi|price[\s_-]*sensitive|esg|climate|sustainab|half[\s_-]*year|quarter|unclaimed|schedule[\s_-]*of[\s_-]*charge|director'?s?[\s_-]*report|basel|pillar/i;

/** Bare 4-digit year — not the `1780917670_` upload timestamp that
 * prefixes Islami Bank's filenames, which otherwise reads as "2030". */
const BARE_YEAR = /(?<!\d)(20\d{2})(?!\d)/g;

/**
 * Picks the most-likely-current annual report from a page's PDF links.
 * Returns null rather than guessing when nothing looks like a report —
 * the old behaviour of falling back to the first PDF on the page made
 * half the verified bank pages yield the wrong document.
 */
export function pickAnnualReportLink(pdfLinks: PdfLink[]): PdfLink | null {
  const scored = pdfLinks.map((link) => {
    const haystack = `${link.text} ${link.href}`;
    let score = 0;
    if (STRONG_REPORT.test(link.text)) score += 6;
    if (STRONG_REPORT.test(link.href)) score += 5;
    if (score === 0 && MEDIUM_REPORT.test(haystack)) score += 3;
    if (REPORT_NOISE.test(haystack)) score -= 8;

    const years = [...haystack.matchAll(BARE_YEAR)].map((m) => Number(m[1]));
    return { link, score, year: years.length ? Math.max(...years) : 0 };
  });

  const best = scored.sort((a, b) => b.score - a.score || b.year - a.year)[0];
  return best && best.score > 0 ? best.link : null;
}

/**
 * Finds the most-likely-current annual report PDF linked from a bank's
 * investor-relations page. Heuristic only — see pickAnnualReportLink.
 * Every result (including failures) gets an AnnualReportCheckLog row so a
 * bank whose page never yields anything is visible in the admin view.
 */
function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const hostname = u.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function checkBankForNewReport(bank: {
  id: string;
  annualReportPageUrl: string | null;
}): Promise<FetchReportResult> {
  if (!bank.annualReportPageUrl) return { status: "no_source" };
  if (!isSafeHttpUrl(bank.annualReportPageUrl)) {
    return { status: "fetch_error", errorMessage: "Invalid bank annual report URL" };
  }

  let pageHtml: string;
  try {
    const res = await fetch(bank.annualReportPageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pageHtml = await res.text();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false, errorMessage },
    });
    return { status: "fetch_error", errorMessage };
  }

  const $ = cheerio.load(pageHtml);
  const pdfLinks = $("a[href$='.pdf'], a[href*='.pdf?']")
    .map((_, el) => ({
      href: $(el).attr("href") ?? "",
      text: $(el).text().toLowerCase(),
    }))
    .toArray()
    .filter((l) => l.href);

  const best = pickAnnualReportLink(pdfLinks);

  if (!best) {
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false },
    });
    return { status: "no_pdf_found" };
  }

  const docUrl = new URL(best.href, bank.annualReportPageUrl).toString();
  if (!isSafeHttpUrl(docUrl)) {
    const errorMessage = "Unsafe PDF link destination";
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false, errorMessage },
    });
    return { status: "fetch_error", errorMessage };
  }

  const lastLog = await prisma.annualReportCheckLog.findFirst({
    where: { bankId: bank.id, docUrl: { not: null } },
    orderBy: { checkedAt: "desc" },
  });
  if (lastLog?.docUrl === docUrl) {
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false, docUrl },
    });
    return { status: "unchanged", docUrl };
  }

  try {
    const pdfRes = await fetch(docUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);

    const contentLength = pdfRes.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 25 * 1024 * 1024) {
      throw new Error("PDF exceeds 25MB safety limit for serverless processing");
    }

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: true, docUrl },
    });
    return { status: "new_doc", docUrl, pdfBuffer };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false, docUrl, errorMessage },
    });
    return { status: "fetch_error", errorMessage };
  }
}
