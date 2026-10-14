import { TrustBanner } from "@/components/calculator/TrustBanner";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorHeader } from "@/components/calculator/CalculatorHeader";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { deriveTaxInputFromTracker } from "@/lib/tracker/derive-tax-input";

export const metadata = {
  title: "আয়কর এস্টিমেটর + রিবেট অপটিমাইজার — TakaTalks",
  description:
    "Estimate your Bangladesh income tax for income year 2025-26 (assessment year 2026-27) and see how much more to invest for the full rebate. No signup.",
};

export default async function CalculatorPage() {
  const userId = await getCurrentUserId();
  const [income, investments, profile] = userId
    ? await Promise.all([
        prisma.incomeEntry.findMany({ where: { userId } }),
        prisma.investmentEntry.findMany({ where: { userId } }),
        prisma.taxProfile.findUnique({ where: { userId } }),
      ])
    : [[], [], null];
  const initial = userId ? deriveTaxInputFromTracker(income, investments, profile) : undefined;

  return (
    <>
      <CalculatorHeader />

      <TrustBanner />
      <CalculatorForm initial={initial} />
    </>
  );
}
