"use client";

import { useMemo, useState } from "react";
import {
  calculateFreelanceEarnings,
  DEFAULT_EXCHANGE_RATES,
  ITES_CATEGORIES,
  type CurrencyCode,
} from "@/lib/freelance/freelance";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  BDT: "৳",
};

export function FreelanceCalculator() {
  const { t, lang } = useLanguage();

  const [foreignAmount, setForeignAmount] = useState<number>(2_500);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [categoryId, setCategoryId] = useState<string>("software_dev");
  const [hasBankingChannelFIRC, setHasBankingChannelFIRC] = useState<boolean>(true);
  const [cashIncentivePct, setCashIncentivePct] = useState<number>(2.5);
  const [customRate, setCustomRate] = useState<number>(DEFAULT_EXCHANGE_RATES.USD);
  const [editRate, setEditRate] = useState<boolean>(false);

  function handleCurrencyChange(c: CurrencyCode) {
    setCurrency(c);
    setCustomRate(DEFAULT_EXCHANGE_RATES[c]);
  }

  const result = useMemo(
    () =>
      calculateFreelanceEarnings({
        foreignAmount,
        currency,
        customExchangeRate: customRate,
        categoryId,
        hasBankingChannelFIRC,
        cashIncentivePct,
      }),
    [foreignAmount, currency, customRate, categoryId, hasBankingChannelFIRC, cashIncentivePct]
  );

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Top Banner */}
      <div className="bg-[#FBFAF6] border border-line p-4.5 rounded-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] text-gold uppercase tracking-wider font-semibold">
            {t("FREELANCE & ITES REMITTANCE RADAR", "ফ্রিল্যান্স ও আইটিইএস রেমিট্যান্স রাডার")}
          </span>
          <h2 className="font-serif font-semibold text-lg text-green-deep">
            {result.isITESExempt ? (
              <>
                {t("100% Tax-Exempt Export Income — Net In-Hand:", "১০০% করমুক্ত আইটিইএস রেমিট্যান্স — ব্যাংকে জমা:")}{" "}
                <span className="font-mono text-green font-bold">
                  {fmtTaka(result.netInHandBDT)}
                </span>
              </>
            ) : (
              <>
                {t("General Slab Tax Applies — Net In-Hand:", "সাধারণ স্ল্যাব কর প্রযোজ্য — নীট প্রাপ্তি:")}{" "}
                <span className="font-mono text-green-deep font-bold">
                  {fmtTaka(result.netInHandBDT)}
                </span>
              </>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t(
              "Foreign remittance brought through legal banking channels for IT/ITES services enjoys tax exemption and government cash incentives.",
              "বৈধ ব্যাংকিং চ্যানেলে আনা আইটি/আইটিইএস রেমিট্যান্সের উপর সরকার নির্ধারিত কর অব্যাহতি ও প্রণোদনা সুবিধা প্রযোজ্য।"
            )}
          </p>
        </div>

        {result.isITESExempt && (
          <div className="shrink-0 bg-[#EAF5EC] border border-green/40 px-3 py-1.5 rounded-xs text-xs font-mono font-semibold text-green">
            ✓ 0% {t("INCOME TAX (EXEMPT)", "আয়কর (অব্যাহতিপ্রাপ্ত)")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-start">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
              {t("Remittance & Service Details", "রেমিট্যান্স ও সেবার তথ্য")}
            </h3>

            <div className="space-y-4">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs text-[#555] mb-1 font-medium">
                  {t("Earning Currency", "উপার্জনের মুদ্রা")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["USD", "EUR", "GBP", "BDT"] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCurrencyChange(c)}
                      className={`py-2 text-xs font-mono font-semibold border rounded-xs transition-all ${
                        currency === c
                          ? "bg-green-deep text-paper border-green-deep"
                          : "bg-[#FCFBF8] border-line hover:border-gold text-foreground"
                      }`}
                    >
                      {c} ({CURRENCY_SYMBOLS[c]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Foreign Amount */}
              <div>
                <label className="block text-xs text-[#555] mb-1 font-medium">
                  {t(
                    `Inward Foreign Amount (${CURRENCY_SYMBOLS[currency]})`,
                    `প্রাপ্ত বৈদেশিক মুদ্রা (${CURRENCY_SYMBOLS[currency]})`
                  )}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted font-mono">
                    {CURRENCY_SYMBOLS[currency]}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={foreignAmount || ""}
                    onChange={(e) => setForeignAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 border border-line bg-[#FCFBF8] text-sm font-mono focus:outline-none focus:border-green focus:ring-2 focus:ring-green/30"
                  />
                </div>
              </div>

              {/* Exchange Rate Bar */}
              <div className="bg-[#FAF9F5] border border-line/80 p-3 rounded-xs flex justify-between items-center text-xs">
                <div>
                  <span className="text-muted block text-[10.5px]">
                    {t("Conversion Rate", "বিনিময় হার")}
                  </span>
                  <span className="font-mono font-semibold text-green-deep">
                    1 {currency} = {customRate.toFixed(2)} BDT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditRate((v) => !v)}
                  className="text-xs text-green font-medium hover:underline"
                >
                  {editRate ? t("Done", "সম্পন্ন") : t("Edit Rate", "রেট পরিবর্তন")}
                </button>
              </div>

              {editRate && (
                <div className="pt-1">
                  <NumberField
                    label={t("Custom BDT Exchange Rate", "কাস্টম বিনিময় হার (৳)")}
                    value={customRate}
                    onChange={setCustomRate}
                  />
                </div>
              )}

              {/* Service Category */}
              <div>
                <label className="block text-xs text-[#555] mb-1 font-medium">
                  {t("Service Category (ITES Classification)", "সেবার ধরন (আইটিইএস খাত)")}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
                >
                  {ITES_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {lang === "bn" ? cat.nameBn : cat.nameEn}{" "}
                      {cat.isTaxExemptITES ? t("(Tax-Exempt ITES)", "(করমুক্ত আইটিইএস)") : t("(Taxable)", "(করযোগ্য)")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Banking Channel & FIRC Checkbox */}
              <div className="pt-2 border-t border-line/60 space-y-3">
                <label className="flex items-start gap-2.5 text-xs text-[#444] cursor-pointer bg-[#F9FAF9] border border-line p-3 rounded-xs">
                  <input
                    type="checkbox"
                    checked={hasBankingChannelFIRC}
                    onChange={(e) => setHasBankingChannelFIRC(e.target.checked)}
                    className="w-auto mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-green-deep block">
                      {t(
                        "Remitted via Official Banking Channel with FIRC / Form C",
                        "বৈধ ব্যাংকিং চ্যানেলে রেমিট্যান্স ও FIRC প্রত্যয়ন আছে"
                      )}
                    </span>
                    <span className="text-[11px] text-muted block mt-0.5">
                      {t(
                        "Received directly into a Bangladeshi bank account, Payoneer/Wise to bank transfer, or Bkash/Nagad remittance gateway.",
                        "সরাসরি ব্যাংকে অথবা পেওনিয়ার/ওয়াইজ হতে ব্যাংকিং চ্যানেলে স্থানান্তর।"
                      )}
                    </span>
                  </div>
                </label>

                {hasBankingChannelFIRC && (
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label htmlFor="cash-incentive" className="text-[#555] font-medium">
                        {t("Government Inward Cash Incentive", "সরকারি রেমিট্যান্স প্রণোদনা")}
                      </label>
                      <span className="font-mono font-semibold text-green text-xs">
                        {cashIncentivePct}% (+{fmtTaka(result.cashIncentiveBDT)})
                      </span>
                    </div>
                    <input
                      id="cash-incentive"
                      type="range"
                      min={0}
                      max={5}
                      step={0.5}
                      value={cashIncentivePct}
                      onChange={(e) => setCashIncentivePct(parseFloat(e.target.value))}
                      className="w-full accent-green cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-sm text-green-deep mb-3">
              {t("White Money Compliance Checklist", "বৈধ সাদা টাকা হিসেবে প্রদর্শনের চেকলিস্ট")}
            </h3>
            <div className="space-y-3">
              {result.complianceChecklist.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="text-green font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-foreground block">
                      {lang === "bn" ? c.itemBn : c.itemEn}
                    </span>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      {lang === "bn" ? c.noteBn : c.noteEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Earnings & Tax Breakdown */}
        <div className="flex flex-col gap-4 sticky top-4">
          <div className="bg-green-deep text-paper p-5 rounded-sm border-t-4 border-gold shadow-sm">
            <span className="inline-block font-mono text-[10.5px] text-gold border border-gold/60 px-1.5 py-0.5 mb-2">
              {t("TOTAL NET IN-HAND IN BANGLADESH", "ব্যাংকে নীট প্রাপ্তি (টাকায়)")}
            </span>
            <div className="text-xs text-paper/80 mb-1">
              {t("For", "উপার্জিত")} {CURRENCY_SYMBOLS[currency]}
              {result.foreignAmount.toLocaleString()} {t("earnings, you receive:", "এর বিপরীতে ব্যাংকে জমা:")}
            </div>
            <div className="font-mono font-bold text-3xl text-gold mb-1">
              {fmtTaka(result.netInHandBDT)}
            </div>
            <div className="text-xs text-paper/70 font-mono">
              {t("Effective Retention: ", "কার্যকর প্রাপ্তির হার: ")}
              <strong className="text-paper">{result.effectiveRetentionPct}%</strong>{" "}
              {result.cashIncentiveBDT > 0 && t("(boosted by cash incentive)", "(প্রণোদনা সহ)")}
            </div>
          </div>

          {/* Detailed Financial Breakdown Card */}
          <div className="bg-card border border-line p-5 rounded-sm space-y-3">
            <h3 className="font-serif font-semibold text-base text-green-deep pb-2 border-b border-line">
              {t("Financial Breakdown", "আয় ও করের বিস্তারিত বিবরণ")}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-line/40">
                <span className="text-muted">{t("Gross Foreign Earnings:", "মোট বৈদেশিক উপার্জন:")}</span>
                <span className="font-mono font-semibold">
                  {CURRENCY_SYMBOLS[currency]}
                  {result.foreignAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-line/40">
                <span className="text-muted">{t("Conversion at Bank Rate:", "টাকায় রূপান্তর:")}</span>
                <span className="font-mono font-semibold">{fmtTaka(result.grossBDT)}</span>
              </div>

              {result.cashIncentiveBDT > 0 && (
                <div className="flex justify-between py-1 border-b border-line/40 text-green">
                  <span>{t(`Govt Cash Incentive (+${result.cashIncentivePct}%):`, `সরকারি প্রণোদনা (+${result.cashIncentivePct}%):`)}</span>
                  <span className="font-mono font-semibold">+{fmtTaka(result.cashIncentiveBDT)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-line/40">
                <span className="text-muted">{t("Tax Status:", "কর স্ট্যাটাস:")}</span>
                <span className={`font-semibold ${result.isITESExempt ? "text-green" : "text-gold"}`}>
                  {result.isITESExempt
                    ? t("100% Tax Exempt", "১০০% করমুক্ত")
                    : t("Taxable under Slabs", "স্ল্যাব অনুযায়ী করযোগ্য")}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-line/40">
                <span className="text-muted">{t("Tax Liability Payable:", "পরিশোধযোগ্য আয়কর:")}</span>
                <span className={`font-mono font-semibold ${result.taxPayableBDT > 0 ? "text-red" : "text-green"}`}>
                  {result.taxPayableBDT > 0 ? `−${fmtTaka(result.taxPayableBDT)}` : "৳0"}
                </span>
              </div>

              <div className="flex justify-between py-2 pt-3 border-t-2 border-line text-sm font-bold text-green-deep">
                <span>{t("Final In-Hand Cash:", "চূড়ান্ত ক্যাশ জমা:")}</span>
                <span className="font-mono text-green font-bold text-lg">{fmtTaka(result.netInHandBDT)}</span>
              </div>
            </div>

            {/* Educational Section 264 Note */}
            <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted leading-relaxed">
              {t(
                "Important Legal Reminder: Section 264 of the Income Tax Act 2023 mandates filing an annual tax return (Proof of Submission of Return - PSR) to maintain bank accounts, credit cards, and trade licenses, even if your tax liability is ৳0.",
                "জরুরি আইনগত বার্তা: আয়কর আইন ২০২৩-এর ধারা ২৬৪ অনুযায়ী কর প্রদেয় না থাকলেও (শূন্য কর হলেও) ব্যাংক একাউন্ট ও ক্রেডিট কার্ড সচল রাখতে রিটার্ন দাখিল (PSR) গ্রহণ বাধ্যতামূলক।"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
