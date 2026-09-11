"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div
      role="group"
      aria-label={t("Language", "ভাষা")}
      className={`flex items-center border border-paper/40 rounded-sm overflow-hidden shrink-0 ${className}`}
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
  );
}

export function SiteNav() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/calculator", label: t("Tax Calculator", "আয়কর ক্যালকুলেটর") },
    { href: "/tracker", label: t("Tracker", "ট্র্যাকার") },
    { href: "/rates", label: t("Bank Rates", "ব্যাংক রেট") },
  ];

  return (
    <nav className="bg-green-deep text-paper border-b-4 border-gold">
      <div className="max-w-[1160px] mx-auto px-5 py-3 flex items-center gap-6">
        <Link href="/" className="font-serif font-semibold text-lg">
          Takatox
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm hover:text-gold transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <LanguageToggle className="ml-auto hidden md:flex" />

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={t("Menu", "মেনু")}
          className="md:hidden ml-auto flex flex-col justify-center gap-1.5 w-8 h-8"
        >
          <span className={`block h-0.5 bg-paper transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 bg-paper transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 bg-paper transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-paper/20 px-5 py-3 flex flex-col gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm hover:text-gold transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <LanguageToggle className="self-start" />
        </div>
      )}
    </nav>
  );
}
