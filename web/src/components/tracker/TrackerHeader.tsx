"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function TrackerHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          INCOME &amp; INVESTMENT TRACKER
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t("Your income and investments, in one place", "আপনার আয় ও বিনিয়োগ, এক জায়গায়")}
        </h1>
        <p className="max-w-[700px] text-sm text-[#DCE6DD]">
          {t(
            "Adding an entry saves automatically — a lightweight account is created on your first save, no email or password needed.",
            "যোগ করলেই সেভ হয়। প্রথমবার সেভ করার সময় একটি হালকা অ্যাকাউন্ট তৈরি হয় — কোনো ইমেইল বা পাসওয়ার্ড লাগে না।"
          )}{" "}
          <Link href="/account" className="underline text-paper">
            {t("See or delete your saved data", "সেভ করা ডেটা দেখুন বা মুছে ফেলুন")}
          </Link>
        </p>
      </div>
    </header>
  );
}
