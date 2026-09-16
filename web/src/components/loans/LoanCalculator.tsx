"use client";

import { useMemo, useState } from "react";
import {
  calculateLoan,
  LOAN_PRESETS,
  type LoanPreset,
} from "@/lib/loans/loans";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

export function LoanCalculator() {
  const { t, lang } = useLanguage();

  const [principal, setPrincipal] = useState<number>(5_000_000);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(10.5);
  const [processingFeePct, setProcessingFeePct] = useState<number>(0.5);

  const [enablePrepayment, setEnablePrepayment] = useState<boolean>(true);
  const [extraMonthly, setExtraMonthly] = useState<number>(5_000);
  const [annualLumpSum, setAnnualLumpSum] = useState<number>(50_000);

  const [scheduleView, setScheduleView] = useState<"yearly" | "monthly">("yearly");

  function handlePreset(preset: LoanPreset) {
    setPrincipal(preset.principal);
    setTenureYears(preset.tenureYears);
    setInterestRate(preset.annualInterestRatePct);
  }

  const result = useMemo(
    () =>
      calculateLoan({
        principal,
        tenureYears,
        annualInterestRatePct: interestRate,
        processingFeePct,
        extraMonthlyPayment: enablePrepayment ? extraMonthly : 0,
        annualLumpSumPrepayment: enablePrepayment ? annualLumpSum : 0,
      }),
    [principal, tenureYears, interestRate, processingFeePct, enablePrepayment, extraMonthly, annualLumpSum]
  );

  const interestPctOfPrincipal = principal > 0 ? (result.actualTotalInterestPaid / principal) * 100 : 0;
  const savedYears = Math.floor(result.monthsSaved / 12);
  const savedMonthsRemainder = result.monthsSaved % 12;

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Preset Pill Bar */}
      <div className="mb-6">
        <label className="block text-xs font-mono text-muted uppercase mb-2 font-semibold">
          {t("Quick Loan Presets:", "জনপ্রিয় লোন প্রিসেট:")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LOAN_PRESETS.map((p) => {
            const isSelected =
              principal === p.principal &&
              tenureYears === p.tenureYears &&
              interestRate === p.annualInterestRatePct;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p)}
                className={`p-2.5 text-left border rounded-xs transition-all text-xs ${
                  isSelected
                    ? "bg-green-deep text-paper border-green-deep shadow-xs"
                    : "bg-card border-line hover:border-gold text-foreground"
                }`}
              >
                <span className="font-semibold block">{lang === "bn" ? p.nameBn : p.nameEn}</span>
                <span className={`text-[11px] block mt-0.5 ${isSelected ? "text-paper/80" : "text-muted"}`}>
                  {fmtTaka(p.principal)} • {p.tenureYears} {t("yrs", "বছর")} @ {p.annualInterestRatePct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-start">
        {/* Left Form: Parameters & Prepayment */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3.5">
              {t("Loan Details", "ঋণের বিবরণ")}
            </h3>

            <div className="space-y-4">
              <NumberField
                label={t("Loan Amount / Principal (৳)", "ঋণের পরিমাণ / মূলধন (৳)")}
                value={principal}
                onChange={setPrincipal}
              />

              {/* Tenure slider & input */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="tenure-range" className="text-[#555] font-medium">
                    {t("Tenure (Years)", "ঋণের মেয়াদ (বছর)")}
                  </label>
                  <span className="font-mono font-bold text-green-deep">
                    {tenureYears} {t("Years", "বছর")} ({tenureYears * 12} {t("months", "মাস")})
                  </span>
                </div>
                <input
                  id="tenure-range"
                  type="range"
                  min={0.5}
                  max={30}
                  step={0.5}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(parseFloat(e.target.value))}
                  className="w-full accent-green cursor-pointer"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="interest-rate-range" className="text-[#555] font-medium">
                    {t("Annual Interest Rate (%)", "বার্ষিক সুদের হার (%)")}
                  </label>
                  <span className="font-mono font-bold text-green-deep">
                    {interestRate.toFixed(1)}%
                  </span>
                </div>
                <input
                  id="interest-rate-range"
                  type="range"
                  min={1}
                  max={20}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full accent-green cursor-pointer"
                />
              </div>

              {/* Bank Processing Fee */}
              <div className="pt-2 border-t border-line/60">
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="processing-fee-range" className="text-[#555] font-medium">
                    {t("Bank Processing Fee (%)", "ব্যাংক প্রসেসিং ফি (%)")}
                  </label>
                  <span className="font-mono font-semibold text-muted text-xs">
                    {processingFeePct}% (+15% NBR VAT)
                  </span>
                </div>
                <input
                  id="processing-fee-range"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={processingFeePct}
                  onChange={(e) => setProcessingFeePct(parseFloat(e.target.value))}
                  className="w-full accent-green cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Prepayment Accelerator Box */}
          <div className="bg-[#FAF9F5] border border-gold/50 p-5 rounded-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h3 className="font-serif font-semibold text-sm text-green-deep">
                  {t("Prepayment Accelerator (Smart Saver)", "প্রি-পেমেন্ট অ্যাক্সিলারেটর (স্মার্ট সেভার)")}
                </h3>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePrepayment}
                  onChange={(e) => setEnablePrepayment(e.target.checked)}
                  className="w-auto"
                />
                <span className="font-semibold text-foreground">{t("Active", "সক্রিয়")}</span>
              </label>
            </div>

            <p className="text-xs text-[#555] mb-4 leading-relaxed">
              {t(
                "Paying even a tiny extra amount directly cuts down the principal balance, eliminating years of compounded bank interest.",
                "প্রতি মাসে কিছুটা অতিরিক্ত পরিশোধ বা বাৎসরিক বোনাস থেকে এককালীন প্রি-পেমেন্ট করলে সুদের চাপ বহু বছর আগেই দূর হয়।"
              )}
            </p>

            {enablePrepayment && (
              <div className="space-y-3.5">
                <NumberField
                  label={t("Extra Payment Each Month (৳)", "প্রতি মাসে অতিরিক্ত কিস্তি (৳)")}
                  value={extraMonthly}
                  onChange={setExtraMonthly}
                />

                <NumberField
                  label={t("Annual Lump Sum Prepayment / Bonus (৳)", "বাৎসরিক এককালীন প্রি-পেমেন্ট / বোনাস (৳)")}
                  value={annualLumpSum}
                  onChange={setAnnualLumpSum}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Results & Savings */}
        <div className="flex flex-col gap-5">
          {/* Monthly EMI & Big Impact Card */}
          <div className="bg-card border-2 border-green p-5 rounded-sm shadow-xs">
            <span className="text-[10.5px] font-mono text-muted uppercase tracking-wider block mb-1">
              {t("Standard Monthly Commitment", "নিয়মিত মাসিক কিস্তি")}
            </span>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs text-[#555]">{t("Monthly EMI:", "মাসিক ইএমআই:")}</span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-green-deep">
                {fmtTaka(result.standardMonthlyEMI)}
              </span>
            </div>

            {/* If Prepayment active, show Accelerated Banner */}
            {result.hasPrepayment && (
              <div className="bg-[#EFF8F1] border border-green/40 p-3.5 rounded-xs mt-3 mb-2">
                <div className="flex items-center gap-1.5 text-green-deep font-semibold text-xs mb-1">
                  <span>🎉</span>
                  <span>{t("Massive Interest & Time Savings!", "বিশাল সুদ ও সময়ের সাশ্রয়!")}</span>
                </div>
                <div className="text-xs text-[#333] space-y-1">
                  <p>
                    {t("Interest Saved:", "মোট সুদ সাশ্রয়:")}{" "}
                    <strong className="text-green font-mono text-sm">{fmtTaka(result.interestSaved)}</strong>
                  </p>
                  <p>
                    {t("Time Saved:", "সময় সাশ্রয়:")}{" "}
                    <strong className="text-green-deep font-mono">
                      {savedYears > 0 ? `${savedYears} ${t("years", "বছর")} ` : ""}
                      {savedMonthsRemainder > 0 ? `${savedMonthsRemainder} ${t("months", "মাস")}` : ""}
                    </strong>{" "}
                    ({t("Debt-free in", "ঋণমুক্ত হবেন মাত্র")}{" "}
                    <strong className="font-mono">
                      {Math.ceil(result.actualMonthsToPayoff / 12)} {t("years", "বছরে")}
                    </strong>
                    )
                  </p>
                </div>
              </div>
            )}

            {/* Total Cost Breakdown Bar */}
            <div className="mt-4 pt-3 border-t border-line text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">{t("Total Principal:", "মূল ঋণ:")}</span>
                <span className="font-mono font-medium">{fmtTaka(result.principal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("Total Interest Paid:", "মোট পরিশোধিত সুদ:")}</span>
                <span className="font-mono font-semibold text-[#B91C1C]">
                  {fmtTaka(result.actualTotalInterestPaid)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-1.5 font-semibold">
                <span>{t("Total Amount Paid:", "সর্বমোট পরিশোধ:")}</span>
                <span className="font-mono text-green-deep text-sm">
                  {fmtTaka(result.actualTotalPayment)}
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-3">
              <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-deep h-full"
                  style={{ width: `${(result.principal / (result.actualTotalPayment || 1)) * 100}%` }}
                  title="Principal"
                />
                <div
                  className="bg-[#EF4444] h-full"
                  style={{
                    width: `${(result.actualTotalInterestPaid / (result.actualTotalPayment || 1)) * 100}%`,
                  }}
                  title="Interest"
                />
              </div>
              <div className="flex justify-between text-[10.5px] text-muted font-mono mt-1">
                <span>{t("Principal", "মূলধন")} ({Math.round((result.principal / (result.actualTotalPayment || 1)) * 100)}%)</span>
                <span>{t("Interest", "সুদ")} ({Math.round((result.actualTotalInterestPaid / (result.actualTotalPayment || 1)) * 100)}%)</span>
              </div>
            </div>
          </div>

          {/* Bangladesh Statutory Charges Card */}
          <div className="bg-card border border-line p-4.5 rounded-sm">
            <h4 className="font-serif font-semibold text-xs text-green-deep mb-2">
              {t("Bangladesh Statutory Upfront Costs", "বাংলাদেশে ঋণ গ্রহণের প্রাথমিক আইনি খরচ")}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">{t("Bank Processing Fee (0.5%):", "ব্যাংক প্রসেসিং ফি:")}</span>
                <span className="font-mono">{fmtTaka(result.processingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("15% NBR VAT on fee:", "ফি এর উপর ১৫% মূসক (VAT):")}</span>
                <span className="font-mono">{fmtTaka(result.processingFeeVAT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("NBR Excise Duty (Loan account):", "এনবিআর আবগারি শুল্ক (Excise Duty):")}</span>
                <span className="font-mono">{fmtTaka(result.estimatedExciseDuty)}</span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-1.5 font-semibold text-green-deep">
                <span>{t("Estimated Upfront Charges:", "আনুমানিক প্রারম্ভিক খরচ:")}</span>
                <span className="font-mono">{fmtTaka(result.totalUpfrontCharges)}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2.5 leading-relaxed">
              {t(
                "Mortgage registration stamp duty (0.1%) and CIB report verification fee (৳100 - ৳500) may also be charged at actuals by the lender.",
                "বন্ধকী দলিলের স্ট্যাম্প ডিউটি ও সিআইবি রিপোর্ট ফি ব্যাংক নিজস্ব নীতিমালা অনুযায়ী অতিরিক্ত হিসেবে চার্জ করতে পারে।"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <div className="mt-8 bg-card border border-line p-5 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif font-semibold text-base text-green-deep">
              {t("Amortization Schedule", "ঋণ পরিশোধের সময়সূচি")}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {t(
                "Month-by-month or year-by-year principal reduction breakdown.",
                "বছরভিত্তিক বা মাসভিত্তিক মূলধন ও সুদ পরিশোধের বিশদ হিসাব।"
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 border border-line rounded-xs p-0.5 bg-[#FAF9F5]">
            <button
              type="button"
              onClick={() => setScheduleView("yearly")}
              className={`px-3 py-1 text-xs font-mono transition-colors rounded-xs ${
                scheduleView === "yearly"
                  ? "bg-green-deep text-paper font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("Yearly View", "বাৎসরিক")}
            </button>
            <button
              type="button"
              onClick={() => setScheduleView("monthly")}
              className={`px-3 py-1 text-xs font-mono transition-colors rounded-xs ${
                scheduleView === "monthly"
                  ? "bg-green-deep text-paper font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("Monthly View", "মাসিক")}
            </button>
          </div>
        </div>

        <p className="sm:hidden text-[11px] text-muted mb-1.5">
          {t("← Swipe to see total paid & remaining balance →", "← মোট পরিশোধ ও অবশিষ্ট ঋণ দেখতে স্ক্রল করো →")}
        </p>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-[#FAF9F5] z-10">
              <tr className="border-b-2 border-green text-green-deep">
                <th className="py-2 px-2 text-left font-semibold">
                  {scheduleView === "yearly" ? t("Year", "বছর") : t("Month", "মাস")}
                </th>
                <th className="py-2 px-2 text-right font-semibold">{t("Principal Paid", "মূল পরিশোধ")}</th>
                <th className="py-2 px-2 text-right font-semibold">{t("Interest Paid", "সুদ পরিশোধ")}</th>
                {enablePrepayment && (
                  <th className="py-2 px-2 text-right font-semibold text-green">{t("Extra Prepaid", "অতিরিক্ত")}</th>
                )}
                <th className="py-2 px-2 text-right font-semibold">{t("Total Paid", "মোট পরিশোধ")}</th>
                <th className="py-2 px-2 text-right font-semibold">{t("Ending Balance", "অবশিষ্ট ঋণ")}</th>
              </tr>
            </thead>
            <tbody>
              {scheduleView === "yearly"
                ? result.yearlySchedule.map((y) => (
                    <tr key={y.year} className="border-b border-line hover:bg-[#FAF9F5]">
                      <td className="py-2 px-2 font-medium">{t(`Year ${y.year}`, `বছর ${y.year}`)}</td>
                      <td className="py-2 px-2 text-right font-mono">{fmtTaka(Math.round(y.principalPaid))}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#B91C1C]">{fmtTaka(Math.round(y.interestPaid))}</td>
                      {enablePrepayment && (
                        <td className="py-2 px-2 text-right font-mono text-green font-medium">
                          {y.extraPrepaid > 0 ? fmtTaka(Math.round(y.extraPrepaid)) : "—"}
                        </td>
                      )}
                      <td className="py-2 px-2 text-right font-mono font-medium">{fmtTaka(Math.round(y.totalPaid))}</td>
                      <td className="py-2 px-2 text-right font-mono font-semibold text-green-deep">
                        {fmtTaka(Math.round(y.endingBalance))}
                      </td>
                    </tr>
                  ))
                : result.monthlySchedule.slice(0, 120).map((m) => (
                    <tr key={m.month} className="border-b border-line hover:bg-[#FAF9F5]">
                      <td className="py-2 px-2 font-medium">
                        {t(`M${m.month} (Yr ${m.year})`, `মাস ${m.month} (বছর ${m.year})`)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{fmtTaka(Math.round(m.principalPayment))}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#B91C1C]">{fmtTaka(Math.round(m.interestPayment))}</td>
                      {enablePrepayment && (
                        <td className="py-2 px-2 text-right font-mono text-green font-medium">
                          {m.extraPrepayment > 0 ? fmtTaka(Math.round(m.extraPrepayment)) : "—"}
                        </td>
                      )}
                      <td className="py-2 px-2 text-right font-mono font-medium">{fmtTaka(Math.round(m.totalPayment))}</td>
                      <td className="py-2 px-2 text-right font-mono font-semibold text-green-deep">
                        {fmtTaka(Math.round(m.closingBalance))}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {scheduleView === "monthly" && result.monthlySchedule.length > 120 && (
            <p className="text-center text-[11px] text-muted py-2">
              {t(
                `Showing first 120 months of ${result.monthlySchedule.length} months. Switch to Yearly View for complete life of loan.`,
                `প্রথম ১২০ মাসের তালিকা প্রদর্শিত। পুরো মেয়াদের জন্য বাৎসরিক ভিউ দেখুন।`
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
