"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { TOOL_CATEGORIES, TOOLS, toolsInCategory, type ToolCategoryId } from "@/config/tools";

/**
 * The homepage tool picker. Deliberately *not* a single list of all nine
 * tools — on a phone that was most of the page's height and told you
 * nothing about which one you wanted. Grouping into four categories keeps
 * the homepage roughly one screen tall and makes the choice a two-step
 * question ("what am I trying to do" then "which tool") instead of a scan
 * of nine near-identical cards.
 */
export function ToolTabs() {
  const { t } = useLanguage();
  const [active, setActive] = useState<ToolCategoryId>("tax");

  const category = TOOL_CATEGORIES.find((c) => c.id === active) ?? TOOL_CATEGORIES[0];
  const tools = toolsInCategory(active);

  return (
    <section className="max-w-[1160px] mx-auto px-5 py-10 sm:py-14 w-full">
      <div className="text-center mb-6">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-green-deep">
          {t("What are you working out today?", "আজ কী হিসাব করতে চান?")}
        </h2>
        <p className="text-xs text-muted mt-1.5">
          {t(
            `All ${TOOLS.length} tools run in your browser. No personal income data leaves your device.`,
            `সব ${TOOLS.length}টি টুল আপনার ব্রাউজারেই চলে। ব্যক্তিগত আয়ের তথ্য ডিভাইস ছাড়ে না।`
          )}
        </p>
      </div>

      {/* Horizontally scrollable on narrow phones rather than wrapping into
          a second row that pushes the cards below the fold. */}
      <div
        role="tablist"
        aria-label={t("Tool categories", "টুল ক্যাটাগরি")}
        className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
      >
        {TOOL_CATEGORIES.map((c) => {
          const selected = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              id={`tool-tab-${c.id}`}
              aria-selected={selected}
              aria-controls={`tool-panel-${c.id}`}
              onClick={() => setActive(c.id)}
              className={`shrink-0 px-4 py-2 text-sm rounded-sm border transition-colors ${
                selected
                  ? "bg-green-deep text-paper border-green-deep font-semibold"
                  : "bg-card text-green-deep border-line hover:border-gold"
              }`}
            >
              {t(c.label.en, c.label.bn)}
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-[#555] mb-6">{t(category.blurb.en, category.blurb.bn)}</p>

      <div
        role="tabpanel"
        id={`tool-panel-${active}`}
        aria-labelledby={`tool-tab-${active}`}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="bg-card border border-line p-4 sm:p-5 rounded-sm hover:border-gold hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start gap-3 mb-2.5">
                <span aria-hidden="true" className="text-2xl">
                  {tool.icon}
                </span>
                <span className="text-[10px] font-mono font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-xs text-right">
                  {t(tool.tag.en, tool.tag.bn)}
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-green-deep group-hover:text-green transition-colors mb-1.5">
                {t(tool.title.en, tool.title.bn)}
              </h3>
              <p className="text-xs text-[#555] leading-relaxed">{t(tool.desc.en, tool.desc.bn)}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-green-deep group-hover:text-gold transition-colors">
              <span>{t("Launch Tool", "টুল ওপেন করুন")}</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
