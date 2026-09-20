import type { Metadata } from "next";
import { VerifyConfirm } from "@/components/account/VerifyConfirm";

export const metadata: Metadata = {
  title: "লগইন নিশ্চিত করুন — TakaTalks",
  description: "Confirm your TakaTalks magic-link login to activate maturity reminders.",
  // The URL carries a single-use token; keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default function AccountVerifyPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <VerifyConfirm />
    </main>
  );
}
