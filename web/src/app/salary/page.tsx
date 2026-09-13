import { SalaryHeader } from "@/components/salary/SalaryHeader";
import { SalaryComparator } from "@/components/salary/SalaryComparator";
import { TrustBanner } from "@/components/calculator/TrustBanner";

export const metadata = {
  title: "স্যালারি অফার তুলনাকারী ও ইন-হ্যান্ড পে — Takatox",
  description: "Bangladesh Salary Offer Comparison and Net Take-Home Pay Calculator under Income Tax Act 2023",
};

export default function SalaryPage() {
  return (
    <>
      <SalaryHeader />
      <TrustBanner />
      <SalaryComparator />
    </>
  );
}
