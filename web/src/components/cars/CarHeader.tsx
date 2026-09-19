"use client";

import { useLanguage } from "@/lib/i18n";

export function CarHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "CAR BUYING DECISION & ADVANCE INCOME TAX (AIT) ENGINE — INCOME TAX ACT 2023",
            "গাড়ি কেনা ও বিআরটিএ অগ্রিম আয়কর (AIT) সিদ্ধান্ত ইঞ্জিন — আয়কর আইন ২০২৩"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Car Buying, CC Slabs & Multiple-Car Tax Decision Calculator",
            "গাড়ি কেনা, সিসি স্ল্যাব ও একাধিক গাড়ির কর বিশ্লেষণ ক্যালকুলেটর"
          )}
        </h1>
        <p className="max-w-[760px] text-sm text-[#DCE6DD]">
          {t(
            "Buying a car in Bangladesh? Engine displacement (CC) and vehicle ownership dictate your annual BRTA Advance Income Tax (AIT) and can trigger a 10% wealth surcharge on your entire income tax bill. Find your CC sweet-spot, see whether AIT is absorbed as free prepaid tax or lost as sunk cost, and check total monthly ownership costs.",
            "বাংলাদেশে গাড়ি কেনার সিদ্ধান্ত নিচ্ছেন? ইঞ্জিনের সিসি (CC) ও গাড়ির সংখ্যা অনুযায়ী বিআরটিএ-তে বাৎসরিক অগ্রিম কর (AIT) এবং পুরো আয়ের ওপর ১০% ওয়েলথ সারচার্জ আরোপিত হতে পারে। জেনে নিন কোন সিসি আপনার জন্য লাভজনক, এআইটি কি ট্যাক্সে অ্যাডজাস্ট হবে নাকি অপচয়, এবং মাসিক আয়ের সাথে সামঞ্জস্যপূর্ণ কি না।"
          )}
        </p>
      </div>
    </header>
  );
}
