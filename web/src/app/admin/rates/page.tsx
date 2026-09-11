import { adminUserCount, isAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { getDigest } from "@/lib/rates/digest";
import { RATE_ADAPTERS } from "@/lib/rates/adapters/registry";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminSetupForm } from "@/components/admin/AdminSetupForm";
import { AdminRatesDashboard } from "@/components/admin/AdminRatesDashboard";

export const metadata = { title: "Admin: Rate monitoring — Takatox" };
export const dynamic = "force-dynamic";

export default async function AdminRatesPage() {
  const authed = await isAdmin();

  if (!authed) {
    const setupNeeded = (await adminUserCount()) === 0;
    return (
      <div className="max-w-[420px] mx-auto mt-16 px-5">
        {setupNeeded ? <AdminSetupForm /> : <AdminLoginForm />}
      </div>
    );
  }

  const [banks, digest, bbAggregates] = await Promise.all([
    prisma.bank.findMany({
      orderBy: { name: "asc" },
      include: {
        scrapeLogs: { orderBy: { attemptedAt: "desc" }, take: 1 },
        rateSnapshots: { orderBy: { scrapedAt: "desc" }, take: 1 },
      },
    }),
    getDigest(),
    prisma.bBAggregateRate.findMany({ orderBy: { enteredAt: "desc" }, take: 5 }),
  ]);

  const banksWithAdapterFlag = banks.map((b) => ({
    id: b.id,
    shortCode: b.shortCode,
    name: b.name,
    type: b.type,
    active: b.active,
    hasAdapter: RATE_ADAPTERS.has(b.shortCode),
    creditRating: b.creditRating,
    ratingAgency: b.ratingAgency,
    ratingDate: b.ratingDate,
    statementUrl: b.statementUrl,
    websiteUrl: b.websiteUrl,
    rateCardUrl: b.rateCardUrl,
    annualReportPageUrl: b.annualReportPageUrl,
    dseCompanyUrl: b.dseCompanyUrl,
    lastLog: b.scrapeLogs[0]
      ? { success: b.scrapeLogs[0].success, attemptedAt: b.scrapeLogs[0].attemptedAt }
      : null,
    lastSnapshotAt: b.rateSnapshots[0]?.scrapedAt ?? null,
  }));

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16">
      <h1 className="font-serif font-semibold text-2xl text-green-deep mb-4">
        Admin: Rate monitoring
      </h1>
      <AdminRatesDashboard
        banks={JSON.parse(JSON.stringify(banksWithAdapterFlag))}
        digest={JSON.parse(JSON.stringify(digest))}
        bbAggregates={JSON.parse(JSON.stringify(bbAggregates))}
      />
    </div>
  );
}
