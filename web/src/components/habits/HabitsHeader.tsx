"use client";

import { useLanguage } from "@/lib/i18n";

export function HabitsHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "MICRO-SPEND HABIT TRACKER — MONTHLY, YEARLY AND COMPOUNDED",
            "ছোট খরচের অভ্যাস ট্র্যাকার — মাসিক, বার্ষিক ও চক্রবৃদ্ধি হিসাব"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Money Habit Tracker — the small spends, added up honestly",
            "মানি হ্যাবিট ট্র্যাকার — ছোট খরচগুলোর সত্যিকারের হিসাব"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "A ৳49 data pack, one delivery order, a subscription nobody cancelled. None of them feels like a decision, and together they are often the largest line in the month. Enter what each one costs and how often it happens — the tool does the multiplication, flags where you pass your own limit, and shows what the gap would have become if it were saved instead.",
            "৳৪৯ টাকার একটি ডেটা প্যাক, একটি ডেলিভারি অর্ডার, বন্ধ না করা একটি সাবস্ক্রিপশন। আলাদাভাবে কোনোটিই বড় সিদ্ধান্ত মনে হয় না, অথচ একসাথে মাসের সবচেয়ে বড় খরচ প্রায়ই এগুলোই। প্রতিটির খরচ ও কতবার হয় লিখুন — গুণটা টুল করে দেবে, নিজের বেঁধে দেওয়া সীমা পেরোলে জানাবে, আর সঞ্চয় করলে সেই টাকা কত হতো তা দেখাবে।"
          )}
        </p>
      </div>
    </header>
  );
}
