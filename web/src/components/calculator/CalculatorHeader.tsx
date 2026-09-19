"use client";

import { useLanguage } from "@/lib/i18n";

export function CalculatorHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          ESTIMATE TOOL — NOT AN OFFICIAL NBR SERVICE, NOT A FILING
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Income Tax Estimator — see roughly where you stand",
            "আয়কর এস্টিমেটর — নিজের করদায় সহজে হিসাব করুন"
          )}
        </h1>
        <p className="max-w-[700px] text-sm text-[#DCE6DD]">
          {t(
            "Type in your numbers and see roughly what your tax could be — no account or signup needed. Salary, business, house property, capital gains, investment rebate — everything estimated together. The rebate optimizer tells you how much more to invest to lower your tax.",
            "আপনার আয় ও ব্যয়ের তথ্য দিয়ে সহজেই করের পরিমাণ হিসাব করুন, কোনো অ্যাকাউন্ট বা সাইন-আপের প্রয়োজন নেই। বেতন, ব্যবসা, বাড়ি ভাড়া, ক্যাপিটাল গেইনস ও বিনিয়োগ রিবেট—সবকিছু একসাথে সমন্বিত। রিবেট অপটিমাইজার আপনাকে দেখাবে অতিরিক্ত কত বিনিয়োগ করলে কর সাশ্রয় হবে।"
          )}
        </p>
      </div>
    </header>
  );
}
