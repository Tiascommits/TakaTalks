import type { Metadata } from "next";
import { CarHeader } from "@/components/cars/CarHeader";
import { CarCalculator } from "@/components/cars/CarCalculator";
import { TrustBanner } from "@/components/calculator/TrustBanner";

export const metadata: Metadata = {
  title: "গাড়ি কেনা ও বিআরটিএ অগ্রিম কর (AIT) ক্যালকুলেটর — TakaTalks",
  description:
    "Evaluate car engine CC tiers, BRTA Advance Income Tax (AIT), tax absorption break-even, multiple-car wealth surcharge penalties, and total cost of ownership under Bangladesh Income Tax Act 2023.",
};

export default function CarsPage() {
  return (
    <>
      <CarHeader />
      <TrustBanner />
      <CarCalculator />
    </>
  );
}
