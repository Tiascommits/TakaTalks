import type { Metadata } from "next";
import { LoansHeader } from "@/components/loans/LoansHeader";
import { LoanCalculator } from "@/components/loans/LoanCalculator";

export const metadata: Metadata = {
  title: "Loan & Home EMI Calculator | TakaTalks",
  description:
    "Calculate reducing balance loan EMI for home mortgages, car loans, and personal loans in Bangladesh. Simulate extra prepayments to cut years and lakhs of Taka in interest.",
};

export default function LoansPage() {
  return (
    <div>
      <LoansHeader />
      <LoanCalculator />
    </div>
  );
}
