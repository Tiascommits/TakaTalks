"use client";

import { useLanguage } from "@/lib/i18n";

export function ReinvestHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "WHAT KIND OF INSTRUMENT — NOT WHICH BANK",
            "কোন ধরনের ইনস্ট্রুমেন্ট — কোন ব্যাংক নয়"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t("Reinvestment Suggestion", "পুনঃবিনিয়োগ পরামর্শ")}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "When money matures, this ranks Sanchayapatra, Govt Bonds, Bank FDR, and Mutual Funds as categories — by after-tax real return, your remaining tax-rebate room, and how soon you'll need the money — and shows the math behind the ranking. It never names a specific bank or fund as \"the best.\"",
            "কোনো বিনিয়োগের মেয়াদ শেষ হলে, এই টুল সঞ্চয়পত্র, সরকারি বন্ড, ব্যাংক এফডিআর ও মিউচুয়াল ফান্ড — এই ক্যাটাগরিগুলোকে ট্যাক্স-পরবর্তী প্রকৃত মুনাফা, অবশিষ্ট ট্যাক্স রেয়াতের সুযোগ, ও টাকা কখন লাগবে তার ভিত্তিতে র‍্যাংক করে এবং হিসাবটা দেখায়। এটি কখনো কোনো নির্দিষ্ট ব্যাংক বা ফান্ডকে \"সেরা\" বলে না।"
          )}
        </p>
      </div>
    </header>
  );
}
