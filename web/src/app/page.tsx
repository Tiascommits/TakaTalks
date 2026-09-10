"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex items-center justify-center px-5">
      <div className="max-w-xl text-center">
        <p className="font-mono text-xs tracking-wide text-muted mb-3">TAKATOX</p>
        <h1 className="font-serif font-semibold text-3xl text-green-deep mb-4">
          {t("Your money, in your hands", "তোমার টাকার হিসাব, তোমার হাতে")}
        </h1>
        <p className="text-sm text-[#444] mb-8">
          {t(
            "Estimate your income tax without signing up, or track your income and investments in one place.",
            "আয়কর এস্টিমেট করো signup ছাড়াই, অথবা তোমার আয় ও বিনিয়োগ ট্র্যাক করো একটা জায়গায়।"
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/calculator"
            className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors"
          >
            {t("Tax Calculator", "আয়কর ক্যালকুলেটর")}
          </Link>
          <Link
            href="/tracker"
            className="border border-green-deep text-green-deep px-6 py-3 font-medium hover:bg-[#EFF6F1] transition-colors"
          >
            {t("Income / Investment Tracker", "ইনকাম / ইনভেস্টমেন্ট ট্র্যাকার")}
          </Link>
        </div>
      </div>
    </div>
  );
}
