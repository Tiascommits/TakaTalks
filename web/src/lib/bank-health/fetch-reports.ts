import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { assertPublicUrl, fetchPublic, readBodyCapped } from "@/lib/net/safe-fetch";
import { BANK_HEALTH_RECHECK_DAYS } from "@/config/rate-monitoring";
import { choice } from "@typesafe-ai/sdk";
import { jevClient, type JevClient } from "@/lib/jev/client";

export type FetchReportResult =
  | { status: "no_source" }
  | { status: "no_pdf_found" }
  | { status: "unchanged"; docUrl: string }
  | { status: "fetch_error"; errorMessage: string }
  | { status: "new_doc"; docUrl: string; pdfBuffer: Buffer };

const MAX_PAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024; // serverless processing limit

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
  const best = rankReportLinks(pdfLinks)[0];
  return best && best.score > 0 ? best.link : null;
}

/** Every link with its heuristic score and newest year, best first. */
function rankReportLinks(pdfLinks: PdfLink[]) {
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

  return scored.sort((a, b) => b.score - a.score || b.year - a.year);
}

/** Jev Task 1.1: what each PDF link on a report page is (todo/system-one-jev.md). */
export const REPORT_DOC_TYPES = {
  audited_annual_report: "The bank's audited annual report, or its audited annual financial statements for a full year",
  quarterly_financials: "Quarterly or half-yearly (unaudited) financial statements",
  credit_rating_report: "A credit rating report or rating letter",
  basel_iii_disclosure: "Basel III / Pillar 3 risk-based capital disclosures",
  directors_report_only: "A standalone directors' report, not the full annual report",
  agm_notice: "An AGM notice, proxy form or price-sensitive notice",
  marketing_leaflets: "A product brochure, reward leaflet, schedule of charges or other marketing",
} as const;

export type ReportDocType = keyof typeof REPORT_DOC_TYPES;
export type ClassifiedLink = { link: PdfLink; docType: ReportDocType; confidence: number };

// shortcut: classifies only the heuristic's top 25 (AB Bank's page links 167 PDFs); raise it if a report ranks lower.
const MAX_CLASSIFIED_LINKS = 25;
const MIN_REPORT_CONFIDENCE = 0.5;

/**
 * Asks Jev what each candidate link is, in one call. Null when Jev is off
 * (no TYPESAFE_API_KEY) or the call fails: the caller keeps the heuristic.
 */
export async function classifyReportLinks(
  pdfLinks: PdfLink[],
  client: JevClient | null = jevClient()
): Promise<ClassifiedLink[] | null> {
  const links = rankReportLinks(pdfLinks).slice(0, MAX_CLASSIFIED_LINKS).map((s) => s.link);
  if (!client || links.length === 0) return null;
  try {
    const questions = Object.fromEntries(
      links.map((l, i) => [`link${i}`, choice({ question: "What kind of document does this PDF link point to?", link: l }, REPORT_DOC_TYPES)])
    );
    const { answers } = await client.systemOne({
      state: "PDF links (anchor text and href) found on a Bangladeshi bank's investor-relations or financial-reports page.",
      questions,
    });
    return links.map((link, i) => {
      const a = answers[`link${i}`];
      return { link, docType: a.choice as ReportDocType, confidence: a.confidence };
    });
  } catch (err) {
    console.warn("[jev] link classification failed, keeping the heuristic:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** The newest link Jev calls an audited annual report, or null when none is. */
export function pickFromClassified(classified: ClassifiedLink[]): PdfLink | null {
  const reports = classified
    .filter((c) => c.docType === "audited_annual_report" && c.confidence >= MIN_REPORT_CONFIDENCE)
    .map((c) => {
      const years = [...`${c.link.text} ${c.link.href}`.matchAll(BARE_YEAR)].map((m) => Number(m[1]));
      return { ...c, year: years.length ? Math.max(...years) : 0 };
    })
    .sort((a, b) => b.year - a.year || b.confidence - a.confidence);
  return reports[0]?.link ?? null;
}

/**
 * Which banks the daily bank-health cron checks now: never-checked first,
 * then the longest unchecked, skipping any checked in the last
 * BANK_HEALTH_RECHECK_DAYS. At one bank a run (Vercel Hobby allows one cron
 * run a day) that covers the 7 configured report pages in a week, then
 * each about monthly.
 */
export function pickDueBanks<T extends { lastCheckedAt: Date | null }>(banks: T[], now: Date, limit: number): T[] {
  const cutoff = now.getTime() - BANK_HEALTH_RECHECK_DAYS * 86_400_000;
  return banks
    .filter((b) => !b.lastCheckedAt || b.lastCheckedAt.getTime() <= cutoff)
    .sort((a, b) => (a.lastCheckedAt?.getTime() ?? 0) - (b.lastCheckedAt?.getTime() ?? 0))
    .slice(0, limit);
}

/**
 * Finds the most-likely-current annual report PDF linked from a bank's
 * investor-relations page. Heuristic only — see pickAnnualReportLink.
 * Every result (including failures) gets an AnnualReportCheckLog row so a
 * bank whose page never yields anything is visible in the admin view.
 */
export async function checkBankForNewReport(bank: {
  id: string;
  annualReportPageUrl: string | null;
}): Promise<FetchReportResult> {
  if (!bank.annualReportPageUrl) return { status: "no_source" };
  try {
    await assertPublicUrl(bank.annualReportPageUrl);
  } catch {
    const errorMessage = "Invalid bank annual report URL";
    // Logged like every other outcome, or pickDueBanks would pick this bank first every day.
    await prisma.annualReportCheckLog.create({ data: { bankId: bank.id, foundNewDoc: false, errorMessage } });
    return { status: "fetch_error", errorMessage };
  }

  let pageHtml: string;
  try {
    const res = await fetchPublic(bank.annualReportPageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pageHtml = (await readBodyCapped(res, MAX_PAGE_BYTES, "Report page")).toString("utf8");
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

  // Shadow mode (Boundary C, todo/needs-us-both/system-one-jev-policy-and-gates.md):
  // the heuristic still decides; Jev's pick is only logged when it differs.
  const classified = await classifyReportLinks(pdfLinks);
  const jevPick = classified && pickFromClassified(classified);
  if (classified && jevPick?.href !== best?.href) {
    console.warn(`[jev-shadow] bank ${bank.id}: heuristic picked ${best?.href ?? "nothing"}, Jev picked ${jevPick?.href ?? "nothing"}`);
  }

  if (!best) {
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false },
    });
    return { status: "no_pdf_found" };
  }

  const docUrl = new URL(best.href, bank.annualReportPageUrl).toString();
  try {
    await assertPublicUrl(docUrl);
  } catch {
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
    const pdfRes = await fetchPublic(docUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);

    // Capped while streaming, so a missing/lying Content-Length can't bypass it.
    const pdfBuffer = await readBodyCapped(pdfRes, MAX_PDF_BYTES, "PDF");
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
