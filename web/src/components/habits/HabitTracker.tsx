"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  HABIT_CATEGORIES,
  HABIT_CATEGORY_IDS,
  summariseHabits,
  type HabitCategory,
  type HabitEntry,
  type HabitNudge,
  type NudgeSeverity,
} from "@/lib/habits/habits";
import {
  getHabitServerSnapshot,
  getHabitSnapshot,
  subscribeToHabits,
  writeHabitState,
} from "@/lib/habits/store";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

const SEVERITY_STYLES: Record<NudgeSeverity, { box: string; dot: string; label: { en: string; bn: string } }> = {
  alert: {
    box: "bg-[#FBEFEF] border-red/40",
    dot: "bg-red",
    label: { en: "OVER", bn: "সীমা ছাড়িয়েছে" },
  },
  watch: {
    box: "bg-amber-bg border-amber-border/70",
    dot: "bg-amber-border",
    label: { en: "WORTH A LOOK", bn: "লক্ষ্য করার মতো" },
  },
  info: {
    box: "bg-[#F7FBF8] border-green/40",
    dot: "bg-green",
    label: { en: "PATTERN", bn: "প্রবণতা" },
  },
};

function NudgeCard({ nudge }: { nudge: HabitNudge }) {
  const { t, lang } = useLanguage();
  const style = SEVERITY_STYLES[nudge.severity];

  return (
    <div className={`border p-3.5 rounded-sm ${style.box}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
        <span className="font-mono text-[10px] tracking-wider text-muted">
          {lang === "bn" ? style.label.bn : style.label.en}
        </span>
        {nudge.monthlySaving > 0 && (
          <span className="ml-auto font-mono text-[11px] font-semibold text-green-deep">
            {fmtTaka(nudge.monthlySaving)}/{t("mo", "মাস")}
          </span>
        )}
      </div>
      <h4 className="font-semibold text-[13px] text-green-deep mb-1 leading-snug">
        {lang === "bn" ? nudge.titleBn : nudge.titleEn}
      </h4>
      <p className="text-[11.5px] text-[#555] leading-relaxed">
        {lang === "bn" ? nudge.bodyBn : nudge.bodyEn}
      </p>
    </div>
  );
}

export function HabitTracker() {
  const { t, lang } = useLanguage();

  // The saved list lives in localStorage and is read through an external store, so the
  // server render and the hydrating render agree before the stored state swaps in.
  const state = useSyncExternalStore(subscribeToHabits, getHabitSnapshot, getHabitServerSnapshot);
  const { entries, monthlyIncome, horizonYears } = state;

  function setEntries(update: (prev: HabitEntry[]) => HabitEntry[]) {
    writeHabitState({ ...state, entries: update(state.entries) });
  }
  const setMonthlyIncome = (monthlyIncome: number) => writeHabitState({ ...state, monthlyIncome });
  const setHorizonYears = (horizonYears: number) => writeHabitState({ ...state, horizonYears });

  const summary = useMemo(
    () => summariseHabits({ entries, monthlyIncome, horizonYears }),
    [entries, monthlyIncome, horizonYears]
  );

  function updateEntry(id: string, patch: Partial<HabitEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addEntry(category: HabitCategory) {
    const def = HABIT_CATEGORIES[category];
    setEntries((prev) => [
      ...prev,
      {
        id: `h-${category}-${Date.now()}`,
        category,
        label: "",
        unitCost: def.defaultUnitCost,
        timesPerMonth: def.defaultTimesPerMonth,
        monthlyCap: 0,
        ...(def.comparison === "USAGE" ? { usesPerMonth: def.defaultTimesPerMonth } : {}),
      },
    ]);
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const allNudges = [
    ...summary.portfolioNudges,
    ...summary.entries.flatMap((e) => e.nudges),
  ].sort((a, b) => b.monthlySaving - a.monthlySaving);

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Category picker — adds a habit of that kind */}
      <div className="mb-6">
        <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          {t("Add a habit to track", "ট্র্যাক করার জন্য অভ্যাস যোগ করুন")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {HABIT_CATEGORY_IDS.map((cat) => {
            const def = HABIT_CATEGORIES[cat];
            const count = entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => addEntry(cat)}
                className="p-3 text-left border rounded-sm transition-all bg-card border-line hover:border-gold text-foreground"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xl mb-1">{def.icon}</span>
                  {count > 0 && (
                    <span className="font-mono text-[10px] text-muted">{count}</span>
                  )}
                </div>
                <div className="text-xs font-semibold leading-tight">
                  {lang === "bn" ? def.titleBn : def.titleEn}
                </div>
                <div className="text-[10px] text-muted mt-0.5">+ {t("add", "যোগ")}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Left: the habits themselves */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-line p-5 rounded-sm">
            <h2 className="font-serif font-semibold text-lg text-green-deep mb-1">
              {t("Your tracked habits", "আপনার ট্র্যাক করা অভ্যাস")}
            </h2>
            <p className="text-xs text-muted mb-4">
              {t(
                "Set a monthly cap on the ones you want to regulate. Leave it at zero and the habit is only measured, not policed.",
                "যেগুলো নিয়ন্ত্রণে রাখতে চান, সেগুলোর মাসিক সীমা দিন। শূন্য রাখলে শুধু হিসাব হবে, কোনো সতর্কতা আসবে না।"
              )}
            </p>

            {entries.length === 0 && (
              <p className="text-sm text-muted border border-dashed border-line p-6 text-center rounded-sm">
                {t(
                  "Nothing tracked yet. Pick a category above to add your first habit.",
                  "এখনো কিছু যোগ করা হয়নি। উপরের একটি ক্যাটাগরি বেছে প্রথম অভ্যাসটি যোগ করুন।"
                )}
              </p>
            )}

            <div className="space-y-4">
              {summary.entries.map((result) => {
                const entry = result.entry;
                const def = HABIT_CATEGORIES[entry.category];
                return (
                  <div
                    key={entry.id}
                    className={`border p-4 rounded-sm ${
                      result.overCapBy > 0 ? "border-red/40 bg-[#FFFCFC]" : "border-line bg-[#FCFBF8]"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-lg leading-none mt-1">{def.icon}</span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={entry.label}
                          placeholder={lang === "bn" ? def.titleBn : def.titleEn}
                          aria-label={t("Habit name", "অভ্যাসের নাম")}
                          onChange={(e) => updateEntry(entry.id, { label: e.target.value })}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-line focus:border-green focus:outline-none text-sm font-semibold text-green-deep py-0.5"
                        />
                        <p className="text-[10.5px] text-muted mt-0.5">
                          {lang === "bn" ? def.exampleBn : def.exampleEn}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        aria-label={t("Remove habit", "অভ্যাস সরান")}
                        className="text-muted hover:text-red text-sm px-1.5 leading-none"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <NumberField
                        label={t(`Cost per ${def.unitEn}`, `প্রতি ${def.unitBn}-এ খরচ`)}
                        value={entry.unitCost}
                        onChange={(n) => updateEntry(entry.id, { unitCost: n })}
                      />
                      <NumberField
                        label={t(`${def.unitEn}s per month`, `মাসে কতবার`)}
                        value={entry.timesPerMonth}
                        onChange={(n) => updateEntry(entry.id, { timesPerMonth: n })}
                        currency={false}
                      />
                      <NumberField
                        label={t("Monthly cap (0 = none)", "মাসিক সীমা (০ = নেই)")}
                        value={entry.monthlyCap}
                        onChange={(n) => updateEntry(entry.id, { monthlyCap: n })}
                      />

                      {def.comparison === "BUNDLE" && (
                        <NumberField
                          label={t("One pack for the whole month costs", "পুরো মাসের এক প্যাকের দাম")}
                          value={entry.bundleCost ?? 0}
                          onChange={(n) => updateEntry(entry.id, { bundleCost: n })}
                        />
                      )}
                      {def.comparison === "SELF_SERVE" && (
                        <NumberField
                          label={t(`Same ${def.unitEn} done yourself`, `নিজে করলে প্রতিবারে খরচ`)}
                          value={entry.selfServeCost ?? 0}
                          onChange={(n) => updateEntry(entry.id, { selfServeCost: n })}
                        />
                      )}
                      {def.comparison === "USAGE" && (
                        <NumberField
                          label={t("Times actually used per month", "মাসে আসলে কতবার ব্যবহার করেছেন")}
                          value={entry.usesPerMonth ?? 0}
                          onChange={(n) => updateEntry(entry.id, { usesPerMonth: n })}
                          currency={false}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 mt-3 pt-2.5 border-t border-line/60 text-[11px] font-mono">
                      <span className="text-muted">
                        {t("Per month: ", "মাসে: ")}
                        <strong className="text-green-deep">{fmtTaka(result.monthlySpend)}</strong>
                      </span>
                      <span className="text-muted">
                        {t("Per year: ", "বছরে: ")}
                        <strong className="text-green-deep">{fmtTaka(result.yearlySpend)}</strong>
                      </span>
                      {result.costPerUse !== null && (
                        <span className="text-muted">
                          {t("Per use: ", "প্রতিবার ব্যবহারে: ")}
                          <strong className="text-green-deep">{fmtTaka(result.costPerUse)}</strong>
                        </span>
                      )}
                      <span className="text-muted">
                        {result.shareOfTrackedPct}% {t("of tracked", "অংশ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What the engine noticed */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-1">
              {t("What the numbers say", "সংখ্যাগুলো যা বলছে")}
            </h3>
            <p className="text-[11px] text-muted mb-3">
              {t(
                "Each line below is arithmetic on a figure you entered. Nothing here is looked up or recommended.",
                "নিচের প্রতিটি লাইন আপনার দেওয়া সংখ্যার হিসাব। এখানে কিছু খোঁজা বা সুপারিশ করা হয়নি।"
              )}
            </p>

            {allNudges.length === 0 ? (
              <p className="text-sm text-muted border border-dashed border-line p-5 text-center rounded-sm">
                {t(
                  "Nothing to flag. Set a monthly cap, or enter what a cheaper alternative costs, and comparisons appear here.",
                  "বলার মতো কিছু নেই। মাসিক সীমা দিন, অথবা সস্তা বিকল্পের দাম লিখুন — তুলনা এখানে দেখা যাবে।"
                )}
              </p>
            ) : (
              <div className="space-y-2.5">
                {allNudges.map((nudge, i) => (
                  <NudgeCard key={`${nudge.code}-${nudge.entryId ?? "all"}-${i}`} nudge={nudge} />
                ))}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {summary.categoryTotals.length > 0 && (
            <div className="bg-card border border-line p-5 rounded-sm">
              <h3 className="font-serif font-semibold text-sm text-green-deep mb-3">
                {t("Where it goes", "কোন খাতে কত যাচ্ছে")}
              </h3>
              <div className="space-y-2.5">
                {[...summary.categoryTotals]
                  .sort((a, b) => b.monthlySpend - a.monthlySpend)
                  .map((cat) => {
                    const def = HABIT_CATEGORIES[cat.category];
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between items-baseline text-xs mb-1">
                          <span className="font-medium text-green-deep">
                            {def.icon} {lang === "bn" ? def.titleBn : def.titleEn}
                          </span>
                          <span className="font-mono text-muted">
                            {fmtTaka(cat.monthlySpend)}/{t("mo", "মাস")} · {cat.pctOfTracked}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-line/70 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-green-deep"
                            style={{ width: `${Math.min(100, cat.pctOfTracked)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right: the totals */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">
          <div className="bg-green-deep text-paper p-5 rounded-sm border-t-4 border-gold shadow-sm">
            <span className="inline-block font-mono text-[10px] text-gold border border-gold/60 px-1.5 py-0.5 mb-2">
              {t("THE REAL TOTAL", "প্রকৃত মোট")}
            </span>
            <div className="text-xs text-paper/80 mb-1">
              {t("These habits cost you, every month:", "প্রতি মাসে এই অভ্যাসগুলোর খরচ:")}
            </div>
            <div className="font-mono font-bold text-2xl text-gold mb-2">
              {fmtTaka(summary.totalMonthly)}
            </div>
            <div className="text-xs text-paper/80 border-t border-paper/20 pt-2">
              {t("Over twelve months:", "বারো মাসে:")}{" "}
              <strong className="font-mono text-paper">{fmtTaka(summary.totalYearly)}</strong>
            </div>
            {summary.shareOfIncomePct !== null && (
              <div className="text-xs text-paper/80 mt-1">
                {t("Share of your monthly income:", "মাসিক আয়ের অংশ:")}{" "}
                <strong className="font-mono text-paper">{summary.shareOfIncomePct}%</strong>
              </div>
            )}
          </div>

          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3 pb-2 border-b border-line">
              {t("Your context", "আপনার প্রেক্ষাপট")}
            </h3>
            <NumberField
              label={t("Monthly take-home income (optional)", "মাসিক হাতে পাওয়া আয় (ঐচ্ছিক)")}
              value={monthlyIncome}
              onChange={setMonthlyIncome}
            />
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <label htmlFor="habit-horizon" className="text-[#555] font-medium">
                  {t("If saved instead, for", "সঞ্চয় করলে, কত বছরের জন্য")}
                </label>
                <span className="font-mono font-semibold text-green-deep text-sm">
                  {horizonYears} {t("Years", "বছর")}
                </span>
              </div>
              <input
                id="habit-horizon"
                type="range"
                min={1}
                max={30}
                value={horizonYears}
                onChange={(e) => setHorizonYears(parseInt(e.target.value, 10))}
                className="w-full accent-green-deep cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-1">
              {t("Found, without giving anything up", "কিছু না ছেড়েই যা পাওয়া গেল")}
            </h3>
            <p className="text-[11px] text-muted mb-3">
              {t(
                "The largest single saving on each habit — your own caps and your own cheaper alternatives, never added twice.",
                "প্রতিটি অভ্যাসে সম্ভাব্য সর্বোচ্চ একটি সাশ্রয় — আপনার নিজের সীমা ও নিজের দেওয়া বিকল্প অনুযায়ী, কখনো দুবার যোগ করা হয় না।"
              )}
            </p>

            <div className="flex justify-between items-baseline py-1.5">
              <span className="text-xs text-muted">{t("Per month", "প্রতি মাসে")}</span>
              <span className="font-mono font-bold text-base text-green-deep">
                {fmtTaka(summary.identifiedMonthlySaving)}
              </span>
            </div>
            <div className="flex justify-between items-baseline py-1.5 border-t border-line/60">
              <span className="text-xs text-muted">{t("Per year", "প্রতি বছরে")}</span>
              <span className="font-mono font-bold text-base text-green-deep">
                {fmtTaka(summary.identifiedYearlySaving)}
              </span>
            </div>

            {summary.identifiedMonthlySaving > 0 && (
              <div className="mt-3 pt-3 border-t border-line bg-[#F7FBF8] -mx-5 -mb-5 px-5 py-4">
                <div className="text-[11px] text-muted mb-1">
                  {t(
                    `Put aside every month for ${summary.opportunityHorizonYears} years instead:`,
                    `এই টাকা ${summary.opportunityHorizonYears} বছর ধরে প্রতি মাসে সঞ্চয় করলে:`
                  )}
                </div>
                <div className="font-mono font-bold text-xl text-green-deep">
                  {fmtTaka(summary.opportunityValue)}
                </div>
                <p className="text-[10.5px] text-muted mt-1.5 leading-relaxed">
                  {t(
                    "At 9.5% headline less 10% tax at source — the same bank DPS benchmark the goal planner uses. An estimate, not a guarantee.",
                    "৯.৫% ঘোষিত হারে, ১০% উৎসে কর বাদে — লক্ষ্য প্ল্যানারে ব্যবহৃত একই ব্যাংক ডিপিএস মানদণ্ড। এটি একটি প্রাক্কলন, নিশ্চয়তা নয়।"
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
