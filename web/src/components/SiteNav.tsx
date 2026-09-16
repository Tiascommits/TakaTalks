"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { TOOL_CATEGORIES, toolsInCategory } from "@/config/tools";

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
          lang === "en" ? "bg-gold text-ink font-semibold" : "hover:bg-paper/10"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("bn")}
        aria-pressed={lang === "bn"}
        className={`px-2.5 py-1 text-xs font-mono transition-colors border-l border-paper/40 ${
          lang === "bn" ? "bg-gold text-ink font-semibold" : "hover:bg-paper/10"
        }`}
      >
        বাং
      </button>
    </div>
  );
}

/** The tool list, grouped by category — shared by the desktop dropdown and
 *  the mobile sheet so the two can't drift apart. */
function ToolMenuPanel({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {TOOL_CATEGORIES.map((category) => (
        <div key={category.id}>
          <p className="font-mono text-[10px] tracking-wider text-gold mb-2">
            {t(category.label.en, category.label.bn).toUpperCase()}
          </p>
          <ul className="flex flex-col gap-1.5">
            {toolsInCategory(category.id).map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 text-sm hover:text-gold transition-colors"
                >
                  <span aria-hidden="true" className="text-base">
                    {tool.icon}
                  </span>
                  {t(tool.navLabel.en, tool.navLabel.bn)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function SiteNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Any navigation closes whatever was open — including browser back/forward,
  // which no click handler would catch. Adjusted during render rather than in
  // an effect so the closed menu is part of the same commit as the new route.
  if (pathname !== openedAt) {
    setOpenedAt(pathname);
    setToolsOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!toolsOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setToolsOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

  const demoActive = pathname === "/videos";

  return (
    <nav className="bg-green-deep text-paper border-b-4 border-gold relative z-40">
      <div className="max-w-[1160px] mx-auto px-5 py-3 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-serif font-semibold text-lg shrink-0">
          <Image src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7" priority />
          TakaTalks
        </Link>

        <div ref={toolsRef} className="hidden md:block relative">
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            aria-expanded={toolsOpen}
            aria-haspopup="true"
            className="flex items-center gap-1.5 text-sm hover:text-gold transition-colors"
          >
            {t("Tools", "টুলস")}
            <span
              aria-hidden="true"
              className={`text-[10px] transition-transform ${toolsOpen ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>

          {toolsOpen && (
            <div className="absolute left-0 top-full mt-3 w-[min(90vw,34rem)] bg-green-deep border border-paper/20 rounded-sm shadow-lg p-5">
              <ToolMenuPanel onNavigate={() => setToolsOpen(false)} />
            </div>
          )}
        </div>

        <Link
          href="/videos"
          className={`hidden md:block text-sm transition-colors ${
            demoActive ? "text-gold" : "hover:text-gold"
          }`}
        >
          {t("Demo", "ডেমো")}
        </Link>

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
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-paper/20 px-5 py-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto"
        >
          <Link
            href="/videos"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-semibold hover:text-gold transition-colors"
          >
            {t("Demo", "ডেমো")}
          </Link>
          <div className="border-t border-paper/15 pt-4">
            <p className="font-mono text-[10px] tracking-wider text-paper/60 mb-3">
              {t("TOOLS", "টুলস")}
            </p>
            <ToolMenuPanel onNavigate={() => setMenuOpen(false)} />
          </div>
          <LanguageToggle className="self-start" />
        </div>
      )}
    </nav>
  );
}
