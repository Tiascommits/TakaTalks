import type { Metadata } from "next";
import { ZakatHeader } from "@/components/zakat/ZakatHeader";
import { ZakatCalculator } from "@/components/zakat/ZakatCalculator";

export const metadata: Metadata = {
  title: "Zakat Calculator Bangladesh | TakaTalks",
  description:
    "Calculate 2.5% Zakat under Hanafi fiqh with current Bangladesh gold/silver Nisab. Supports bank FDR, Sanchayapatra, DSE stocks, and bank interest purification.",
};

export default function ZakatPage() {
  return (
    <div>
      <ZakatHeader />
      <ZakatCalculator />
    </div>
  );
}
