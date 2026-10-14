import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { checkBankForNewReport, pickDueBanks } from "@/lib/bank-health/fetch-reports";
import { extractFiguresFromPdf } from "@/lib/bank-health/extract-figures";

/**
 * Daily cron (see vercel.json). Each run checks the banks that are due (see
 * pickDueBanks), one by default to stay inside serverless time and memory
 * limits, so every configured report page is checked within a week and then
 * about monthly. Banks with no annualReportPageUrl are skipped, see
 * todo/needs-us-both/bank-annual-report-urls.md.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const bankIdParam = url.searchParams.get("bankId");
  const limit = Math.max(1, Math.min(5, parseInt(limitParam ?? "", 10) || 1));

  const banks = await prisma.bank.findMany({
    where: { active: true, annualReportPageUrl: { not: null }, ...(bankIdParam ? { id: bankIdParam } : {}) },
    include: { annualReportCheckLogs: { orderBy: { checkedAt: "desc" }, take: 1, select: { checkedAt: true } } },
  });
  const withLastCheck = banks.map((b) => ({ ...b, lastCheckedAt: b.annualReportCheckLogs[0]?.checkedAt ?? null }));
  // An explicit bankId is a manual re-check, so it runs even if checked recently.
  const due = bankIdParam ? withLastCheck : pickDueBanks(withLastCheck, new Date(), limit);

  let checked = 0;
  let newDocs = 0;
  let figuresExtracted = 0;

  for (const bank of due) {
    checked++;
    const result = await checkBankForNewReport(bank);
    if (result.status !== "new_doc") continue;

    newDocs++;
    const { fiscalYear, candidates } = await extractFiguresFromPdf(result.pdfBuffer);
    for (const c of candidates) {
      await prisma.extractedFigure.create({
        data: {
          bankId: bank.id,
          fiscalYear,
          field: c.field,
          rawValue: c.rawValue,
          numericValue: c.numericValue,
          extractionConfidence: c.extractionConfidence,
          sourceReportUrl: result.docUrl,
          sourcePageOrNote: c.sourcePageOrNote,
        },
      });
      figuresExtracted++;
    }
  }

  return NextResponse.json({ banksChecked: checked, newDocs, figuresExtracted });
}
