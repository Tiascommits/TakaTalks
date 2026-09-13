"use client";

import { useLanguage } from "@/lib/i18n";

export function FreelanceHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "FREELANCER & ITES EXPORT REMITTANCE HUB — INCOME TAX ACT 2023",
            "ফ্রিল্যান্সার ও আইটিইএস রেমিট্যান্স হাব — আয়কর আইন ২০২৩"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Freelance Tax & Remittance Calculator — 0% tax & legal white money",
            "ফ্রিল্যান্স ট্যাক্স ও রেমিট্যান্স ক্যালকুলেটর — ০% কর ও বৈধ সাদা টাকা"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Earning in foreign currency from Upwork, Fiverr, or global clients? Calculate your exact BDT conversion, government cash incentives, 100% tax exemption rules for IT/ITES, and the required documents (FIRC & Form C) to declare legal white money in Bangladesh.",
            "আপওয়ার্ক, ফাইভার বা বিদেশি ক্লায়েন্টের কাজ থেকে রেমিট্যান্স পাচ্ছেন? টাকায় রূপান্তরের সঠিক হিসাব, সরকারি নগদ প্রণোদনা, আইটিইএস খাতে কর অব্যাহতির নিয়ম এবং রিটার্নে বৈধ সাদা টাকা প্রদর্শনের সহজ সমাধান।"
          )}
        </p>
      </div>
    </header>
  );
}
