"use client";

import { useMemo, useState } from "react";
import {
  calculateGoalPlan,
  GOAL_PRESETS,
  type GoalCategory,
} from "@/lib/goals/goals";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

export function GoalPlanner() {
  const { t, lang } = useLanguage();

  const [category, setCategory] = useState<GoalCategory>("FLAT_DOWNPAYMENT");
  const activePreset = GOAL_PRESETS[category];

  const [presentCost, setPresentCost] = useState<number>(activePreset.defaultAmount);
  const [targetYears, setTargetYears] = useState<number>(activePreset.defaultYears);
  const [inflationPct, setInflationPct] = useState<number>(activePreset.defaultInflationPct);
  const [existingSavings, setExistingSavings] = useState<number>(0);

  function handleSelectPreset(cat: GoalCategory) {
    setCategory(cat);
    const preset = GOAL_PRESETS[cat];
    setPresentCost(preset.defaultAmount);
    setTargetYears(preset.defaultYears);
    setInflationPct(preset.defaultInflationPct);
  }

  const result = useMemo(
    () =>
      calculateGoalPlan({
        category,
        presentCost,
        targetYears,
        inflationPct,
        existingSavings,
      }),
    [category, presentCost, targetYears, inflationPct, existingSavings]
  );

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Preset Goal Selector */}
      <div className="mb-6">
        <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          {t("Choose a Goal Template or Customize", "লক্ষ্য বেছে নিন বা কাস্টমাইজ করুন")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {(Object.keys(GOAL_PRESETS) as GoalCategory[]).map((cat) => {
            const preset = GOAL_PRESETS[cat];
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectPreset(cat)}
                className={`p-3 text-left border rounded-sm transition-all ${
                  isSelected
                    ? "bg-green-deep text-paper border-green-deep shadow-sm"
                    : "bg-card border-line hover:border-gold text-foreground"
                }`}
              >
                <div className="text-xl mb-1">{preset.icon}</div>
                <div className="text-xs font-semibold leading-tight line-clamp-2">
                  {lang === "bn" ? preset.titleBn : preset.titleEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-line p-5 rounded-sm">
            <h2 className="font-serif font-semibold text-lg text-green-deep mb-1">
              {lang === "bn" ? activePreset.titleBn : activePreset.titleEn}
            </h2>
            <p className="text-xs text-muted mb-4">
              {lang === "bn" ? activePreset.descriptionBn : activePreset.descriptionEn}
            </p>

            <div className="space-y-4">
              <NumberField
                label={t("Target amount in today's money (৳)", "বর্তমান মূল্যে লক্ষ্যের পরিমাণ (৳)")}
                value={presentCost}
                onChange={setPresentCost}
              />

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="goal-target-years" className="text-[#555] font-medium">
                    {t("Time Horizon", "সময়সীমা (বছর)")}
                  </label>
                  <span className="font-mono font-semibold text-green-deep text-sm">
                    {targetYears} {t("Years", "বছর")} ({targetYears * 12} {t("Months", "মাস")})
                  </span>
                </div>
                <input
                  id="goal-target-years"
                  type="range"
                  min={1}
                  max={30}
                  value={targetYears}
                  onChange={(e) => setTargetYears(parseInt(e.target.value, 10))}
                  className="w-full accent-green-deep cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                  <span>1 yr</span>
                  <span>5 yrs</span>
                  <span>10 yrs</span>
                  <span>20 yrs</span>
                  <span>30 yrs</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="goal-inflation-rate" className="text-[#555] font-medium">
                    {t("Expected Bangladesh Annual Inflation", "প্রত্যাশিত বার্ষিক মূল্যস্ফীতি")}
                  </label>
                  <span className="font-mono font-semibold text-gold text-sm">
                    {inflationPct}%
                  </span>
                </div>
                <input
                  id="goal-inflation-rate"
                  type="range"
                  min={4}
                  max={15}
                  step={0.5}
                  value={inflationPct}
                  onChange={(e) => setInflationPct(parseFloat(e.target.value))}
                  className="w-full accent-gold cursor-pointer"
                />
                <p className="text-[11px] text-muted mt-1">
                  {t(
                    "Historically, Bangladesh official CPI runs around 7–10%. Education and vehicle costs often compound faster.",
                    "বাংলাদেশে সাধারণত মূল্যস্ফীতি ৭–১০% এর মধ্যে ওঠানামা করে। শিক্ষা ও গাড়ির খরচ আরও দ্রুত বাড়ে।"
                  )}
                </p>
              </div>

              <NumberField
                label={t("Existing savings already set aside (৳)", "ইতিমধ্যে জমানো টাকা (৳)")}
                value={existingSavings}
                onChange={setExistingSavings}
              />
            </div>
          </div>

          {/* Lazy Money Leak Warning Card */}
          {result.lazyMoneyPurchasingPowerLoss > 0 && (
            <div className="bg-[#FFFDF5] border-l-4 border-gold border border-line p-4 rounded-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-sm text-green-deep mb-1">
                    {t("The 'Lazy Money' Leak", "অলস টাকার নিঃশব্দ অপচয়")}
                  </h3>
                  <p className="text-xs text-[#555] leading-relaxed">
                    {t(
                      `If kept in a standard savings account (~3.5% rate), your money will lose `,
                      `সাধারণ সেভিংস একাউন্টে (৩.৫% মুনাফা) ফেলে রাখলে আগামী ${targetYears} বছরে আপনার টাকার ক্রয়ক্ষমতা কমবে `
                    )}
                    <strong className="text-red font-mono">
                      {fmtTaka(result.lazyMoneyPurchasingPowerLoss)}
                    </strong>{" "}
                    {t(
                      `in real purchasing power over ${targetYears} years due to ${inflationPct}% inflation. Investing in structured instruments protects your future money.`,
                      `। মূল্যস্ফীতির কারণে আপনার টাকা যাতে ক্ষয় না হয়, সেজন্য নির্দিষ্ট মেয়াদী স্কিম বেছে নেওয়া জরুরি।`
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Milestone Trajectory Table */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-sm text-green-deep mb-3">
              {t("Milestone Trajectory (Top Bank DPS Route)", "বছরভিত্তিক সঞ্চয় অগ্রগতি (ডিপিএস মডেল)")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-line text-muted font-mono">
                  <tr>
                    <th className="py-2">{t("Year", "বছর")}</th>
                    <th className="py-2 text-right">{t("Target Corpus", "লক্ষ্যমাত্রা")}</th>
                    <th className="py-2 text-right">{t("Principal Deposited", "জমা মূলধন")}</th>
                    <th className="py-2 text-right text-green-deep">{t("Est. Balance", "প্রত্যাশিত ব্যালেন্স")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {result.timeline.map((m) => (
                    <tr key={m.year} className="hover:bg-[#FAF9F5]">
                      <td className="py-2 font-mono font-medium">
                        {t(`Year ${m.year}`, `${m.year}ম বছর`)}
                      </td>
                      <td className="py-2 text-right font-mono text-muted">
                        {fmtTaka(m.futureTarget)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {fmtTaka(m.totalPrincipal)}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-green-deep">
                        {fmtTaka(m.accumulatedBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Required DPS / SIP Matrix */}
        <div className="flex flex-col gap-4 sticky top-4">
          {/* Inflation Impact Card */}
          <div className="bg-green-deep text-paper p-5 rounded-sm border-t-4 border-gold shadow-sm">
            <span className="inline-block font-mono text-[10px] text-gold border border-gold/60 px-1.5 py-0.5 mb-2">
              {t("INFLATION REALITY", "মূল্যস্ফীতি হিসাব")}
            </span>
            <div className="text-xs text-paper/80 mb-1">
              {t("In", "আজকের")} {fmtTaka(result.presentCost)} {t("today will cost:", "ভবিষ্যতে দাঁড়াবে:")}
            </div>
            <div className="font-mono font-bold text-2xl text-gold mb-2">
              {fmtTaka(result.futureNominalCost)}
            </div>
            <p className="text-[11.5px] text-paper/70 leading-relaxed border-t border-paper/20 pt-2">
              {t(
                `At ${inflationPct}% annual inflation, you need ${fmtTaka(
                  result.futureNominalCost - result.presentCost
                )} extra in nominal BDT to afford the exact same milestone in ${targetYears} years.`,
                `${inflationPct}% বার্ষিক মূল্যস্ফীতিতে আগামী ${targetYears} বছর পর সমপরিমাণ মান অর্জন করতে আপনার অতিরিক্ত ${fmtTaka(
                  result.futureNominalCost - result.presentCost
                )} টাকা প্রয়োজন হবে।`
              )}
            </p>
          </div>

          {/* Monthly Required Contribution Cards by Asset Class */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3 pb-2 border-b border-line">
              {t("Monthly Investment Required", "মাসিক সঞ্চয়ের প্রয়োজন (প্রতি মাসে)")}
            </h3>

            <div className="space-y-3">
              {result.yieldTiers.map((tier) => {
                const isSukuk = tier.id === "gov-sukuk";
                const isDPS = tier.id === "bank-dps";
                const isSavings = tier.id === "savings-account";

                return (
                  <div
                    key={tier.id}
                    className={`p-3.5 border rounded-sm transition-all ${
                      isSukuk
                        ? "bg-[#F7FBF8] border-green"
                        : isDPS
                        ? "bg-[#FAF8F3] border-gold"
                        : isSavings
                        ? "bg-[#FFF9F9] border-red/30 opacity-80"
                        : "bg-card border-line"
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-xs text-green-deep">
                        {lang === "bn" ? tier.nameBn : tier.nameEn}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        {tier.headlineRatePct}% ({tier.netRatePct}% {t("net", "নেট")})
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-[11px] text-muted">
                        {t("Monthly DPS:", "মাসিক কিস্তি:")}
                      </span>
                      <span
                        className={`font-mono font-bold text-base ${
                          isSavings ? "text-red" : "text-green-deep"
                        }`}
                      >
                        {fmtTaka(tier.monthlyDPSRequired)}
                        <span className="text-[10px] font-normal text-muted">/{t("mo", "মাস")}</span>
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-muted font-mono mt-2 pt-1.5 border-t border-line/60">
                      <span>
                        {t("Total Deposit: ", "মোট আসল: ")}
                        {fmtTaka(tier.totalInvested)}
                      </span>
                      <span className="text-green font-medium">
                        {t("Interest: +", "মুনাফা: +")}
                        {fmtTaka(tier.totalInterestEarned)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted leading-relaxed">
              {t(
                "Calculations assume standard 10% tax deduction at source (TDS) for bank deposits and 15% for ordinary savings. Does not constitute advice.",
                "হিসাবে ব্যাংক জমার উপর ১০% কর কর্তন (TDS) ও সাধারণ সেভিংসের জন্য ১৫% ধরা হয়েছে। এটি কোনো আর্থিক পরামর্শ নয়।"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
