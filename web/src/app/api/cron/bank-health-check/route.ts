import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { checkBankForNewReport } from "@/lib/bank-health/fetch-reports";
import { extractFiguresFromPdf } from "@/lib/bank-health/extract-figures";

/**
 * Monthly cron (see vercel.json) — annual reports update rarely, so this
 * runs far less often than the daily rate scraper. Ships functional-but-
 * empty for any bank with no annualReportPageUrl set yet, see
 * todo/needs-us-both/bank-annual-report-urls.md.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const banks = await prisma.bank.findMany({
    where: { active: true, annualReportPageUrl: { not: null } },
  });

  let checked = 0;
  let newDocs = 0;
  let figuresExtracted = 0;

  for (const bank of banks) {
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
