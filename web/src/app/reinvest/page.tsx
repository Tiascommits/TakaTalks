import { ReinvestHeader } from "@/components/reinvest/ReinvestHeader";
import { ReinvestPlanner } from "@/components/reinvest/ReinvestPlanner";
import { TrustBanner } from "@/components/calculator/TrustBanner";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { getReinvestContextForUser } from "@/lib/reinvest/log";
import type { TaxCalculationResult } from "@/lib/tax/types";

export const metadata = {
  title: "পুনঃবিনিয়োগ পরামর্শ — TakaTalks",
  description:
    "Bangladesh reinvestment suggestion tool — ranks Sanchayapatra, Govt Bonds, Bank FDR, and Mutual Funds by after-tax return, tax-rebate headroom, and your goal timeline. Category math only, never a named-bank verdict.",
};

export default async function ReinvestPage({
  searchParams,
}: {
  searchParams: Promise<{ investmentEntryId?: string }>;
}) {
  const { investmentEntryId } = await searchParams;
  const userId = await getCurrentUserId();

  let taxResult: TaxCalculationResult | null = null;
  let defaultAmount = 100_000;
  let defaultHorizonYears = 3;
  let investmentLabel: string | null = null;
  let investmentEntryIdForClient: string | null = null;

  if (userId) {
    const ctx = await getReinvestContextForUser(userId);
    taxResult = ctx.taxResult;
    defaultAmount = ctx.defaultAmount;
    defaultHorizonYears = ctx.defaultHorizonYears;

    if (investmentEntryId) {
      const inv = await prisma.investmentEntry.findUnique({ where: { id: investmentEntryId } });
      if (inv && inv.userId === userId) {
        investmentEntryIdForClient = inv.id;
        investmentLabel = inv.label;
        defaultAmount = inv.payoutAmount ?? inv.principalAmount;
        defaultHorizonYears = Math.max(0.5, inv.termMonths / 12);
      }
    }
  }

  return (
    <>
      <ReinvestHeader />
      <TrustBanner />
      <ReinvestPlanner
        initialAmount={defaultAmount}
        initialHorizonYears={defaultHorizonYears}
        taxResult={taxResult ? JSON.parse(JSON.stringify(taxResult)) : null}
        investmentEntryId={investmentEntryIdForClient}
        investmentLabel={investmentLabel}
      />
    </>
  );
}
