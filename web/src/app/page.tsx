"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { VideoReel } from "@/components/home/VideoReel";
import { ToolTabs } from "@/components/home/ToolTabs";
import { VizStrip } from "@/components/home/VizStrip";

const TRUST_POINTS = [
  {
    icon: "🔒",
    en: "Calculators run on your device",
    bn: "ক্যালকুলেটর আপনার ডিভাইসেই চলে",
    descEn: "What you type into a calculator stays in your browser. The tracker saves your entries on our server, only when you use it.",
    descBn: "ক্যালকুলেটরে যা লেখেন তা আপনার ব্রাউজারেই থাকে। ট্র্যাকার ব্যবহার করলে কেবল তখনই আপনার এন্ট্রি আমাদের সার্ভারে সেভ হয়।",
  },
  {
    icon: "📄",
    en: "Estimates, not advice",
    bn: "আনুমানিক হিসাব, পরামর্শ নয়",
    descEn: "Based on published NBR rules and bank data. Check final figures with NBR or your bank.",
    descBn: "এনবিআরের প্রকাশিত নিয়ম ও ব্যাংকের তথ্যের ভিত্তিতে। চূড়ান্ত অঙ্ক এনবিআর বা ব্যাংকে মিলিয়ে নিন।",
  },
  {
    icon: "🚫",
    en: "No signup to try",
    bn: "ব্যবহারে সাইনআপ লাগে না",
    descEn: "Calculators need no account. The tracker makes an anonymous one when you first save.",
    descBn: "ক্যালকুলেটরে অ্যাকাউন্ট লাগে না। ট্র্যাকারে প্রথমবার সেভ করলে একটি নামহীন অ্যাকাউন্ট তৈরি হয়।",
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero — text beside the featured video on wide screens, stacked on
          phones, kept short so the tool picker is reachable without a long scroll. */}
      <section className="px-5 pt-8 pb-6 sm:pt-12 sm:pb-8 bg-gradient-to-b from-[#FAF9F5] to-paper">
        <div className="max-w-[1160px] mx-auto grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
          <div className="text-center md:text-left">
            <span className="inline-block font-mono text-[10px] sm:text-xs tracking-wider text-gold border border-gold/40 px-2.5 py-0.5 rounded-xs mb-3">
              {t("PERSONAL FINANCE FOR BANGLADESH", "বাংলাদেশের জন্য পার্সোনাল ফাইন্যান্স")}
            </span>
            <h1 className="font-serif font-bold text-[1.75rem] leading-[1.15] sm:text-4xl text-green-deep mb-3">
              {t(
                "Your Money, In Your Hands — Estimates You Can Check",
                "আপনার টাকার হিসাব আপনার হাতে — যাচাইযোগ্য আনুমানিক হিসাব"
              )}
            </h1>
            <p className="text-sm sm:text-base text-[#444] leading-relaxed mb-6 max-w-xl mx-auto md:mx-0">
              {t(
                "Tax, salary, savings and loan estimates based on Bangladesh's published rules. They are a starting point, not a filing or advice.",
                "বাংলাদেশের প্রকাশিত নিয়ম অনুযায়ী কর, বেতন, সঞ্চয় ও ঋণের আনুমানিক হিসাব। এটি শুরু করার জায়গা — রিটার্ন দাখিল বা পরামর্শ নয়।"
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-center md:justify-start">
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

          <VideoReel />
        </div>
      </section>

      <ToolTabs />

      <VizStrip />

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
