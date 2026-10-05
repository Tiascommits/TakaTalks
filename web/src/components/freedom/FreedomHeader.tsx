"use client";

import { useLanguage } from "@/lib/i18n";

export function FreedomHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "FINANCIAL FREEDOM NUMBER — LIFESTYLE, INFLATION, PASSIVE INCOME & ROADMAP",
            "আর্থিক স্বাধীনতার অঙ্ক — জীবনযাত্রা, মূল্যস্ফীতি, প্যাসিভ আয় ও রোডম্যাপ"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Financial Freedom Calculator & Roadmap",
            "আর্থিক স্বাধীনতা ক্যালকুলেটর ও রোডম্যাপ"
          )}
        </h1>
        <p className="max-w-[760px] text-sm text-[#DCE6DD]">
          {t(
            "Freedom is not one number. Stopping work entirely, doing light consulting, travelling often, or moving back to the village are four different bills — and rent you already collect pays part of whichever one you pick. Set your inflation, your lifestyle and your existing passive income, and this works out the corpus, the monthly saving that reaches it, how the corpus should be split once it arrives, and the year-by-year roadmap to your target age.",
            "আর্থিক স্বাধীনতা একটিমাত্র অঙ্ক নয়। পুরোপুরি কাজ বন্ধ করা, হালকা পরামর্শের কাজ করা, ঘন ঘন ভ্রমণ করা, বা গ্রামে ফিরে যাওয়া — এই চারটি সম্পূর্ণ আলাদা খরচ, আর আপনার বিদ্যমান ভাড়ার আয় যেকোনোটিরই একটি অংশ মেটাবে। আপনার মূল্যস্ফীতি, জীবনযাত্রা ও প্যাসিভ আয় দিন — এটি হিসাব করবে প্রয়োজনীয় মূলধন, সেখানে পৌঁছানোর মাসিক সঞ্চয়, সেই মূলধন কীভাবে ভাগ করে রাখবেন, এবং লক্ষ্য বয়স পর্যন্ত বছরভিত্তিক রোডম্যাপ।"
          )}
        </p>
      </div>
    </header>
  );
}
