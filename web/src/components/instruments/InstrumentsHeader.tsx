"use client";

import { useLanguage } from "@/lib/i18n";

export function InstrumentsHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto">
        <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
          {t(
            "AFTER-TAX YIELD COMPARATOR — SOVEREIGN VS COMMERCIAL FIXED INCOME",
            "ট্যাক্স-পরবর্তী মুনাফা তুলনাকারী — সরকারি বনাম বাণিজ্যিক ফিক্সড ইনকাম"
          )}
        </p>
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
          {t(
            "Real Yield Matrix — Sanchayapatra vs FDR vs Sukuk",
            "প্রকৃত মুনাফা ম্যাট্রিক্স — সঞ্চয়পত্র বনাম এফডিআর বনাম সুকুক"
          )}
        </h1>
        <p className="max-w-[720px] text-sm text-[#DCE6DD]">
          {t(
            "Compare all legal fixed-income savings instruments in Bangladesh side-by-side. See headline rates stripped of withholding tax (5%, 10%, or 15% TDS), adjusted for inflation, and check individual investment limits and sovereign guarantees.",
            "বাংলাদেশের সকল বৈধ ফিক্সড-ইনকাম সঞ্চয় স্কিমের পাশাপাশি তুলনা। ঘোষিত হারের বদলে উৎসে কর (TDS) ও মূল্যস্ফীতি বাদে প্রকৃত ক্রয়ক্ষমতা কতটুকু বাড়বে তা জানুন, এবং সঞ্চয়পত্রের স্ল্যাব ও আমানত সুরক্ষা সীমার বিস্তারিত দেখুন।"
          )}
        </p>
      </div>
    </header>
  );
}
