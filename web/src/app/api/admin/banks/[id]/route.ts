import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

// Manual entry point for the fields Module 4 can't scrape: credit rating
// (cite agency + date), and a link to the bank's latest published financial
// statement. Left null ("not available" in the UI) until someone enters a
// verified value here — never inferred or estimated.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const {
    creditRating,
    ratingAgency,
    ratingDate,
    statementUrl,
    rateCardUrl,
    websiteUrl,
    annualReportPageUrl,
    dseCompanyUrl,
  } = body ?? {};

  const data: Record<string, string | Date | null> = {};
  if (creditRating !== undefined) data.creditRating = creditRating || null;
  if (ratingAgency !== undefined) data.ratingAgency = ratingAgency || null;
  if (ratingDate !== undefined) data.ratingDate = ratingDate ? new Date(ratingDate) : null;
  if (statementUrl !== undefined) data.statementUrl = statementUrl || null;
  if (rateCardUrl !== undefined) data.rateCardUrl = rateCardUrl || null;
  if (websiteUrl !== undefined) data.websiteUrl = websiteUrl || null;
  // Module 5 (bank-health): manually-supplied source URLs, see
  // prompts/03-annual-report-extraction.md — never guessed from a pattern.
  if (annualReportPageUrl !== undefined) data.annualReportPageUrl = annualReportPageUrl || null;
  if (dseCompanyUrl !== undefined) data.dseCompanyUrl = dseCompanyUrl || null;

  const bank = await prisma.bank.update({ where: { id }, data }).catch(() => null);
  if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 });

  await logAdminAction("bank.update", "Bank", id, data);
  return NextResponse.json({ bank });
}
