"use client";

import { useLanguage } from "@/lib/i18n";

export function ZakatHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "ISLAMIC WEALTH PURIFICATION — BANGLADESH NISAB & 2.5% ENGINE",
            "ইসলামিক সম্পদ পরিশুদ্ধি — বাংলাদেশ নিসাব ও ২.৫% যাকাত হিসাব"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Zakat Calculator for Bangladesh — Gold, Silver, Stocks & Sanchayapatra",
            "যাকাত ক্যালকুলেটর বাংলাদেশ — সোনা, রূপা, সঞ্চয়পত্র ও শেয়ার বাজার"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Calculate your exact 2.5% Zakat under Hanafi fiqh with current Bangladesh gold/silver prices. Covers bank savings, FDR, Sanchayapatra, DSE stocks, business inventory, and non-halal bank interest purification.",
            "বাংলাদেশ জুয়েলার্স অ্যাসোসিয়েশন (BAJUS) এর বর্তমান স্বর্ণ ও রৌপ্যের নিসাব অনুযায়ী যাকাত হিসাব করুন। সঞ্চয়পত্র, ব্যাংক এফডিআর, শেয়ারের যাকাত এবং ব্যাংক সুদের পরিশুদ্ধির স্বয়ংক্রিয় ও গোপনীয় হিসাব।"
          )}
        </p>
      </div>
    </header>
  );
}
