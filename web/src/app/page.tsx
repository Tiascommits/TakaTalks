"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

const TOOLS = [
  {
    href: "/calculator",
    icon: "🧮",
    tag: { en: "ZERO SIGNUP", bn: "সাইনআপ ছাড়া" },
    title: { en: "Tax Calculator & Rebate Optimizer", bn: "আয়কর ও রিবেট অপটিমাইজার" },
    desc: {
      en: "Estimate what you owe under Assessment Year 2025-26 rules. Maximize your legal tax rebate.",
      bn: "করবর্ষ ২০২৫-২৬ অনুযায়ী ট্যাক্স প্রাক্কলন করুন। সর্বোচ্চ আইনসম্মত কর রেয়াত অর্জন করুন।",
    },
  },
  {
    href: "/salary",
    icon: "💼",
    tag: { en: "OFFER BENCHMARK", bn: "অফার তুলনাকারী" },
    title: { en: "Salary Offer & In-Hand Analyzer", bn: "স্যালারি অফার ও ইন-হ্যান্ড পে" },
    desc: {
      en: "Compare job offers side-by-side. See exact monthly bank credit after 10% PF and Section 86 monthly TDS.",
      bn: "চাকরির অফার পাশাপাশি তুলনা করুন। ১০% পিএফ ও মাসিক কর কর্তনের পর প্রকৃত ব্যাংক জমা দেখুন।",
    },
  },
  {
    href: "/goals",
    icon: "🎯",
    tag: { en: "BEAT INFLATION", bn: "মূল্যস্ফীতি জয়" },
    title: { en: "Life Goal & Wealth Planner", bn: "ভবিষ্যৎ লক্ষ্য ও অবসর প্ল্যানার" },
    desc: {
      en: "Model car, flat, child education, or retirement milestones adjusted for Bangladesh inflation.",
      bn: "গাড়ি, ফ্ল্যাটের ডাউনপেমেন্ট, উচ্চশিক্ষা বা আগাম অবসরের বাস্তবসম্মত সঞ্চয় লক্ষ্য নির্ধারণ করুন।",
    },
  },
  {
    href: "/instruments",
    icon: "📊",
    tag: { en: "REAL YIELDS", bn: "প্রকৃত মুনাফা" },
    title: { en: "Real Yield Matrix (After-Tax)", bn: "সঞ্চয় স্কিম তুলনামূলক ম্যাট্রিক্স" },
    desc: {
      en: "Sanchayapatra vs Bank FDR vs Govt Sukuk. Compare net returns after 5%, 10%, or 15% TDS.",
      bn: "সঞ্চয়পত্র, ব্যাংক এফডিআর ও সরকারি সুকুক। উৎসে কর ও মূল্যস্ফীতি বাদে প্রকৃত ক্রয়ক্ষমতা তুলনা করুন।",
    },
  },
  {
    href: "/rates",
    icon: "🏦",
    tag: { en: "LIVE RATES + AUDITED DATA", bn: "লাইভ রেট + অডিট ডাটা" },
    title: { en: "Bank Rates & Health Scorecard", bn: "ব্যাংক রেট ও স্বাস্থ্য স্কোরকার্ড" },
    desc: {
      en: "Commercial bank deposit rates with audited Basel III health disclosures (CAR, NPL, ROA).",
      bn: "বাণিজ্যিক ব্যাংকের আমানত রেট এবং অডিটেড মূলধন পর্যাপ্ততা (CAR) ও খেলাপি ঋণ (NPL) তথ্য।",
    },
  },
  {
    href: "/tracker",
    icon: "🔔",
    tag: { en: "MATURITY ALERTS", bn: "মেয়াদ অ্যালার্ট" },
    title: { en: "Income & Investment Tracker", bn: "ইনকাম ও ইনভেস্টমেন্ট ট্র্যাকার" },
    desc: {
      en: "Track multi-source earnings and deposit maturities with automated email & WhatsApp alerts.",
      bn: "একাধিক আয়ের উৎস ও বিভিন্ন ব্যাংকের সঞ্চয় ট্র্যাক করুন, মেয়াদপূর্তির নোটিফিকেশন পান।",
    },
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-14 bg-gradient-to-b from-[#FAF9F5] to-paper">
        <div className="max-w-2xl text-center">
          <span className="inline-block font-mono text-xs tracking-wider text-gold border border-gold/40 px-2.5 py-0.5 rounded-xs mb-3">
            TAKATOX • PERSONAL FINANCE FOR BANGLADESH
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-green-deep mb-4 leading-tight">
            {t(
              "Your Money, In Your Hands — Powered by Math",
              "তোমার টাকার পূর্ণ নিয়ন্ত্রণ — নিখুঁত গাণিতিক হিসাব"
            )}
          </h1>
          <p className="text-sm sm:text-base text-[#444] mb-8 leading-relaxed max-w-xl mx-auto">
            {t(
              "Zero-signup tax calculators, job offer benchmarks, inflation-adjusted life goals, and transparent audited bank health metrics. Privacy-first, on-device by default.",
              "কোনো সাইনআপ ছাড়াই আয়কর হিসাব, চাকরির অফার তুলনা, মূল্যস্ফীতি সমন্বিত লাইফ গোল প্ল্যানিং এবং ব্যাংকের অডিটেড স্বচ্ছ ডাটা। আপনার গোপনীয়তা অক্ষুণ্ণ রেখে ডিভাইসেই হিসাব হয়।"
            )}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/calculator"
              className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors rounded-xs shadow-xs"
            >
              {t("Tax Estimator", "আয়কর ক্যালকুলেটর")}
            </Link>
            <Link
              href="/salary"
              className="bg-gold text-green-deep px-6 py-3 font-semibold hover:bg-gold/90 transition-colors rounded-xs shadow-xs"
            >
              {t("Salary Analyzer", "স্যালারি তুলনাকারী")}
            </Link>
            <Link
              href="/goals"
              className="border border-green-deep text-green-deep px-6 py-3 font-medium hover:bg-[#EFF6F1] transition-colors rounded-xs"
            >
              {t("Goal Planner", "লক্ষ্য ও অবসর")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-5 py-12 w-full">
        <div className="text-center mb-8">
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-green-deep">
            {t("Comprehensive Financial Intelligence Suite", "সম্পূর্ণ পার্সোনাল ফাইন্যান্স টুলবক্স")}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t("All calculations run in your browser. No personal income data leaves your device.", "সকল হিসাব ব্রাউজারে হয়। আপনার ব্যক্তিগত আয়ের তথ্য সার্ভারে পাঠানো হয় না।")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-card border border-line p-5 rounded-sm hover:border-gold hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-[10px] font-mono font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-xs">
                    {t(tool.tag.en, tool.tag.bn)}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-green-deep group-hover:text-green transition-colors mb-1.5">
                  {t(tool.title.en, tool.title.bn)}
                </h3>
                <p className="text-xs text-[#555] leading-relaxed">{t(tool.desc.en, tool.desc.bn)}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-green-deep group-hover:text-gold transition-colors">
                <span>{t("Launch Tool", "টুল ওপেন করুন")}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
