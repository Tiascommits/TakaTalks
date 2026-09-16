"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VideoReel } from "@/components/home/VideoReel";
import { ToolTabs } from "@/components/home/ToolTabs";

const TRUST_POINTS = [
  {
    icon: "🔒",
    en: "Runs on your device",
    bn: "আপনার ডিভাইসেই চলে",
    descEn: "Income figures are never sent to a server.",
    descBn: "আয়ের তথ্য কোনো সার্ভারে যায় না।",
  },
  {
    icon: "📄",
    en: "Every number is sourced",
    bn: "প্রতিটি সংখ্যার সূত্র আছে",
    descEn: "NBR rules and bank rates cite where they came from.",
    descBn: "এনবিআর নিয়ম ও ব্যাংক রেটের সূত্র দেখানো হয়।",
  },
  {
    icon: "🚫",
    en: "No signup to try",
    bn: "ব্যবহারে সাইনআপ লাগে না",
    descEn: "An account is only for maturity reminders.",
    descBn: "শুধু মেয়াদপূর্তির রিমাইন্ডারের জন্য অ্যাকাউন্ট।",
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero — kept short enough that the tool picker below is reachable
          on a phone without a long scroll. */}
      <section className="px-5 pt-10 pb-8 sm:pt-14 sm:pb-12 bg-gradient-to-b from-[#FAF9F5] to-paper">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block font-mono text-[10px] sm:text-xs tracking-wider text-gold border border-gold/40 px-2.5 py-0.5 rounded-xs mb-3">
            {t("PERSONAL FINANCE FOR BANGLADESH", "বাংলাদেশের জন্য পার্সোনাল ফাইন্যান্স")}
          </span>
          <h1 className="font-serif font-bold text-[1.75rem] leading-[1.15] sm:text-4xl text-green-deep mb-3">
            {t(
              "Your Money, In Your Hands — Powered by Math",
              "তোমার টাকার পূর্ণ নিয়ন্ত্রণ — নিখুঁত গাণিতিক হিসাব"
            )}
          </h1>
          <p className="text-sm sm:text-base text-[#444] leading-relaxed mb-6 max-w-xl mx-auto">
            {t(
              "Tax, salary, savings and loan calculators built on Bangladesh's actual rules — with the source for every number.",
              "বাংলাদেশের প্রকৃত নিয়মে তৈরি কর, বেতন, সঞ্চয় ও ঋণের ক্যালকুলেটর — প্রতিটি সংখ্যার সূত্রসহ।"
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Link
              href="/calculator"
              className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors rounded-xs shadow-xs"
            >
              {t("Estimate my tax", "আমার কর হিসাব করুন")}
            </Link>
            <Link
              href="/videos"
              className="border border-green-deep text-green-deep px-6 py-3 font-medium hover:bg-[#EFF6F1] transition-colors rounded-xs"
            >
              {t("Watch the demo", "ডেমো দেখুন")}
            </Link>
          </div>
        </div>
      </section>

      <VideoReel />

      <ToolTabs />

      <section className="border-t border-line bg-card/60">
        <div className="max-w-[1160px] mx-auto px-5 py-8 grid gap-5 sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (
            <div key={point.en} className="flex gap-3">
              <span aria-hidden="true" className="text-xl shrink-0">
                {point.icon}
              </span>
              <div>
                <p className="font-serif font-semibold text-sm text-green-deep">
                  {t(point.en, point.bn)}
                </p>
                <p className="text-xs text-muted leading-relaxed mt-0.5">
                  {t(point.descEn, point.descBn)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
