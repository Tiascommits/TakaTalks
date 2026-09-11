"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

const TOOLS = [
  {
    href: "/calculator",
    title: { en: "Tax Calculator", bn: "আয়কর ক্যালকুলেটর" },
    desc: {
      en: "Estimate what you owe, no account or signup needed.",
      bn: "কত tax লাগতে পারে estimate করো, account বা signup ছাড়াই।",
    },
  },
  {
    href: "/tracker",
    title: { en: "Income / Investment Tracker", bn: "ইনকাম / ইনভেস্টমেন্ট ট্র্যাকার" },
    desc: {
      en: "Log income and investments in one place, with maturity reminders.",
      bn: "আয় ও বিনিয়োগ একটা জায়গায় রাখো, maturity reminder সহ।",
    },
  },
  {
    href: "/rates",
    title: { en: "Bank Rates", bn: "ব্যাংক রেট" },
    desc: {
      en: "Compare FDR rates across banks — sourced data, no verdict.",
      bn: "ব্যাংকগুলোর FDR rate তুলনা করো — sourced data, কোনো verdict ছাড়াই।",
    },
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-14">
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

      <div className="max-w-[1160px] mx-auto px-5 pb-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-card border border-line px-5 py-4 hover:border-green transition-colors"
            >
              <h2 className="font-serif font-semibold text-[15.5px] text-green-deep mb-1.5">
                {t(tool.title.en, tool.title.bn)}
              </h2>
              <p className="text-xs text-[#555]">{t(tool.desc.en, tool.desc.bn)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
