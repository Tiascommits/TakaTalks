"use client";

import { useLanguage } from "@/lib/i18n";

export function SalaryHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "JOB OFFER BENCHMARK & IN-HAND CALCULATOR — INCOME TAX ACT 2023",
            "চাকরির অফার তুলনাকারী ও ইন-হ্যান্ড ক্যালকুলেটর — আয়কর আইন ২০২৩"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Salary Offer Comparator — see your true bank in-hand pay",
            "স্যালারি অফার তুলনাকারী — আপনার আসল ব্যাংকে জমা বেতন দেখুন"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Comparing job offers? Gross CTC is misleading. Compare your current role against new offers side-by-side to see the exact monthly bank credit after 10% PF and statutory Section 86 monthly TDS under the Income Tax Act 2023.",
            "চাকরি পরিবর্তনের কথা ভাবছেন? উচ্চ গ্রস অফার অনেক সময় বেশি করের কারণে কম ইন-হ্যান্ড দেয়। পাশাপাশি তুলনা করে দেখুন বাড়ি ভাড়া, চিকিৎসা ভাতা, পিএফ ম্যাচিং ও মাসিক উৎস কর (TDS) কাটার পর মাসের ১ তারিখে ব্যাংকে ঠিক কত টাকা জমা হবে।"
          )}
        </p>
      </div>
    </header>
  );
}
