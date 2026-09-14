import { GoalsHeader } from "@/components/goals/GoalsHeader";
import { GoalPlanner } from "@/components/goals/GoalPlanner";
import { TrustBanner } from "@/components/calculator/TrustBanner";

export const metadata = {
  title: "লাইফ গোল ও ওয়েলথ প্ল্যানার — TakaTalks",
  description: "Bangladesh Life Goal & Retirement Planner with Inflation Adjustment and DPS SIP Math",
};

export default function GoalsPage() {
  return (
    <>
      <GoalsHeader />
      <TrustBanner />
      <GoalPlanner />
    </>
  );
}
