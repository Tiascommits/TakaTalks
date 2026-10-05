import { HabitsHeader } from "@/components/habits/HabitsHeader";
import { DeviceOnlyBanner } from "@/components/habits/DeviceOnlyBanner";
import { HabitTracker } from "@/components/habits/HabitTracker";

export const metadata = {
  title: "মানি হ্যাবিট ট্র্যাকার ও গাইড — TakaTalks",
  description:
    "Track the small repeating spends — data packs, delivery, rides, subscriptions — and see the monthly, yearly and compounded cost of each habit.",
};

export default function HabitsPage() {
  return (
    <>
      <HabitsHeader />
      <DeviceOnlyBanner />
      <HabitTracker />
    </>
  );
}
