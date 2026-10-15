import { TrustBanner } from "@/components/calculator/TrustBanner";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorHeader } from "@/components/calculator/CalculatorHeader";

export const metadata = {
  title: "আয়কর এস্টিমেটর + রিবেট অপটিমাইজার — TakaTalks",
  description:
    "Estimate your Bangladesh income tax for income year 2025-26 (assessment year 2026-27) and see how much more to invest for the full rebate. No signup.",
};

export default function CalculatorPage() {
  return (
    <>
      <CalculatorHeader />

      <TrustBanner />
      <CalculatorForm />
    </>
  );
}
