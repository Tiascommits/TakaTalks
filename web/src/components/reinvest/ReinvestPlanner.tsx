"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeReinvestSuggestion, type ReinvestCategoryScore } from "@/lib/reinvest/suggest";
import type { TaxCalculationResult } from "@/lib/tax/types";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

const HORIZON_FIT_STYLE: Record<ReinvestCategoryScore["horizonFit"], string> = {
  good: "bg-[#EAF5EC] text-green border-green/30",
  under: "bg-[#FBEFEF] text-red border-red/30",
  over: "bg-[#FBF6E8] text-gold border-gold/40",
};

export function ReinvestPlanner({
  initialAmount,
  initialHorizonYears,
  taxResult,
  investmentEntryId,
  investmentLabel,
}: {
  initialAmount: number;
  initialHorizonYears: number;
  taxResult: TaxCalculationResult | null;
  investmentEntryId: string | null;
  investmentLabel: string | null;
}) {
  const { t, lang } = useLanguage();

  const [amount, setAmount] = useState(initialAmount);
  const [horizonYears, setHorizonYears] = useState(
    Math.round(Math.max(0.5, Math.min(20, initialHorizonYears)) * 2) / 2
  );
  const [hasPSR, setHasPSR] = useState(true);
  const [inflationPct, setInflationPct] = useState(8.5);

  const [suggestionId, setSuggestionId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoLoggedOnce = useRef(false);

  const result = useMemo(
    () => computeReinvestSuggestion({ reinvestAmount: amount, horizonYears, hasPSR, inflationPct, taxResult }),
    [amount, horizonYears, hasPSR, inflationPct, taxResult]
  );

  // When arriving from a specific tracked investment (tracker's maturity
  // panel or a reminder link), log the suggestion once against that
  // investment so it shows up in that investment's history and can be
  // dismissed — see prisma/schema.prisma's ReinvestSuggestion model.
  useEffect(() => {
    if (!investmentEntryId || autoLoggedOnce.current) return;
    autoLoggedOnce.current = true;
    fetch("/api/reinvest/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reinvestAmount: amount, horizonYears, hasPSR, inflationPct, investmentEntryId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) setSuggestionId(data.id);
      })
      .catch(() => {});
    // Intentionally only on mount for this investment — subsequent slider
    // tweaks recompute locally without re-logging every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investmentEntryId]);

  async function saveSuggestion() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/reinvest/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reinvestAmount: amount, horizonYears, hasPSR, inflationPct, investmentEntryId }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setSuggestionId(data.id);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function dismissSuggestion() {
    if (!suggestionId) return;
    setDismissed(true);
    await fetch(`/api/reinvest/suggestions/${suggestionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    }).catch(() => {});
  }

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {investmentLabel && (
        <div className="bg-[#FBF6E8] border border-gold/40 px-4 py-2.5 mb-4 text-sm">
          {t(
            `Reinvestment suggestion for "${investmentLabel}"`,
            `"${investmentLabel}"-এর জন্য পুনঃবিনিয়োগ পরামর্শ`
          )}
        </div>
      )}

      {dismissed && (
        <div className="bg-[#F3F2EE] border border-line px-4 py-2.5 mb-4 text-sm text-muted">
          {t("Dismissed. You can still change the numbers below and see the ranking update.", "বাতিল করা হয়েছে। এখনও নিচের সংখ্যাগুলো পরিবর্তন করে র‍্যাংকিং দেখতে পারেন।")}
        </div>
      )}

      {!taxResult && (
        <div className="bg-[#FAF9F5] border border-line px-4 py-2.5 mb-4 text-xs text-muted">
          {t(
            "You haven't tracked any income or investments yet, so this can't check your tax-rebate headroom — it's ranking purely on after-tax real return and your goal horizon. Track your income/investments to get the rebate-aware version.",
            "আপনি এখনো কোনো আয় বা বিনিয়োগ ট্র্যাক করেননি, তাই এটি আপনার ট্যাক্স-রেয়াতের সুযোগ যাচাই করতে পারছে না — শুধু ট্যাক্স-পরবর্তী প্রকৃত মুনাফা ও সময়সীমার ভিত্তিতে র‍্যাংক করা হয়েছে। রেয়াত-সচেতন সংস্করণের জন্য আপনার আয়/বিনিয়োগ ট্র্যাক করুন।"
          )}
        </div>
      )}

      {/* Controls */}
      <div className="bg-card border border-line p-5 rounded-sm mb-6 shadow-xs">
        <h2 className="font-serif font-semibold text-base text-green-deep mb-3">
          {t("How much, and for how long?", "কত টাকা, আর কত দিনের জন্য?")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <NumberField
            label={t("Amount to reinvest (৳)", "পুনঃবিনিয়োগের পরিমাণ (৳)")}
            value={amount}
            onChange={setAmount}
          />

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label htmlFor="reinvest-horizon" className="text-[#555] font-medium">
                {t("When will you need this money?", "টাকাটা কবে দরকার হবে?")}
              </label>
              <span className="font-mono font-semibold text-green-deep text-xs">
                {horizonYears} {t("yrs", "বছর")}
              </span>
            </div>
            <input
              id="reinvest-horizon"
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={horizonYears}
              onChange={(e) => setHorizonYears(parseFloat(e.target.value))}
              className="w-full accent-green cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label htmlFor="reinvest-inflation" className="text-[#555] font-medium">
                {t("Inflation expectation", "প্রত্যাশিত মূল্যস্ফীতি")}
              </label>
              <span className="font-mono font-semibold text-gold text-xs">{inflationPct}%</span>
            </div>
            <input
              id="reinvest-inflation"
              type="range"
              min={4}
              max={15}
              step={0.5}
              value={inflationPct}
              onChange={(e) => setInflationPct(parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
            />
          </div>

          <div className="pb-1">
            <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer bg-[#FBFAF6] border border-line p-2 rounded-sm">
              <input
                type="checkbox"
                checked={hasPSR}
                onChange={(e) => setHasPSR(e.target.checked)}
                className="w-auto"
              />
              <span className="leading-tight">
                {t(
                  "Have Return Proof (PSR)? (10% TDS instead of 15%)",
                  "রিটার্ন দাখিলের প্রমাণ (PSR) আছে? (১৫% এর বদলে ১০% কর)"
                )}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Ranked categories */}
      <div className="space-y-4">
        {result.categories.map((c, idx) => (
          <CategoryCard key={c.category} score={c} rank={idx + 1} lang={lang} t={t} />
        ))}
      </div>

      {/* Save / dismiss */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!investmentEntryId && !suggestionId && (
          <button
            onClick={saveSuggestion}
            disabled={saveState === "saving"}
            className="bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saveState === "saving"
              ? t("Saving…", "সেভ হচ্ছে…")
              : t("Save this suggestion", "এই পরামর্শ সেভ করো")}
          </button>
        )}
        {saveState === "saved" && (
          <span className="text-xs text-green">{t("Saved to your tracker history.", "আপনার ট্র্যাকার হিস্ট্রিতে সেভ হয়েছে।")}</span>
        )}
        {saveState === "error" && (
          <span className="text-xs text-red">{t("Couldn't save — try again.", "সেভ করা যায়নি — আবার চেষ্টা করুন।")}</span>
        )}
        {suggestionId && !dismissed && (
          <button
            onClick={dismissSuggestion}
            className="text-xs text-muted underline"
          >
            {t("Not useful? Dismiss this suggestion", "কাজে লাগেনি? এই পরামর্শ বাতিল করুন")}
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-[#FAF9F5] border border-line p-4 rounded-sm text-xs text-muted leading-relaxed">
        {t(
          "This is a suggestion to consider, not investment advice. It ranks instrument categories (Sanchayapatra, Govt Bond/Sukuk, Bank FDR, Mutual Fund) using deterministic math over your own tracked data — after-tax real return, your remaining tax-rebate room, and how long you said you can leave the money — and shows every number that went into the ranking. It never names, ranks, or recommends a specific bank, branch, or fund. Instrument-class figures follow the same catalog as the Real Yield Matrix (see /instruments) and are reviewed periodically, not scraped live.",
          "এটি বিবেচনা করার মতো একটি পরামর্শ, বিনিয়োগ পরামর্শ নয়। এটি আপনার নিজের ট্র্যাক করা তথ্যের উপর ভিত্তি করে — ট্যাক্স-পরবর্তী প্রকৃত মুনাফা, অবশিষ্ট ট্যাক্স রেয়াতের সুযোগ, এবং আপনি কতদিন টাকা রাখতে পারবেন — নির্দিষ্ট গাণিতিক হিসাবে ইনস্ট্রুমেন্ট ক্যাটাগরি (সঞ্চয়পত্র, সরকারি বন্ড/সুকুক, ব্যাংক এফডিআর, মিউচুয়াল ফান্ড) র‍্যাংক করে এবং র‍্যাংকিং-এ ব্যবহৃত প্রতিটি সংখ্যা দেখায়। এটি কখনো কোনো নির্দিষ্ট ব্যাংক, শাখা বা ফান্ডের নাম বলে না, র‍্যাংক করে না, বা সুপারিশ করে না। ইনস্ট্রুমেন্ট-শ্রেণির সংখ্যাগুলো রিয়েল ইয়িল্ড ম্যাট্রিক্স (/instruments) এর মতো একই তালিকা থেকে নেওয়া এবং নিয়মিত পর্যালোচনা করা হয়, লাইভ স্ক্র্যাপ করা নয়।"
        )}
      </div>
    </div>
  );
}

function CategoryCard({
  score,
  rank,
  lang,
  t,
}: {
  score: ReinvestCategoryScore;
  rank: number;
  lang: "en" | "bn";
  t: (en: string, bn: string) => string;
}) {
  const isTop = rank === 1;
  const reasons = lang === "bn" ? score.reasonsBn : score.reasonsEn;

  return (
    <div
      className={`bg-card border rounded-sm p-4.5 shadow-xs ${
        isTop ? "border-green bg-[#FBFCFB]" : "border-line"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-line/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-xs bg-muted/10 text-green-deep">
              #{rank}
            </span>
            <h3 className="font-serif font-bold text-base text-green-deep">
              {lang === "bn" ? score.nameBn : score.nameEn}
            </h3>
            <span
              className={`text-[10px] font-mono font-semibold border px-1.5 py-0.5 rounded-xs ${HORIZON_FIT_STYLE[score.horizonFit]}`}
            >
              {score.horizonFit === "good"
                ? t("FITS YOUR TIMELINE", "সময়সীমার সাথে মানানসই")
                : score.horizonFit === "under"
                ? t("SHORTER THAN TYPICAL TERM", "স্বাভাবিক মেয়াদের চেয়ে কম")
                : t("LONGER THAN TYPICAL TERM", "স্বাভাবিক মেয়াদের চেয়ে বেশি")}
            </span>
            {score.sovereignGuaranteed && (
              <span className="text-[10px] font-mono font-semibold bg-[#EAF5EC] text-green border border-green/30 px-1.5 py-0.5 rounded-xs">
                {t("SOVEREIGN GUARANTEE", "সরকারি নিশ্চয়তা")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-right shrink-0">
          <div>
            <span className="text-[10.5px] text-muted block">{t("After-Tax Net Yield", "ট্যাক্স-পরবর্তী নেট")}</span>
            <span className="font-mono font-bold text-lg text-green">{score.netRatePct}%</span>
          </div>
          <div>
            <span className="text-[10.5px] text-muted block">{t("Real Return", "প্রকৃত মুনাফা")}</span>
            <span className={`font-mono font-bold text-lg ${score.realYieldPct >= 0 ? "text-green" : "text-red"}`}>
              {score.realYieldPct >= 0 ? "+" : ""}
              {score.realYieldPct}%
            </span>
          </div>
        </div>
      </div>

      <ul className="pt-3 space-y-1.5 text-[13px] text-[#444] list-disc list-inside">
        {reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <div className="mt-3 pt-2.5 border-t border-line/60 flex flex-wrap justify-between gap-2 text-[11px] text-muted">
        <span>
          {t("Score breakdown: ", "স্কোর বিভাজন: ")}
          <span className="font-mono">
            {t("yield", "মুনাফা")} {score.scoreBreakdown.realYieldPoints >= 0 ? "+" : ""}
            {score.scoreBreakdown.realYieldPoints} · {t("rebate", "রেয়াত")}{" "}
            {score.scoreBreakdown.rebatePoints >= 0 ? "+" : ""}
            {score.scoreBreakdown.rebatePoints} · {t("horizon", "মেয়াদ")}{" "}
            {score.scoreBreakdown.horizonFitPoints >= 0 ? "+" : ""}
            {score.scoreBreakdown.horizonFitPoints} = <strong>{score.scoreBreakdown.total}</strong>
          </span>
        </span>
        <span>
          {t(`~${score.minTermYears}-${score.maxTermYears} yr typical term`, `স্বাভাবিক মেয়াদ ~${score.minTermYears}-${score.maxTermYears} বছর`)}
          {" · "}
          {t("maturity value", "মেয়াদপূর্তির মূল্য")}: <span className="font-mono">{fmtTaka(score.totalMaturityValue)}</span>
        </span>
      </div>
    </div>
  );
}
