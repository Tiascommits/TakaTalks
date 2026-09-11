"use client";

import { useLanguage } from "@/lib/i18n";

export function RatesHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          BANK FDR COMPARISON — SOURCED DATA, NOT A RECOMMENDATION
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t("Bank FDR Rate Comparison", "ব্যাংক FDR রেট তুলনা")}
        </h1>
        <p className="max-w-[700px] text-sm text-[#DCE6DD]">
          {t(
            "Shows several banks' published FDR rates side by side and calculates the after-tax return. It doesn't call any bank or scheme “best” — which one to pick is your decision.",
            "কয়েকটা bank er published FDR rate পাশাপাশি দেখায়, after-tax return calculate করে দেখায়। কোনো bank ba scheme “best” বলে না — কোনটা নেবে সেটা তোমার সিদ্ধান্ত।"
          )}
        </p>
      </div>
    </header>
  );
}
