"use client";

import { useLanguage } from "@/lib/i18n";

export function TrustBanner() {
  const { t } = useLanguage();

  return (
    <div className="max-w-[1160px] mx-auto mt-4 px-5">
      <div className="flex items-center gap-2 bg-[#EFF6F1] border border-green text-green-deep text-sm font-semibold px-4 py-3 mb-3">
        <span className="w-2 h-2 rounded-full bg-green shrink-0" />
        <span>
          {t(
            "This calculation happens on your device — nothing is sent anywhere. No signup, no account, no data goes to a server.",
            "এই হিসাবটি সম্পূর্ণ আপনার ডিভাইসে সম্পন্ন হয়, কোনো তথ্য সার্ভারে পাঠানো হয় না। কোনো অ্যাকাউন্ট বা সাইন-আপের প্রয়োজন নেই।"
          )}
        </span>
      </div>
      <div className="bg-[#FBEFEF] border border-red text-red text-xs px-4 py-2.5">
        {t(
          "This is an estimate tool, not an official filing. Rules change every budget, so some caps are simplified. For an actual return filing, use ",
          "এটি একটি প্রাথমিক হিসাবের টুল, অফিশিয়াল ট্যাক্স রিটার্ন নয়। প্রতি বাজেটে নিয়ম পরিবর্তিত হওয়ায় কিছু সীমা এখানে সরলীকৃত করা হয়েছে। চূড়ান্ত রিটার্ন দাখিলের জন্য "
        )}
        <strong>etaxnbr.gov.bd</strong>
        {t(" or consult a tax practitioner.", " ব্যবহার করুন অথবা একজন ট্যাক্স আইনজীবীর পরামর্শ নিন।")}
      </div>
    </div>
  );
}
