import { adminUserCount, isAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminSetupForm } from "@/components/admin/AdminSetupForm";
import { AdminBankHealthDashboard } from "@/components/admin/AdminBankHealthDashboard";

export const metadata = { title: "Admin: Bank health review — Takatox" };
export const dynamic = "force-dynamic";

export default async function AdminBankHealthPage() {
  const authed = await isAdmin();
  if (!authed) {
    const setupNeeded = (await adminUserCount()) === 0;
    return (
      <div className="max-w-[420px] mx-auto mt-16 px-5">
        {setupNeeded ? <AdminSetupForm /> : <AdminLoginForm />}
      </div>
    );
  }

  const pending = await prisma.extractedFigure.findMany({
    where: { approved: false },
    include: { bank: { select: { name: true } } },
    orderBy: [{ bankId: "asc" }, { fiscalYear: "desc" }],
  });

  const dto = pending.map((f) => ({
    id: f.id,
    bankId: f.bankId,
    bankName: f.bank.name,
    fiscalYear: f.fiscalYear,
    field: f.field,
    rawValue: f.rawValue,
    numericValue: f.numericValue,
    extractionConfidence: f.extractionConfidence,
    sourceReportUrl: f.sourceReportUrl,
    sourcePageOrNote: f.sourcePageOrNote,
    extractedAt: f.extractedAt,
  }));

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16">
      <h1 className="font-serif font-semibold text-2xl text-green-deep mb-1">
        Admin: Bank health review
      </h1>
      <p className="text-xs text-muted mb-4">
        Nothing here reaches the public scorecard until approved (or corrected then
        approved). Reject anything that&apos;s clearly wrong rather than approving with a
        guessed correction.
      </p>
      <AdminBankHealthDashboard figures={JSON.parse(JSON.stringify(dto))} />
    </div>
  );
}
