import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { TrackerDashboard } from "@/components/tracker/TrackerDashboard";

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
      <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
        <div className="max-w-[1160px] mx-auto">
          <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
            INCOME &amp; INVESTMENT TRACKER
          </p>
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
            তোমার আয় ও বিনিয়োগ, একটা জায়গায়
          </h1>
          <p className="max-w-[700px] text-sm text-[#DCE6DD]">
            যোগ করলেই save হবে, প্রথমবার save করার সময় হালকা একটা account তৈরি হয় — কোনো ইমেইল বা
            পাসওয়ার্ড লাগবে না।
          </p>
        </div>
      </header>

      <TrackerDashboard
        initialIncome={JSON.parse(JSON.stringify(incomeEntries))}
        initialInvestments={JSON.parse(JSON.stringify(investmentEntries))}
        initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
      />
    </>
  );
}
