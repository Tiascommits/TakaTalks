import { InstrumentsHeader } from "@/components/instruments/InstrumentsHeader";
import { InstrumentMatrix } from "@/components/instruments/InstrumentMatrix";
import { TrustBanner } from "@/components/calculator/TrustBanner";

export const metadata = {
  title: "প্রকৃত মুনাফা ম্যাট্রিক্স — সঞ্চয়পত্র, এফডিআর ও সুকুক — Takatox",
  description: "Bangladesh Real Yield Matrix comparing Sanchayapatra, Bank FDR, DPS, and Govt Treasury Bonds after TDS and Inflation",
};

export default function InstrumentsPage() {
  return (
    <>
      <InstrumentsHeader />
      <TrustBanner />
      <InstrumentMatrix />
    </>
  );
}
