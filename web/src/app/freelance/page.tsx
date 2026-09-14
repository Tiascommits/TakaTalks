import { FreelanceHeader } from "@/components/freelance/FreelanceHeader";
import { FreelanceCalculator } from "@/components/freelance/FreelanceCalculator";
import { TrustBanner } from "@/components/calculator/TrustBanner";

export const metadata = {
  title: "ফ্রিল্যান্স ট্যাক্স ও রেমিট্যান্স ক্যালকুলেটর — TakaTalks",
  description: "Bangladesh Freelancer Tax & Foreign Inward Remittance Calculator with ITES Exemption and Cash Incentive math",
};

export default function FreelancePage() {
  return (
    <>
      <FreelanceHeader />
      <TrustBanner />
      <FreelanceCalculator />
    </>
  );
}
