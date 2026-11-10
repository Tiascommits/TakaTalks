import { TrustBanner } from "@/components/calculator/TrustBanner";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorHeader } from "@/components/calculator/CalculatorHeader";

const title = "আয়কর এস্টিমেটর + রিবেট অপটিমাইজার — TakaTalks";
const description =
  "Estimate your Bangladesh income tax for income year 2025-26 (assessment year 2026-27) and see how much more to invest for the full rebate. No signup.";

export const metadata = {
  title,
  description,
  // The filing-season share card (no figures, see app/share-card/route.tsx). Setting openGraph
  // here replaces the layout's whole object, so it repeats siteName, type, title and description.
  openGraph: {
    siteName: "TakaTalks",
    type: "website",
    title,
    description,
    images: [{ url: "/share-card", width: 1200, height: 630, alt: "I'm filing my tax return before the deadline" }],
  },
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
