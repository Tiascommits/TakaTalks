"use client";

import { useMemo, useState } from "react";
import { compareInstruments } from "@/lib/instruments/instruments";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

export function InstrumentMatrix() {
  const { t, lang } = useLanguage();

  const [amount, setAmount] = useState<number>(500_000);
  const [tenureYears, setTenureYears] = useState<number>(3);
  const [hasPSR, setHasPSR] = useState<boolean>(true);
  const [inflationPct, setInflationPct] = useState<number>(8.5);

  const results = useMemo(
    () =>
      compareInstruments({
        amount,
        tenureYears,
        hasPSR,
        inflationPct,
      }),
    [amount, tenureYears, hasPSR, inflationPct]
  );

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Simulation Controls Card */}
      <div className="bg-card border border-line p-5 rounded-sm mb-6 shadow-xs">
        <h2 className="font-serif font-semibold text-base text-green-deep mb-3">
          {t("Simulate Real After-Tax Returns", "আসল ও ট্যাক্স-পরবর্তী মুনাফা সিমুলেশন")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <NumberField
            label={t("Investment Lump Sum (৳)", "বিনিয়োগের পরিমাণ (৳)")}
            value={amount}
            onChange={setAmount}
          />

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label htmlFor="inst-tenure" className="text-[#555] font-medium">
                {t("Tenure Horizon", "বিনিয়োগের মেয়াদ")}
              </label>
              <span className="font-mono font-semibold text-green-deep text-xs">
                {tenureYears} {t("Years", "বছর")}
              </span>
            </div>
            <select
              id="inst-tenure"
              value={tenureYears}
              onChange={(e) => setTenureYears(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              <option value={1}>1 {t("Year", "বছর")}</option>
              <option value={2}>2 {t("Years", "বছর")}</option>
              <option value={3}>3 {t("Years", "বছর")}</option>
              <option value={5}>5 {t("Years", "বছর")}</option>
              <option value={10}>10 {t("Years", "বছর")}</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label htmlFor="inst-inflation" className="text-[#555] font-medium">
                {t("Inflation Expectation", "বার্ষিক মূল্যস্ফীতি")}
              </label>
              <span className="font-mono font-semibold text-gold text-xs">
                {inflationPct}%
              </span>
            </div>
            <input
              id="inst-inflation"
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

      {/* Comparison Grid */}
      <div className="space-y-4">
        {results.map((item, idx) => {
          const isTop = idx === 0;

          return (
            <div
              key={item.id}
              className={`bg-card border rounded-sm p-4.5 transition-all shadow-xs ${
                item.exceedsCap
                  ? "border-red/40 bg-[#FFFDFD]"
                  : isTop
                  ? "border-green bg-[#FBFCFB]"
                  : "border-line"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-line/60">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-xs bg-muted/10 text-green-deep">
                      #{idx + 1}
                    </span>
                    <h3 className="font-serif font-bold text-base text-green-deep">
                      {lang === "bn" ? item.nameBn : item.nameEn}
                    </h3>

                    {item.sovereignGuaranteed && (
                      <span className="text-[10px] font-mono font-semibold bg-[#EAF5EC] text-green border border-green/30 px-1.5 py-0.5 rounded-xs">
                        {t("SOVEREIGN GUARANTEE", "সরকারি শতভাগ নিশ্চয়তা")}
                      </span>
                    )}

                    {item.depositInsuranceCovered && (
                      <span className="text-[10px] font-mono text-muted border border-line px-1.5 py-0.5 rounded-xs">
                        {t("INSURED UP TO ৳2 LAKH", "২ লাখ টাকা পর্যন্ত বিমাকৃত")}
                      </span>
                    )}
                  </div>

                  {item.capNotice && (
                    <div className="text-xs text-red font-medium mt-1">
                      ⚠️ {item.capNotice}
                    </div>
                  )}
                </div>

                {/* Rates Badge */}
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <span className="text-[10.5px] text-muted block">{t("Headline Rate", "ঘোষিত হার")}</span>
                    <span className="font-mono text-sm line-through text-muted">
                      {item.nominalGrossRatePct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted block">{t("After-Tax Net Yield", "ট্যাক্স-পরবর্তী নেট")}</span>
                    <span className="font-mono font-bold text-lg text-green">
                      {item.netRatePct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Numbers Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-line/60">
                <div>
                  <span className="text-muted block text-[10.5px]">{t("Annual Net Profit", "বার্ষিক নেট লাভ")}</span>
                  <span className="font-mono font-semibold text-green-deep text-sm">
                    {fmtTaka(item.annualNetProfit)}
                  </span>
                  <span className="text-[10px] text-muted block">
                    {t(`(TDS: -${fmtTaka(item.annualTDSTax)} @ ${item.tdsPct}%)`, `(কর কর্তন: -${fmtTaka(item.annualTDSTax)})`)}
                  </span>
                </div>

                <div>
                  <span className="text-muted block text-[10.5px]">
                    {t(`${tenureYears}-Yr Maturity Value`, `${tenureYears} বছর পর মূলধন+মুনাফা`)}
                  </span>
                  <span className="font-mono font-semibold text-green-deep text-sm">
                    {fmtTaka(item.totalMaturityValue)}
                  </span>
                </div>

                <div>
                  <span className="text-muted block text-[10.5px]">
                    {t("Real Purchasing Power", "মূল্যস্ফীতি বাদে ক্রয়ক্ষমতা")}
                  </span>
                  <span className="font-mono font-semibold text-foreground text-sm">
                    {fmtTaka(item.realPurchasingPowerAtMaturity)}
                  </span>
                </div>

                <div>
                  <span className="text-muted block text-[10.5px]">
                    {t("Real Return (Inflation Adjusted)", "প্রকৃত লাভ (মূল্যস্ফীতি বাদ)")}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      item.realYieldPct >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    {item.realYieldPct >= 0 ? `+${item.realYieldPct}%` : `${item.realYieldPct}%`}
                  </span>
                </div>
              </div>

              {/* Details & Eligibility */}
              <div className="pt-2.5 flex flex-col sm:flex-row justify-between gap-2 text-[11.5px] text-[#555]">
                <div>
                  <strong className="text-green-deep font-medium">{t("Eligibility: ", "যোগ্যতা: ")}</strong>
                  {lang === "bn" ? item.eligibilityBn : item.eligibilityEn}
                </div>
                <div className="shrink-0 text-muted">
                  <strong className="text-green-deep font-medium">{t("Liquidity: ", "তারল্য: ")}</strong>
                  {lang === "bn" ? item.liquidityBn : item.liquidityEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statutory Disclaimer */}
      <div className="mt-6 bg-[#FAF9F5] border border-line p-4 rounded-sm text-xs text-muted leading-relaxed">
        {t(
          "Statutory Disclaimer: Sanchayapatra slab rules and limits follow National Savings Directorate gazettes. Bank deposit insurance is governed by the Bank Deposit Protection Act 2026 (BDT 2,00,000 per depositor per bank in the event of formal liquidation). This matrix presents mathematical after-tax yields and does not constitute investment advice or endorsement.",
          "আইনগত সতর্কতা: সঞ্চয়পত্রের নিয়মাবলী জাতীয় সঞ্চয় অধিদপ্তরের প্রজ্ঞাপন অনুযায়ী প্রণীত। ব্যাংক আমানত সুরক্ষা আইন ২০২৬ অনুযায়ী আনুষ্ঠানিক লিকুইডেশনের ক্ষেত্রে প্রতি ব্যাংকে আমানতকারী প্রতি সর্বোচ্চ ২,০০,০০০ টাকা বিমাকৃত। এই তুলনামূলক তালিকা শুধুমাত্র গাণিতিক ট্যাক্স-পরবর্তী মুনাফা প্রদর্শন করে, কোনো নির্দিষ্ট প্রতিষ্ঠানে বিনিয়োগের পরামর্শ প্রদান করে না।"
        )}
      </div>
    </div>
  );
}
