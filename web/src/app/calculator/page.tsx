import { TrustBanner } from "@/components/calculator/TrustBanner";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { deriveTaxInputFromTracker } from "@/lib/tracker/derive-tax-input";

export const metadata = {
  title: "আয়কর এস্টিমেটর + রিবেট অপটিমাইজার — Takatox",
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
      <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
        <div className="max-w-[1160px] mx-auto">
          <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
            ESTIMATE TOOL — NOT AN OFFICIAL NBR SERVICE, NOT A FILING
          </p>
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
            আয়কর এস্টিমেটর — দেখো তুমি মোটামুটি কোথায় আছো
          </h1>
          <p className="max-w-[700px] text-sm text-[#DCE6DD]">
            Type kore dekho tomar tax roughly koto hote pare, kono account/signup lagbe na।
            Salary, business, house property, capital gains, investment rebate সব একসাথে
            estimate kore dekhায়। Rebate optimizer বলে দেবে আরো কতটুকু invest করলে tax কমবে।
          </p>
        </div>
      </header>

      <TrustBanner />
      <CalculatorForm initial={initial} />
    </>
  );
}
