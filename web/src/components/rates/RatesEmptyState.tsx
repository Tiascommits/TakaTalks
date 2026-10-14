"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

const BB_DEPOSIT_RATES_URL = "https://www.bb.org.bd/en/index.php/financialactivity/interestdeposit";

/** Shown on /rates while no bank has a stored rate, in place of an empty table. */
export function RatesEmptyState() {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-[1160px] mx-auto px-5 mt-6 mb-16">
      <section className="border border-line bg-card px-4 py-5 max-w-[720px]">
        <h2 className="font-serif font-semibold text-lg text-green-deep mb-2">
          {t("Bank rates are not being collected yet", "ব্যাংকের রেট এখনো সংগ্রহ করা হচ্ছে না")}
        </h2>
        <p className="text-sm text-[#444] leading-relaxed mb-3">
          {t(
            "This page will compare banks' published FDR rates once our daily rate check is running. Until it has real numbers, it shows none rather than old or guessed ones.",
            "আমাদের দৈনিক রেট সংগ্রহ চালু হলে এই পাতায় ব্যাংকগুলোর প্রকাশিত FDR রেট পাশাপাশি দেখা যাবে। আসল সংখ্যা না আসা পর্যন্ত পুরনো বা আন্দাজের কোনো সংখ্যা এখানে দেখানো হবে না।"
          )}
        </p>
        <ul className="text-sm text-[#444] leading-relaxed list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <a
              href={BB_DEPOSIT_RATES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-green-deep"
            >
              {t("Bangladesh Bank's deposit rate table", "বাংলাদেশ ব্যাংকের আমানত সুদহারের তালিকা")}
            </a>{" "}
            {t("lists every scheduled bank's FDR rates, month by month.", "— প্রতিটি তফসিলি ব্যাংকের FDR রেট, মাসভিত্তিক।")}
          </li>
          <li>
            <Link href="/instruments" className="underline text-green-deep">
              {t("Real Yield Matrix", "সঞ্চয় স্কিম তুলনা")}
            </Link>{" "}
            {t(
              "compares a typical FDR with Sanchayapatra and bonds after tax.",
              "— সাধারণ FDR-এর সাথে সঞ্চয়পত্র ও বন্ডের কর-পরবর্তী মুনাফার তুলনা।"
            )}
          </li>
        </ul>
      </section>
    </div>
  );
}
