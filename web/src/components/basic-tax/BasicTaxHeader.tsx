"use client";

import { useLanguage } from "@/lib/i18n";

export function BasicTaxHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[700px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          ESTIMATE TOOL — NOT AN OFFICIAL NBR SERVICE, NOT A FILING
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t("Basic income tax calculation", "বেসিক ইনকাম ট্যাক্স হিসাব")}
        </h1>
        <p className="text-sm text-[#DCE6DD]">
          {t(
            "Enter your total yearly income and see the basic slab tax — the same formula from the video, worked out for your own numbers.",
            "আপনার বছরের মোট আয় দিয়ে দেখুন স্ল্যাব অনুযায়ী মূল কর কত হয় — ভিডিওতে দেখানো একই হিসাব, আপনার নিজের অঙ্কে।"
          )}
        </p>
      </div>
    </header>
  );
}
