import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

export type FetchReportResult =
  | { status: "no_source" }
  | { status: "no_pdf_found" }
  | { status: "unchanged"; docUrl: string }
  | { status: "fetch_error"; errorMessage: string }
  | { status: "new_doc"; docUrl: string; pdfBuffer: Buffer };

/**
 * Finds the most-likely-current annual report PDF linked from a bank's
 * investor-relations page. Heuristic only — prefers a link whose text/href
 * mentions "annual report", falls back to the first PDF link on the page.
 * Every result (including failures) gets an AnnualReportCheckLog row so a
 * bank whose page never yields anything is visible in the admin view.
 */
export async function checkBankForNewReport(bank: {
  id: string;
  annualReportPageUrl: string | null;
}): Promise<FetchReportResult> {
  if (!bank.annualReportPageUrl) return { status: "no_source" };

  let pageHtml: string;
  try {
    const res = await fetch(bank.annualReportPageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
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

  const best =
    pdfLinks.find((l) => l.text.includes("annual report") || l.href.toLowerCase().includes("annual"))
      ?? pdfLinks[0];

  if (!best) {
    await prisma.annualReportCheckLog.create({
      data: { bankId: bank.id, foundNewDoc: false },
    });
    return { status: "no_pdf_found" };
  }

  const docUrl = new URL(best.href, bank.annualReportPageUrl).toString();

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
    const pdfRes = await fetch(docUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
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
