import { FreedomHeader } from "@/components/freedom/FreedomHeader";
import { FreedomPlanner } from "@/components/freedom/FreedomPlanner";

export const metadata = {
  title: "আর্থিক স্বাধীনতা ক্যালকুলেটর ও রোডম্যাপ — TakaTalks",
  description:
    "Work out your financial freedom number for the life you actually want — inflation-adjusted, net of existing passive income, with a corpus allocation and a year-by-year roadmap.",
};

export default function FreedomPage() {
  return (
    <>
      <FreedomHeader />
      <FreedomPlanner />
    </>
  );
}
