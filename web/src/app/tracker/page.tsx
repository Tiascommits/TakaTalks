import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { TrackerDashboard } from "@/components/tracker/TrackerDashboard";
import { TrackerHeader } from "@/components/tracker/TrackerHeader";

export const metadata = {
  title: "ইনকাম / ইনভেস্টমেন্ট ট্র্যাকার — Takatox",
};

export default async function TrackerPage() {
  const userId = await getCurrentUserId();

  const [incomeEntries, investmentEntries, profile] = userId
    ? await Promise.all([
        prisma.incomeEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.investmentEntry.findMany({ where: { userId }, orderBy: { maturityDate: "asc" } }),
        prisma.taxProfile.findUnique({ where: { userId } }),
      ])
    : [[], [], null];

  return (
    <>
      <TrackerHeader />

      <TrackerDashboard
        initialIncome={JSON.parse(JSON.stringify(incomeEntries))}
        initialInvestments={JSON.parse(JSON.stringify(investmentEntries))}
        initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
      />
    </>
  );
}
