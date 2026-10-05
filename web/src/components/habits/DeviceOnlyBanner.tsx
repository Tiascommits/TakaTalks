"use client";

import { useLanguage } from "@/lib/i18n";

/**
 * The tax tools' TrustBanner points at etaxnbr for an official filing, which is the
 * wrong footnote for a spending tracker. Same promise, accurate second line — and
 * this one has to say where the saved habits live, because unlike every other tool
 * on the site this one keeps data between visits.
 */
export function DeviceOnlyBanner() {
  const { t } = useLanguage();

  return (
    <div className="max-w-[1160px] mx-auto mt-4 px-5">
      <div className="flex items-center gap-2 bg-[#EFF6F1] border border-green text-green-deep text-sm font-semibold px-4 py-3 mb-3">
        <span className="w-2 h-2 rounded-full bg-green shrink-0" />
        <span>
          {t(
            "Your habits are saved in this browser only — nothing is sent anywhere. No signup, no account, no server. Clearing your browser data clears this list.",
            "আপনার অভ্যাসের তালিকা কেবল এই ব্রাউজারেই সংরক্ষিত থাকে — কোথাও পাঠানো হয় না। কোনো সাইন-আপ, অ্যাকাউন্ট বা সার্ভার নেই। ব্রাউজারের ডেটা মুছলে এই তালিকাও মুছে যাবে।"
          )}
        </span>
      </div>
      <div className="bg-amber-bg border border-amber-border text-ink text-xs px-4 py-2.5">
        {t(
          "Every figure here is your own numbers multiplied out — nothing is looked up, estimated or recommended on your behalf. A cheaper alternative only appears when you type its price in yourself.",
          "এখানকার প্রতিটি হিসাব আপনার দেওয়া সংখ্যারই গুণফল — আপনার হয়ে কিছু খোঁজা, অনুমান বা সুপারিশ করা হয় না। সস্তা বিকল্প তখনই দেখানো হয়, যখন আপনি নিজে তার দাম লেখেন।"
        )}
      </div>
    </div>
  );
}
