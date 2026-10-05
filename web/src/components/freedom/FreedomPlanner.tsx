"use client";

import { useMemo, useState } from "react";
import {
  LIFESTYLE_PRESETS,
  calculateFreedomPlan,
  type AllocationRole,
  type FreedomLifestyle,
  type PassiveIncomeSource,
} from "@/lib/freedom/freedom";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

const LIFESTYLE_IDS = Object.keys(LIFESTYLE_PRESETS) as FreedomLifestyle[];

const ALLOCATION_ACCENT: Record<AllocationRole, string> = {
  LIQUID_BUFFER: "border-l-green/50",
  INCOME_FLOOR: "border-l-green-deep",
  GROWTH: "border-l-gold",
  VENTURE: "border-l-red/60",
};

function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  accent = "accent-green-deep",
  onChange,
  note,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  accent?: string;
  onChange: (n: number) => void;
  note?: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <label htmlFor={id} className="text-[#555] font-medium">
          {label}
        </label>
        <span className="font-mono font-semibold text-green-deep text-sm">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${accent} cursor-pointer`}
      />
      {note && <p className="text-[11px] text-muted mt-1 leading-relaxed">{note}</p>}
    </div>
  );
}

export function FreedomPlanner() {
  const { t, lang } = useLanguage();

  const [lifestyle, setLifestyle] = useState<FreedomLifestyle>("FULL_STOP");
  const [currentAge, setCurrentAge] = useState(30);
  const [freedomAge, setFreedomAge] = useState(45);
  const [planUntilAge, setPlanUntilAge] = useState(80);
  const [monthlyExpenseToday, setMonthlyExpenseToday] = useState(60_000);
  const [lightWorkIncomeToday, setLightWorkIncomeToday] = useState(0);
  const [inflationPct, setInflationPct] = useState(8.5);
  const [preFreedomReturnPct, setPreFreedomReturnPct] = useState(9);
  const [postFreedomReturnPct, setPostFreedomReturnPct] = useState(8);
  const [existingCorpus, setExistingCorpus] = useState(500_000);
  const [currentMonthlySaving, setCurrentMonthlySaving] = useState(20_000);
  const [essentialSharePct, setEssentialSharePct] = useState(70);
  const [ventureAppetitePct, setVentureAppetitePct] = useState(0);
  const [passiveIncomes, setPassiveIncomes] = useState<PassiveIncomeSource[]>([]);

  const activePreset = LIFESTYLE_PRESETS[lifestyle];

  function selectLifestyle(id: FreedomLifestyle) {
    setLifestyle(id);
    setLightWorkIncomeToday(LIFESTYLE_PRESETS[id].defaultLightWorkIncome);
  }

  function addPassive() {
    setPassiveIncomes((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        label: t("Flat / shop rent", "ফ্ল্যাট বা দোকান ভাড়া"),
        monthlyAmount: 20_000,
        growthPct: inflationPct,
      },
    ]);
  }

  function updatePassive(id: string, patch: Partial<PassiveIncomeSource>) {
    setPassiveIncomes((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  const plan = useMemo(
    () =>
      calculateFreedomPlan({
        currentAge,
        freedomAge,
        planUntilAge,
        monthlyExpenseToday,
        lifestyle,
        lightWorkIncomeToday,
        inflationPct,
        preFreedomReturnPct,
        postFreedomReturnPct,
        existingCorpus,
        currentMonthlySaving,
        passiveIncomes,
        essentialSharePct,
        ventureAppetitePct,
      }),
    [
      currentAge,
      freedomAge,
      planUntilAge,
      monthlyExpenseToday,
      lifestyle,
      lightWorkIncomeToday,
      inflationPct,
      preFreedomReturnPct,
      postFreedomReturnPct,
      existingCorpus,
      currentMonthlySaving,
      passiveIncomes,
      essentialSharePct,
      ventureAppetitePct,
    ]
  );

  const onTrack = plan.currentPaceSurplus >= 0;

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Lifestyle selector */}
      <div className="mb-6">
        <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          {t(
            "What does freedom actually look like for you?",
            "আপনার কাছে আর্থিক স্বাধীনতা মানে কী?"
          )}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {LIFESTYLE_IDS.map((id) => {
            const preset = LIFESTYLE_PRESETS[id];
            const isSelected = lifestyle === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectLifestyle(id)}
                className={`p-3 text-left border rounded-sm transition-all ${
                  isSelected
                    ? "bg-green-deep text-paper border-green-deep shadow-sm"
                    : "bg-card border-line hover:border-gold text-foreground"
                }`}
              >
                <div className="text-xl mb-1">{preset.icon}</div>
                <div className="text-xs font-semibold leading-tight">
                  {lang === "bn" ? preset.titleBn : preset.titleEn}
                </div>
                <div
                  className={`font-mono text-[10px] mt-1 ${isSelected ? "text-gold" : "text-muted"}`}
                >
                  {Math.round(preset.expenseMultiplier * 100)}%{" "}
                  {t("of today's spend", "আজকের খরচের")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Left column: inputs */}
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
                label={t(
                  "Your household's total monthly spending today (৳)",
                  "আজ আপনার সংসারের মোট মাসিক খরচ (৳)"
                )}
                value={monthlyExpenseToday}
                onChange={setMonthlyExpenseToday}
              />

              {activePreset.defaultLightWorkIncome > 0 && (
                <NumberField
                  label={t(
                    "Monthly income from light work, in today's money (৳)",
                    "হালকা কাজ থেকে মাসিক আয়, আজকের মূল্যে (৳)"
                  )}
                  value={lightWorkIncomeToday}
                  onChange={setLightWorkIncomeToday}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Slider
                  id="freedom-current-age"
                  label={t("Your age now", "আপনার বর্তমান বয়স")}
                  value={currentAge}
                  min={18}
                  max={70}
                  suffix={t(" yrs", " বছর")}
                  onChange={(n) => {
                    setCurrentAge(n);
                    if (freedomAge <= n) setFreedomAge(n + 1);
                  }}
                />
                <Slider
                  id="freedom-target-age"
                  label={t("Freedom at age", "স্বাধীনতার লক্ষ্য বয়স")}
                  value={freedomAge}
                  min={currentAge + 1}
                  max={85}
                  suffix={t(" yrs", " বছর")}
                  accent="accent-gold"
                  onChange={(n) => {
                    setFreedomAge(n);
                    if (planUntilAge <= n) setPlanUntilAge(n + 1);
                  }}
                />
                <Slider
                  id="freedom-plan-until"
                  label={t("Plan has to last until", "পরিকল্পনা চলবে যত বছর বয়স পর্যন্ত")}
                  value={planUntilAge}
                  min={freedomAge + 1}
                  max={105}
                  suffix={t(" yrs", " বছর")}
                  onChange={setPlanUntilAge}
                />
              </div>

              <Slider
                id="freedom-inflation"
                label={t("Expected annual inflation", "প্রত্যাশিত বার্ষিক মূল্যস্ফীতি")}
                value={inflationPct}
                min={4}
                max={15}
                step={0.5}
                suffix="%"
                accent="accent-gold"
                onChange={setInflationPct}
                note={t(
                  "Inflation is counted twice over: it raises the bill you will face at your freedom age, and it eats the return the corpus earns while you live off it.",
                  "মূল্যস্ফীতি দুইবার হিসাবে আসে — এটি স্বাধীনতার বয়সে আপনার খরচ বাড়ায়, আবার যে মূলধন থেকে চলবেন তার মুনাফাও খেয়ে ফেলে।"
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Slider
                  id="freedom-pre-return"
                  label={t("Net return while saving", "সঞ্চয়কালে নিট মুনাফা")}
                  value={preFreedomReturnPct}
                  min={0}
                  max={18}
                  step={0.5}
                  suffix="%"
                  onChange={setPreFreedomReturnPct}
                />
                <Slider
                  id="freedom-post-return"
                  label={t("Net return after freedom", "স্বাধীনতার পর নিট মুনাফা")}
                  value={postFreedomReturnPct}
                  min={0}
                  max={18}
                  step={0.5}
                  suffix="%"
                  onChange={setPostFreedomReturnPct}
                  note={t(
                    "Usually lower than while saving: the corpus moves into safer, more liquid instruments once it has to pay a monthly bill.",
                    "সাধারণত সঞ্চয়কালের চেয়ে কম: যে মূলধন থেকে প্রতি মাসে খরচ চলবে, তা নিরাপদ ও সহজে ভাঙানো যায় এমন জায়গায় রাখতে হয়।"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberField
                  label={t(
                    "Investable savings already built (৳)",
                    "ইতিমধ্যে গড়ে তোলা বিনিয়োগযোগ্য সঞ্চয় (৳)"
                  )}
                  value={existingCorpus}
                  onChange={setExistingCorpus}
                />
                <NumberField
                  label={t("What you save every month now (৳)", "এখন প্রতি মাসে যত সঞ্চয় করেন (৳)")}
                  value={currentMonthlySaving}
                  onChange={setCurrentMonthlySaving}
                />
              </div>
              <p className="text-[11px] text-muted -mt-2">
                {t(
                  "Count only money that can be invested. The home you live in pays no monthly bill, so it is not part of the corpus.",
                  "কেবল বিনিয়োগ করা যায় এমন টাকাই ধরুন। যে বাড়িতে আপনি থাকেন তা থেকে মাসিক আয় আসে না, তাই সেটি এই মূলধনের অংশ নয়।"
                )}
              </p>
            </div>
          </div>

          {/* Passive income already owned */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-serif font-semibold text-base text-green-deep">
                {t("Passive income you already own", "আপনার বিদ্যমান প্যাসিভ আয়")}
              </h3>
              <button
                type="button"
                onClick={addPassive}
                className="shrink-0 text-xs font-semibold text-green-deep border border-line hover:border-gold px-2.5 py-1 rounded-sm"
              >
                + {t("Add source", "উৎস যোগ করুন")}
              </button>
            </div>
            <p className="text-xs text-muted mb-3">
              {t(
                "Flat rent, shop rent, land lease — income that arrives whether you work or not. Every taka of it is a taka the corpus does not have to produce.",
                "ফ্ল্যাট ভাড়া, দোকান ভাড়া, জমির ইজারা — কাজ করুন বা না করুন, যে আয় আসতেই থাকে। এর প্রতিটি টাকা মানে মূলধনকে ততটা কম আয় করতে হবে।"
              )}
            </p>

            {passiveIncomes.length === 0 ? (
              <p className="text-xs text-muted border border-dashed border-line p-4 text-center rounded-sm">
                {t(
                  "No passive income added. The corpus is being sized to cover the entire bill on its own.",
                  "কোনো প্যাসিভ আয় যোগ করা হয়নি। পুরো খরচ মূলধনকে একাই বহন করতে হবে ধরে হিসাব হচ্ছে।"
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {passiveIncomes.map((src) => (
                  <div key={src.id} className="border border-line bg-[#FCFBF8] p-3 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={src.label}
                        aria-label={t("Income source name", "আয়ের উৎসের নাম")}
                        onChange={(e) => updatePassive(src.id, { label: e.target.value })}
                        className="flex-1 min-w-0 bg-transparent border-0 border-b border-transparent hover:border-line focus:border-green focus:outline-none text-sm font-semibold text-green-deep py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPassiveIncomes((prev) => prev.filter((p) => p.id !== src.id))
                        }
                        aria-label={t("Remove source", "উৎস সরান")}
                        className="text-muted hover:text-red text-sm px-1.5 leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField
                        label={t("Monthly, in today's money", "মাসিক, আজকের মূল্যে")}
                        value={src.monthlyAmount}
                        onChange={(n) => updatePassive(src.id, { monthlyAmount: n })}
                      />
                      <NumberField
                        label={t("Annual increase (%)", "বার্ষিক বৃদ্ধি (%)")}
                        value={src.growthPct}
                        onChange={(n) => updatePassive(src.id, { growthPct: n })}
                        currency={false}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted leading-relaxed">
                  {t(
                    "A rent raised slower than inflation quietly shrinks as a share of the bill. That is why each source carries its own increase rate rather than being assumed to keep up.",
                    "মূল্যস্ফীতির চেয়ে ধীরে বাড়া ভাড়া সময়ের সাথে খরচের তুলনায় ছোট হয়ে যায়। তাই প্রতিটি উৎসের নিজস্ব বৃদ্ধির হার আলাদাভাবে নেওয়া হয়েছে।"
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Allocation of the corpus */}
          {plan.allocation.length > 0 && (
            <div className="bg-card border border-line p-5 rounded-sm">
              <h3 className="font-serif font-semibold text-base text-green-deep mb-1">
                {t("How the corpus gets split once it arrives", "মূলধন জমা হলে তা যেভাবে ভাগ হবে")}
              </h3>
              <p className="text-xs text-muted mb-4">
                {t(
                  "Buffer and floor are carved out first, so the venture slice can only ever be funded from money that is genuinely spare.",
                  "আগে বাফার ও ভিত্তি আলাদা করা হয়, যাতে ব্যবসার অংশ কেবল সত্যিকারের উদ্বৃত্ত টাকা থেকেই আসে।"
                )}
              </p>

              <div className="space-y-3">
                {plan.allocation.map((slice) => (
                  <div
                    key={slice.role}
                    className={`border border-line border-l-4 ${ALLOCATION_ACCENT[slice.role]} bg-[#FCFBF8] p-3.5 rounded-sm`}
                  >
                    <div className="flex justify-between items-baseline gap-3 mb-1">
                      <span className="font-semibold text-xs text-green-deep">
                        {lang === "bn" ? slice.nameBn : slice.nameEn}
                      </span>
                      <span className="font-mono text-xs text-muted shrink-0">
                        {slice.pctOfCorpus}%
                      </span>
                    </div>
                    <div className="font-mono font-bold text-base text-green-deep mb-1.5">
                      {fmtTaka(slice.amount)}
                    </div>
                    <p className="text-[11.5px] text-[#555] leading-relaxed">
                      {lang === "bn" ? slice.purposeBn : slice.purposeEn}
                    </p>
                    <p className="text-[11px] text-muted leading-relaxed mt-1.5 pt-1.5 border-t border-line/60">
                      {lang === "bn" ? slice.riskBn : slice.riskEn}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-line space-y-3">
                <Slider
                  id="freedom-essential-share"
                  label={t(
                    "Share of spending that is essential",
                    "খরচের যত অংশ অপরিহার্য"
                  )}
                  value={essentialSharePct}
                  min={30}
                  max={100}
                  step={5}
                  suffix="%"
                  onChange={setEssentialSharePct}
                />
                <Slider
                  id="freedom-venture"
                  label={t(
                    "Of the corpus, how much would you risk on a business",
                    "মূলধনের কত অংশ ব্যবসায় ঝুঁকি নেবেন"
                  )}
                  value={ventureAppetitePct}
                  min={0}
                  max={30}
                  step={1}
                  suffix="%"
                  accent="accent-gold"
                  onChange={setVentureAppetitePct}
                  note={t(
                    "Capped at a fifth of the corpus however high you set this, and taken only from what is left after the income floor is fully funded.",
                    "আপনি যত বেশিই দিন, এটি মোট মূলধনের এক-পঞ্চমাংশে সীমিত থাকবে, এবং আয়ের ভিত্তি পুরোপুরি পূরণের পর যা থাকে কেবল তা থেকেই নেওয়া হবে।"
                  )}
                />
              </div>
            </div>
          )}

          {/* Roadmap */}
          {plan.roadmap.length > 0 && (
            <div className="bg-card border border-line p-5 rounded-sm">
              <h3 className="font-serif font-semibold text-sm text-green-deep mb-3">
                {t("Year-by-year roadmap", "বছরভিত্তিক রোডম্যাপ")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-line text-muted font-mono">
                    <tr>
                      <th className="py-2">{t("Age", "বয়স")}</th>
                      <th className="py-2 text-right text-green-deep">
                        {t("On plan", "পরিকল্পনা মতো")}
                      </th>
                      <th className="py-2 text-right">{t("At today's pace", "বর্তমান হারে")}</th>
                      <th className="py-2 text-right">{t("Monthly bill then", "তখনকার মাসিক খরচ")}</th>
                      <th className="py-2 text-right">{t("Done", "অগ্রগতি")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {plan.roadmap.map((row) => {
                      const isCoast = plan.coastAge !== null && row.age === plan.coastAge;
                      return (
                        <tr key={row.year} className={isCoast ? "bg-[#F7FBF8]" : "hover:bg-[#FAF9F5]"}>
                          <td className="py-2 font-mono font-medium">
                            {row.age}
                            {isCoast && (
                              <span className="ml-1.5 font-mono text-[9.5px] text-green border border-green/50 px-1 py-px align-middle">
                                {t("COAST", "কোস্ট")}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono font-semibold text-green-deep">
                            {fmtTaka(row.onTrackBalance)}
                          </td>
                          <td className="py-2 text-right font-mono text-muted">
                            {fmtTaka(row.currentPaceBalance)}
                          </td>
                          <td className="py-2 text-right font-mono text-muted">
                            {fmtTaka(row.monthlyExpenseThatYear)}
                          </td>
                          <td className="py-2 text-right font-mono">{row.pctOfFreedomNumber}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {plan.coastAge !== null && (
                <p className="text-[11px] text-muted mt-3 leading-relaxed">
                  {t(
                    `"Coast" is the year you could stop saving altogether: keeping up ${fmtTaka(currentMonthlySaving)} a month until age ${plan.coastAge}, what is invested by then compounds to the freedom number on its own by ${freedomAge}.`,
                    `"কোস্ট" হলো সেই বছর, যখন থেকে সঞ্চয় পুরোপুরি বন্ধ করলেও চলে: ${plan.coastAge} বছর বয়স পর্যন্ত মাসে ${fmtTaka(currentMonthlySaving)} চালিয়ে গেলে, ততদিনে বিনিয়োগ হওয়া টাকাই চক্রবৃদ্ধিতে ${freedomAge} বছর বয়সে লক্ষ্যে পৌঁছে যাবে।`
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column: the numbers */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">
          <div className="bg-green-deep text-paper p-5 rounded-sm border-t-4 border-gold shadow-sm">
            <span className="inline-block font-mono text-[10px] text-gold border border-gold/60 px-1.5 py-0.5 mb-2">
              {t("YOUR FREEDOM NUMBER", "আপনার স্বাধীনতার অঙ্ক")}
            </span>
            <div className="text-xs text-paper/80 mb-1">
              {t(
                `To stop at ${freedomAge} and be covered until ${planUntilAge}:`,
                `${freedomAge} বছরে থামতে এবং ${planUntilAge} বছর পর্যন্ত চলতে প্রয়োজন:`
              )}
            </div>
            <div className="font-mono font-bold text-2xl text-gold mb-2">
              {fmtTaka(plan.freedomNumber)}
            </div>
            <p className="text-[11.5px] text-paper/70 leading-relaxed border-t border-paper/20 pt-2">
              {t(
                `This corpus is drawn down and lands at zero at ${planUntilAge}, with every withdrawal raised ${inflationPct}% a year to keep its purchasing power.`,
                `এই মূলধন থেকে প্রতি বছর তোলা হবে এবং ${planUntilAge} বছর বয়সে এটি শূন্যে নামবে; ক্রয়ক্ষমতা ধরে রাখতে প্রতিটি উত্তোলন বছরে ${inflationPct}% বাড়ানো ধরা হয়েছে।`
              )}
            </p>
            {plan.requirement.perpetualCorpus !== null ? (
              <p className="text-[11.5px] text-paper/70 leading-relaxed mt-2 pt-2 border-t border-paper/20">
                {t("Never touching the principal instead:", "মূল টাকায় হাত না দিতে চাইলে:")}{" "}
                <strong className="font-mono text-paper">
                  {fmtTaka(plan.requirement.perpetualCorpus)}
                </strong>
              </p>
            ) : (
              <p className="text-[11.5px] text-paper/70 leading-relaxed mt-2 pt-2 border-t border-paper/20">
                {t(
                  `At ${postFreedomReturnPct}% return against ${inflationPct}% inflation, the real return is negative — no corpus is large enough to live off the interest alone, so it has to be drawn down.`,
                  `${inflationPct}% মূল্যস্ফীতির বিপরীতে ${postFreedomReturnPct}% মুনাফায় প্রকৃত আয় ঋণাত্মক — কেবল মুনাফায় চলার মতো যথেষ্ট বড় কোনো মূলধন নেই, তাই আসল থেকেই খরচ করতে হবে।`
                )}
              </p>
            )}
          </div>

          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3 pb-2 border-b border-line">
              {t(`Your monthly bill at ${freedomAge}`, `${freedomAge} বছর বয়সে আপনার মাসিক খরচ`)}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-muted">
                  {t("Living costs, inflated", "মূল্যস্ফীতির পর জীবনযাত্রার খরচ")}
                </span>
                <span className="font-mono font-semibold text-green-deep">
                  {fmtTaka(plan.requirement.monthlyExpense)}
                </span>
              </div>
              {plan.requirement.monthlyPassiveIncome > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-muted">{t("Less passive income", "বাদ প্যাসিভ আয়")}</span>
                  <span className="font-mono text-green">
                    −{fmtTaka(plan.requirement.monthlyPassiveIncome)}
                  </span>
                </div>
              )}
              {plan.requirement.monthlyLightWorkIncome > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-muted">{t("Less light work", "বাদ হালকা কাজের আয়")}</span>
                  <span className="font-mono text-green">
                    −{fmtTaka(plan.requirement.monthlyLightWorkIncome)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-line">
                <span className="font-semibold text-green-deep">
                  {t("The corpus must produce", "মূলধন থেকে আসতে হবে")}
                </span>
                <span className="font-mono font-bold text-base text-green-deep">
                  {fmtTaka(plan.requirement.monthlyNetNeed)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] pt-1">
                <span className="text-muted">
                  {t("Real return after inflation", "মূল্যস্ফীতির পর প্রকৃত মুনাফা")}
                </span>
                <span
                  className={`font-mono ${plan.requirement.realReturnPct < 0 ? "text-red" : "text-green"}`}
                >
                  {plan.requirement.realReturnPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3 pb-2 border-b border-line">
              {t("What it takes to get there", "সেখানে পৌঁছাতে যা লাগবে")}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-muted">
                  {t(
                    `Savings you have, grown ${plan.yearsToFreedom} years`,
                    `আপনার বর্তমান সঞ্চয়, ${plan.yearsToFreedom} বছর পর`
                  )}
                </span>
                <span className="font-mono text-green-deep">
                  {fmtTaka(plan.futureValueExistingCorpus)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted">{t("Still to be built", "এখনো গড়তে হবে")}</span>
                <span className="font-mono text-green-deep">{fmtTaka(plan.gap)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-line">
                <span className="font-semibold text-green-deep">
                  {t("Save every month", "প্রতি মাসে সঞ্চয়")}
                </span>
                <span className="font-mono font-bold text-lg text-green-deep">
                  {fmtTaka(plan.requiredMonthlySaving)}
                </span>
              </div>
            </div>

            <div
              className={`mt-4 -mx-5 -mb-5 px-5 py-4 border-t ${
                onTrack ? "bg-[#F7FBF8] border-green/40" : "bg-amber-bg border-amber-border/70"
              }`}
            >
              <div className="font-semibold text-[13px] text-green-deep mb-1">
                {onTrack
                  ? t("Your current pace gets you there", "আপনার বর্তমান সঞ্চয়ের হারে লক্ষ্যে পৌঁছাবেন")
                  : t("Your current pace falls short", "আপনার বর্তমান সঞ্চয়ের হারে ঘাটতি থাকবে")}
              </div>
              <p className="text-[11.5px] text-[#555] leading-relaxed">
                {onTrack
                  ? t(
                      `Saving ${fmtTaka(currentMonthlySaving)} a month lands you at ${fmtTaka(plan.currentPaceBalanceAtFreedom)} by ${freedomAge} — ${fmtTaka(plan.currentPaceSurplus)} more than the number needs.`,
                      `মাসে ${fmtTaka(currentMonthlySaving)} সঞ্চয়ে ${freedomAge} বছর বয়সে আপনার হবে ${fmtTaka(plan.currentPaceBalanceAtFreedom)} — প্রয়োজনের চেয়ে ${fmtTaka(plan.currentPaceSurplus)} বেশি।`
                    )
                  : t(
                      `Saving ${fmtTaka(currentMonthlySaving)} a month lands you at ${fmtTaka(plan.currentPaceBalanceAtFreedom)} by ${freedomAge}, which is ${fmtTaka(Math.abs(plan.currentPaceSurplus))} short. Closing it means ${fmtTaka(plan.requiredMonthlySaving)} a month instead.`,
                      `মাসে ${fmtTaka(currentMonthlySaving)} সঞ্চয়ে ${freedomAge} বছর বয়সে হবে ${fmtTaka(plan.currentPaceBalanceAtFreedom)}, অর্থাৎ ${fmtTaka(Math.abs(plan.currentPaceSurplus))} ঘাটতি। এটি পূরণ করতে মাসে ${fmtTaka(plan.requiredMonthlySaving)} সঞ্চয় করতে হবে।`
                    )}
              </p>
              {!onTrack && (
                <p className="text-[11.5px] text-[#555] leading-relaxed mt-2 pt-2 border-t border-line/60">
                  {plan.currentPaceFreedomAge !== null
                    ? t(
                        `Without changing what you save, the same pace reaches freedom at ${plan.currentPaceFreedomAge} — a shorter freedom needs a smaller corpus, even though the monthly bill by then is larger.`,
                        `সঞ্চয়ের হার না বাড়ালে একই গতিতে ${plan.currentPaceFreedomAge} বছর বয়সে স্বাধীনতা আসবে — কম সময়ের স্বাধীনতায় কম মূলধন লাগে, যদিও তখন মাসিক খরচ আরও বেশি হবে।`
                      )
                    : t(
                        "At this pace the corpus never catches the bill, because inflation raises the target faster than the saving grows. The lever is the monthly amount, the freedom age, or the lifestyle — not the return.",
                        "এই হারে মূলধন কখনোই খরচের সাথে পেরে উঠবে না, কারণ মূল্যস্ফীতি লক্ষ্যকে সঞ্চয়ের চেয়ে দ্রুত বাড়ায়। পরিবর্তন আনতে হবে মাসিক সঞ্চয়ে, লক্ষ্য বয়সে, অথবা জীবনযাত্রায় — মুনাফার হারে নয়।"
                      )}
                </p>
              )}
            </div>
          </div>

          <div className="bg-card border border-line p-4 rounded-sm text-[11px] text-muted leading-relaxed">
            {t(
              "Every figure here is arithmetic on what you entered. Returns are assumptions you set, not forecasts, and the split above describes roles a corpus plays — never a bank, fund or product. This is not financial advice.",
              "এখানকার প্রতিটি সংখ্যা আপনার দেওয়া তথ্যের হিসাব। মুনাফার হার আপনার নিজের অনুমান, কোনো পূর্বাভাস নয়; আর উপরের ভাগ মূলধনের ভূমিকা বোঝায় — কোনো ব্যাংক, ফান্ড বা পণ্য নয়। এটি আর্থিক পরামর্শ নয়।"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
