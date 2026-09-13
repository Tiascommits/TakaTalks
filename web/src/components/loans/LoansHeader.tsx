"use client";

import { useLanguage } from "@/lib/i18n";

export function LoansHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "LOAN EMI & PREPAYMENT ACCELERATOR — REDUCING BALANCE MATH",
            "লোন ইএমআই ও প্রি-পেমেন্ট অ্যাক্সিলারেটর — রিডিউসিং ব্যালেন্স হিসাব"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Loan & Home EMI Calculator — Slash interest & finish years early",
            "লোন ও গৃহঋণ ইএমআই ক্যালকুলেটর — লাখ লাখ টাকা সুদ বাঁচান"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Model apartment mortgages (DBH, IFIC, City Bank), auto loans, and personal loans. See exact monthly EMI, NBR excise duty, and how extra monthly prepayments can shave 5 to 10 years off your loan tenure.",
            "ফ্ল্যাট কেনার গৃহঋণ (DBH, ব্যাংক), গাড়ি ঋণ বা পার্সোনাল লোনের সঠিক মাসিক কিস্তি হিসাব করুন। এনবিআর আবগারি শুল্ক (Excise Duty) ও সামান্য অগ্রিম কিস্তি দিয়ে বছরের পর বছর আগেই ঋণমুক্ত হওয়ার সুযোগ জানুন।"
          )}
        </p>
      </div>
    </header>
  );
}
