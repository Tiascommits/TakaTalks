import { TrustBanner } from "@/components/calculator/TrustBanner";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorHeader } from "@/components/calculator/CalculatorHeader";

export const metadata = {
  title: "আয়কর এস্টিমেটর + রিবেট অপটিমাইজার — TakaTalks",
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
