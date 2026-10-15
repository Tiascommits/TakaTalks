"use client";

import { useLanguage } from "@/lib/i18n";

export function RatesHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "BANK FDR COMPARISON — SOURCED DATA, NOT A RECOMMENDATION",
            "ব্যাংক FDR তুলনা — সূত্রসহ তথ্য, কোনো সুপারিশ নয়"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t("Bank FDR Rate Comparison", "ব্যাংক FDR রেট তুলনা")}
        </h1>
        <p className="max-w-[700px] text-sm text-[#DCE6DD]">
          {t(
            "Shows several banks' published FDR rates side by side and works out what you keep after the bank's source tax. It doesn't call any bank “best” — which one to pick is your decision.",
            "কয়েকটি ব্যাংকের প্রকাশিত FDR রেট পাশাপাশি দেখায়, আর ব্যাংকের উৎসে কর কাটার পর আপনার হাতে কত থাকে তা হিসাব করে। কোনো ব্যাংককে “সেরা” বলে না — কোনটি নেবেন, সে সিদ্ধান্ত আপনার।"
          )}
        </p>
      </div>
    </header>
  );
}
