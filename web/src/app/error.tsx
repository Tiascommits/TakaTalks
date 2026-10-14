"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

/** One boundary for every page that reads the database (tracker, rates, account, admin). */
export default function RouteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-serif font-semibold text-2xl text-green-deep mb-3">
          {t("This page couldn't load", "পাতাটি লোড করা যায়নি")}
        </h1>
        <p className="text-sm text-[#444] mb-6">
          {t(
            "The problem is on our side, not your device. Try again in a moment.",
            "সমস্যাটি আমাদের দিকে, আপনার ডিভাইসে নয়। একটু পরে আবার চেষ্টা করুন।"
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => retry()}
            className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors"
          >
            {t("Try again", "আবার চেষ্টা করুন")}
          </button>
          <Link
            href="/"
            className="border border-green-deep text-green-deep px-6 py-3 font-medium hover:bg-[#EFF6F1] transition-colors"
          >
            {t("Back to home", "হোমে ফিরে যান")}
          </Link>
        </div>
      </div>
    </div>
  );
}
