"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function SiteNav() {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="bg-green-deep text-paper border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto px-5 py-3 flex items-center gap-6">
        <Link href="/" className="font-serif font-semibold text-lg">
          Takatox
        </Link>
        <Link href="/calculator" className="text-sm hover:text-gold transition-colors">
          {t("Tax Calculator", "আয়কর ক্যালকুলেটর")}
        </Link>
        <Link href="/tracker" className="text-sm hover:text-gold transition-colors">
          {t("Tracker", "ট্র্যাকার")}
        </Link>
        <Link href="/rates" className="text-sm hover:text-gold transition-colors">
          {t("Bank Rates", "ব্যাংক রেট")}
        </Link>

        <div
          role="group"
          aria-label={t("Language", "ভাষা")}
          className="ml-auto flex items-center border border-paper/40 rounded-sm overflow-hidden shrink-0"
        >
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            className={`px-2.5 py-1 text-xs font-mono transition-colors ${
              lang === "en" ? "bg-gold text-green-deep font-semibold" : "hover:bg-paper/10"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("bn")}
            aria-pressed={lang === "bn"}
            className={`px-2.5 py-1 text-xs font-mono transition-colors border-l border-paper/40 ${
              lang === "bn" ? "bg-gold text-green-deep font-semibold" : "hover:bg-paper/10"
            }`}
          >
            বাং
          </button>
        </div>
      </div>
    </nav>
  );
}
