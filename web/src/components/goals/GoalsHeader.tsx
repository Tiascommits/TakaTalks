"use client";

import { useLanguage } from "@/lib/i18n";

export function GoalsHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "LIFE MILESTONE & RETIREMENT ENGINE — INFLATION-ADJUSTED",
            "লাইফ মাইলস্টোন ও রিটায়ারমেন্ট ইঞ্জিন — মূল্যস্ফীতি সমন্বিত"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Life Goal & Wealth Planner — beat Bangladesh inflation",
            "ভবিষ্যৎ লক্ষ্য ও সম্পদ পরিকল্পনাকারী — মূল্যস্ফীতিকে হার মানান"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Plan your car downpayment, apartment purchase, child's education, Hajj pilgrimage, or early retirement. See what your target will actually cost in the future with Bangladesh inflation, and compare the required monthly DPS across safe asset tiers.",
            "গাড়ি, ফ্ল্যাটের ডাউনপেমেন্ট, সন্তানের উচ্চশিক্ষা, হজ্ব বা আগাম অবসরের বাস্তবসম্মত পরিকল্পনা করুন। মূল্যস্ফীতির পর আপনার লক্ষ্যের প্রকৃত খরচ কত দাঁড়াবে তা জানুন এবং শীর্ষ ব্যাংক ডিপিএস ও সরকারি সুকুকের মাসিক কিস্তি হিসাব করুন।"
          )}
        </p>
      </div>
    </header>
  );
}
