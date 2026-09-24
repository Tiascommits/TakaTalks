"use client";

import { useMemo, useState } from "react";
import {
  calculateSalaryBreakdown,
  type SalaryStructureInput,
} from "@/lib/salary/salary";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

export function SalaryComparator() {
  const { t } = useLanguage();

  const [current, setCurrent] = useState<SalaryStructureInput>({
    label: "Current Job",
    monthlyBasic: 60_000,
    monthlyHouseRent: 30_000,
    monthlyMedical: 6_000,
    monthlyConveyance: 4_000,
    festivalBonusesCount: 2,
    pfContributionPct: 10,
    hasEmployerPFMatch: true,
  });

  const [offerA, setOfferA] = useState<SalaryStructureInput>({
    label: "Offer A",
    monthlyBasic: 85_000,
    monthlyHouseRent: 42_500,
    monthlyMedical: 8_500,
    monthlyConveyance: 5_000,
    festivalBonusesCount: 2,
    pfContributionPct: 10,
    hasEmployerPFMatch: true,
  });

  const [showOfferB, setShowOfferB] = useState(false);
  const [offerB, setOfferB] = useState<SalaryStructureInput>({
    label: "Offer B",
    monthlyBasic: 100_000,
    monthlyHouseRent: 50_000,
    monthlyMedical: 10_000,
    monthlyConveyance: 5_000,
    festivalBonusesCount: 2,
    pfContributionPct: 0,
    hasEmployerPFMatch: false,
  });

  const [expandedA, setExpandedA] = useState(false);
  const [expandedB, setExpandedB] = useState(false);
  const [expandedCurrent, setExpandedCurrent] = useState(false);

  const resCurrent = useMemo(() => calculateSalaryBreakdown(current), [current]);
  const resOfferA = useMemo(() => calculateSalaryBreakdown(offerA), [offerA]);
  const resOfferB = useMemo(() => calculateSalaryBreakdown(offerB), [offerB]);

  function updateCurrent(patch: Partial<SalaryStructureInput>) {
    setCurrent((prev) => ({ ...prev, ...patch }));
  }

  function updateOfferA(patch: Partial<SalaryStructureInput>) {
    setOfferA((prev) => ({ ...prev, ...patch }));
  }

  function updateOfferB(patch: Partial<SalaryStructureInput>) {
    setOfferB((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Top Banner: Key Takeaway */}
      <div className="bg-[#FBFAF6] border border-line p-4.5 rounded-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] text-gold uppercase tracking-wider font-semibold">
            {t("IN-HAND REALITY CHECK", "প্রকৃত ইন-হ্যান্ড বেতন বিশ্লেষণ")}
          </span>
          <h2 className="font-serif font-semibold text-lg text-green-deep">
            {resOfferA.netMonthlyInHand >= resCurrent.netMonthlyInHand ? (
              <>
                {offerA.label} {t("gives you", "আপনাকে দেবে")} +
                <span className="font-mono text-green ml-1">
                  {fmtTaka(resOfferA.netMonthlyInHand - resCurrent.netMonthlyInHand)}
                </span>
                /{t("mo more in your bank account", "মাস অতিরিক্ত ক্যাশ")}
              </>
            ) : (
              <>
                {offerA.label} {t("actually pays", "আপনাকে")}
                <span className="font-mono text-red ml-1">
                  {fmtTaka(resCurrent.netMonthlyInHand - resOfferA.netMonthlyInHand)}
                </span>
                /{t("mo LESS in-hand cash due to tax brackets & allowances!", "মাস কম ইন-হ্যান্ড দেবে!")}
              </>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t(
              "Gross CTC is misleading. In Bangladesh, your true net take-home depends on basic structure, PF matching, and the 1/3 statutory tax exemption.",
              "গ্রস অফার দেখে বিভ্রান্ত হবেন না। বাংলাদেশে মূল বেতন, পিএফ ম্যাচিং ও এক-তৃতীয়াংশ কর অব্যাহতির উপর আসল ইন-হ্যান্ড নির্ভর করে।"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowOfferB((v) => !v)}
          className="shrink-0 px-3 py-2 border border-dashed border-gold hover:bg-gold/10 text-green-deep text-xs font-semibold transition-colors"
        >
          {showOfferB
            ? t("− Remove Offer B", "− অফার B বাদ দিন")
            : t("+ Add Offer B to Compare", "+ ৩য় অফার (Offer B) যোগ করুন")}
        </button>
      </div>

      {/* Side-by-Side Offer Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${
          showOfferB ? "lg:grid-cols-3" : "lg:grid-cols-2"
        } gap-5 items-start`}
      >
        {/* Current Job Column */}
        <div className="bg-card border border-line rounded-sm overflow-hidden shadow-xs">
          <div className="bg-[#F6F5EE] border-b border-line px-4 py-3 flex justify-between items-center">
            <span className="font-serif font-semibold text-base text-green-deep">
              {current.label}
            </span>
            <span className="text-[11px] font-mono text-muted uppercase">
              {t("BASELINE", "বর্তমান চাকরি")}
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            <NumberField
              label={t("Monthly Basic Salary (৳)", "মাসিক মূল বেতন (Basic, ৳)")}
              value={current.monthlyBasic}
              onChange={(n) => {
                updateCurrent({
                  monthlyBasic: n,
                  monthlyHouseRent: Math.round(n * 0.5),
                  monthlyMedical: Math.round(n * 0.1),
                  monthlyConveyance: Math.round(n * 0.05),
                });
              }}
            />

            <button
              type="button"
              onClick={() => setExpandedCurrent((v) => !v)}
              className="text-xs text-green font-medium hover:underline flex items-center gap-1"
            >
              {expandedCurrent ? t("▲ Hide Allowances", "▲ ভাতা লুকান") : t("▼ Edit Allowances & PF", "▼ বাড়িভাড়া, চিকিৎসা ও পিএফ")}
            </button>

            {expandedCurrent && (
              <div className="pt-2 border-t border-line/60 space-y-2.5">
                <NumberField
                  label={t("House Rent (monthly)", "বাড়ি ভাড়া ভাতা (মাসিক)")}
                  value={current.monthlyHouseRent ?? 0}
                  onChange={(n) => updateCurrent({ monthlyHouseRent: n })}
                />
                <NumberField
                  label={t("Medical Allowance (monthly)", "চিকিৎসা ভাতা (মাসিক)")}
                  value={current.monthlyMedical ?? 0}
                  onChange={(n) => updateCurrent({ monthlyMedical: n })}
                />
                <NumberField
                  label={t("Conveyance Allowance (monthly)", "যাতায়াত ভাতা (মাসিক)")}
                  value={current.monthlyConveyance ?? 0}
                  onChange={(n) => updateCurrent({ monthlyConveyance: n })}
                />
                <label className="flex items-center gap-2 text-xs text-[#555] pt-1">
                  <input
                    type="checkbox"
                    checked={current.hasEmployerPFMatch}
                    onChange={(e) => updateCurrent({ hasEmployerPFMatch: e.target.checked })}
                    className="w-auto"
                  />
                  {t("Employer matches 10% PF", "প্রতিষ্ঠান ১০% পিএফ ম্যাচ করে")}
                </label>
              </div>
            )}

            {/* Results Snapshot */}
            <div className="mt-4 pt-3 border-t-2 border-line bg-[#FAF9F5] p-3 rounded-sm space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted font-medium">
                  {t("Monthly In-Hand (Bank):", "ব্যাংকে জমা (মাসিক):")}
                </span>
                <span className="font-mono font-bold text-lg text-green-deep">
                  {fmtTaka(resCurrent.netMonthlyInHand)}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-xs text-muted">
                <span>{t("Monthly TDS Tax:", "মাসিক আয়কর কর্তন:")}</span>
                <span className="font-mono text-red">{fmtTaka(resCurrent.monthlyTDS)}</span>
              </div>

              <div className="flex justify-between items-baseline text-xs text-muted">
                <span>{t("Employee PF (Deducted):", "পিএফ জমা (বেতন কর্তন):")}</span>
                <span className="font-mono">{fmtTaka(resCurrent.monthlyEmployeePF)}</span>
              </div>

              <div className="border-t border-line/60 pt-2 flex justify-between items-baseline text-xs">
                <span className="font-medium text-foreground">{t("Annual Total CTC:", "বার্ষিক মোট সিটিসি:")}</span>
                <span className="font-mono font-semibold">{fmtTaka(resCurrent.annualCTC)}</span>
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="font-medium text-green-deep">
                  {t("Total Wealth (Cash + PF):", "মোট সম্পদ (ক্যাশ + পিএফ):")}
                </span>
                <span className="font-mono font-semibold text-green-deep">
                  {fmtTaka(resCurrent.annualTotalWealth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Offer A Column */}
        <div className="bg-card border-2 border-green rounded-sm overflow-hidden shadow-sm">
          <div className="bg-green-deep text-paper px-4 py-3 flex justify-between items-center">
            <span className="font-serif font-semibold text-base">
              {offerA.label}
            </span>
            <span className="text-[10.5px] font-mono text-gold font-semibold uppercase">
              {resOfferA.netMonthlyInHand >= resCurrent.netMonthlyInHand
                ? t("HIGHER IN-HAND", "বেশি ইন-হ্যান্ড")
                : t("LOWER IN-HAND", "কম ইন-হ্যান্ড")}
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            <NumberField
              label={t("Monthly Basic Salary (৳)", "মাসিক মূল বেতন (Basic, ৳)")}
              value={offerA.monthlyBasic}
              onChange={(n) => {
                updateOfferA({
                  monthlyBasic: n,
                  monthlyHouseRent: Math.round(n * 0.5),
                  monthlyMedical: Math.round(n * 0.1),
                  monthlyConveyance: Math.round(n * 0.05),
                });
              }}
            />

            <button
              type="button"
              onClick={() => setExpandedA((v) => !v)}
              className="text-xs text-green font-medium hover:underline flex items-center gap-1"
            >
              {expandedA ? t("▲ Hide Allowances", "▲ ভাতা লুকান") : t("▼ Edit Allowances & PF", "▼ বাড়িভাড়া, চিকিৎসা ও পিএফ")}
            </button>

            {expandedA && (
              <div className="pt-2 border-t border-line/60 space-y-2.5">
                <NumberField
                  label={t("House Rent (monthly)", "বাড়ি ভাড়া ভাতা (মাসিক)")}
                  value={offerA.monthlyHouseRent ?? 0}
                  onChange={(n) => updateOfferA({ monthlyHouseRent: n })}
                />
                <NumberField
                  label={t("Medical Allowance (monthly)", "চিকিৎসা ভাতা (মাসিক)")}
                  value={offerA.monthlyMedical ?? 0}
                  onChange={(n) => updateOfferA({ monthlyMedical: n })}
                />
                <NumberField
                  label={t("Conveyance Allowance (monthly)", "যাতায়াত ভাতা (মাসিক)")}
                  value={offerA.monthlyConveyance ?? 0}
                  onChange={(n) => updateOfferA({ monthlyConveyance: n })}
                />
                <label className="flex items-center gap-2 text-xs text-[#555] pt-1">
                  <input
                    type="checkbox"
                    checked={offerA.hasEmployerPFMatch}
                    onChange={(e) => updateOfferA({ hasEmployerPFMatch: e.target.checked })}
                    className="w-auto"
                  />
                  {t("Employer matches 10% PF", "প্রতিষ্ঠান ১০% পিএফ ম্যাচ করে")}
                </label>
              </div>
            )}

            {/* Results Snapshot */}
            <div className="mt-4 pt-3 border-t-2 border-line bg-[#F8FAF8] p-3 rounded-sm space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted font-medium">
                  {t("Monthly In-Hand (Bank):", "ব্যাংকে জমা (মাসিক):")}
                </span>
                <span className="font-mono font-bold text-lg text-green">
                  {fmtTaka(resOfferA.netMonthlyInHand)}
                </span>
              </div>

              {/* Difference relative to current */}
              <div className="flex justify-between items-baseline text-xs font-mono font-semibold">
                <span className="text-muted">{t("In-Hand Difference:", "মাসিক পার্থক্য:")}</span>
                <span
                  className={
                    resOfferA.netMonthlyInHand >= resCurrent.netMonthlyInHand
                      ? "text-green"
                      : "text-red"
                  }
                >
                  {resOfferA.netMonthlyInHand >= resCurrent.netMonthlyInHand ? "+" : ""}
                  {fmtTaka(resOfferA.netMonthlyInHand - resCurrent.netMonthlyInHand)}/{t("mo", "মাস")}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-xs text-muted">
                <span>{t("Monthly TDS Tax:", "মাসিক আয়কর কর্তন:")}</span>
                <span className="font-mono text-red">{fmtTaka(resOfferA.monthlyTDS)}</span>
              </div>

              <div className="flex justify-between items-baseline text-xs text-muted">
                <span>{t("Employee PF (Deducted):", "পিএফ জমা (বেতন কর্তন):")}</span>
                <span className="font-mono">{fmtTaka(resOfferA.monthlyEmployeePF)}</span>
              </div>

              <div className="border-t border-line/60 pt-2 flex justify-between items-baseline text-xs">
                <span className="font-medium text-foreground">{t("Annual Total CTC:", "বার্ষিক মোট সিটিসি:")}</span>
                <span className="font-mono font-semibold">{fmtTaka(resOfferA.annualCTC)}</span>
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="font-medium text-green-deep">
                  {t("Total Wealth (Cash + PF):", "মোট সম্পদ (ক্যাশ + পিএফ):")}
                </span>
                <span className="font-mono font-semibold text-green-deep">
                  {fmtTaka(resOfferA.annualTotalWealth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Offer B Column */}
        {showOfferB && (
          <div className="bg-card border border-gold rounded-sm overflow-hidden shadow-xs">
            <div className="bg-[#FAF7EE] border-b border-gold px-4 py-3 flex justify-between items-center">
              <span className="font-serif font-semibold text-base text-green-deep">
                {offerB.label}
              </span>
              <span className="text-[10.5px] font-mono text-gold font-semibold uppercase">
                {t("COMPARISON", "অফার B")}
              </span>
            </div>

            <div className="p-4 space-y-3.5">
              <NumberField
                label={t("Monthly Basic Salary (৳)", "মাসিক মূল বেতন (Basic, ৳)")}
                value={offerB.monthlyBasic}
                onChange={(n) => {
                  updateOfferB({
                    monthlyBasic: n,
                    monthlyHouseRent: Math.round(n * 0.5),
                    monthlyMedical: Math.round(n * 0.1),
                    monthlyConveyance: Math.round(n * 0.05),
                  });
                }}
              />

              <button
                type="button"
                onClick={() => setExpandedB((v) => !v)}
                className="text-xs text-green font-medium hover:underline flex items-center gap-1"
              >
                {expandedB ? t("▲ Hide Allowances", "▲ ভাতা লুকান") : t("▼ Edit Allowances & PF", "▼ বাড়িভাড়া, চিকিৎসা ও পিএফ")}
              </button>

              {expandedB && (
                <div className="pt-2 border-t border-line/60 space-y-2.5">
                  <NumberField
                    label={t("House Rent (monthly)", "বাড়ি ভাড়া ভাতা (মাসিক)")}
                    value={offerB.monthlyHouseRent ?? 0}
                    onChange={(n) => updateOfferB({ monthlyHouseRent: n })}
                  />
                  <NumberField
                    label={t("Medical Allowance (monthly)", "চিকিৎসা ভাতা (মাসিক)")}
                    value={offerB.monthlyMedical ?? 0}
                    onChange={(n) => updateOfferB({ monthlyMedical: n })}
                  />
                  <NumberField
                    label={t("Conveyance Allowance (monthly)", "যাতায়াত ভাতা (মাসিক)")}
                    value={offerB.monthlyConveyance ?? 0}
                    onChange={(n) => updateOfferB({ monthlyConveyance: n })}
                  />
                  <label className="flex items-center gap-2 text-xs text-[#555] pt-1">
                    <input
                      type="checkbox"
                      checked={offerB.hasEmployerPFMatch}
                      onChange={(e) => updateOfferB({ hasEmployerPFMatch: e.target.checked })}
                      className="w-auto"
                    />
                    {t("Employer matches 10% PF", "প্রতিষ্ঠান ১০% পিএফ ম্যাচ করে")}
                  </label>
                </div>
              )}

              {/* Results Snapshot */}
              <div className="mt-4 pt-3 border-t-2 border-line bg-[#FAF9F5] p-3 rounded-sm space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted font-medium">
                    {t("Monthly In-Hand (Bank):", "ব্যাংকে জমা (মাসিক):")}
                  </span>
                  <span className="font-mono font-bold text-lg text-green-deep">
                    {fmtTaka(resOfferB.netMonthlyInHand)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs font-mono font-semibold">
                  <span className="text-muted">{t("In-Hand Difference:", "মাসিক পার্থক্য:")}</span>
                  <span
                    className={
                      resOfferB.netMonthlyInHand >= resCurrent.netMonthlyInHand
                        ? "text-green"
                        : "text-red"
                    }
                  >
                    {resOfferB.netMonthlyInHand >= resCurrent.netMonthlyInHand ? "+" : ""}
                    {fmtTaka(resOfferB.netMonthlyInHand - resCurrent.netMonthlyInHand)}/{t("mo", "মাস")}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs text-muted">
                  <span>{t("Monthly TDS Tax:", "মাসিক আয়কর কর্তন:")}</span>
                  <span className="font-mono text-red">{fmtTaka(resOfferB.monthlyTDS)}</span>
                </div>

                <div className="flex justify-between items-baseline text-xs text-muted">
                  <span>{t("Employee PF (Deducted):", "পিএফ জমা (বেতন কর্তন):")}</span>
                  <span className="font-mono">{fmtTaka(resOfferB.monthlyEmployeePF)}</span>
                </div>

                <div className="border-t border-line/60 pt-2 flex justify-between items-baseline text-xs">
                  <span className="font-medium text-foreground">{t("Annual Total CTC:", "বার্ষিক মোট সিটিসি:")}</span>
                  <span className="font-mono font-semibold">{fmtTaka(resOfferB.annualCTC)}</span>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-green-deep">
                    {t("Total Wealth (Cash + PF):", "মোট সম্পদ (ক্যাশ + পিএফ):")}
                  </span>
                  <span className="font-mono font-semibold text-green-deep">
                    {fmtTaka(resOfferB.annualTotalWealth)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Exemption Educational Explanation */}
      <div className="mt-8 bg-card border border-line p-5 rounded-sm">
        <h3 className="font-serif font-semibold text-sm text-green-deep mb-2">
          {t("How Tax is Calculated on Bangladeshi Salaries (Income Tax Act 2023)", "বেতনে আয়কর যেভাবে হিসাব হয় (আয়কর আইন ২০২৩)")}
        </h3>
        <p className="text-xs text-[#555] leading-relaxed mb-3">
          {t(
            "Under Section 32 of the Income Tax Act 2023, employees receive a unified statutory exemption: one-third (1/3) of total employment receipts, or ৳5,00,000, whichever is less. The remaining salary is taxed according to national slab rates, and employers deduct this annually in 12 equal monthly TDS installments under Section 86.",
            "আয়কর আইন ২০২৩-এর ধারা ৩২ অনুযায়ী চাকরি হতে আয়ের ক্ষেত্রে একটি একক সাধারণ অব্যাহতি প্রযোজ্য: মোট প্রাপ্তির এক-তৃতীয়াংশ অথবা ৫,০০,০০০ টাকা (যেটি কম)। অবশিষ্ট করযোগ্য বেতনের উপর সাধারণ স্ল্যাব হারে কর নির্ধারণ হয় এবং ধারা ৮৬ অনুযায়ী প্রতিষ্ঠান প্রতি মাসে ১২টি সমান কিস্তিতে তা উৎস কর (TDS) হিসেবে কেটে রাখে।"
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#FAF9F5] border border-line rounded-sm">
            <span className="text-muted block text-[10.5px] uppercase font-mono">{t("Statutory Exemption", "কর অব্যাহতি")}</span>
            <span className="font-mono font-semibold text-green-deep">
              {fmtTaka(resOfferA.statutoryExemption)}
            </span>
          </div>
          <div className="p-3 bg-[#FAF9F5] border border-line rounded-sm">
            <span className="text-muted block text-[10.5px] uppercase font-mono">{t("Taxable Salary", "করযোগ্য বেতন")}</span>
            <span className="font-mono font-semibold text-green-deep">
              {fmtTaka(resOfferA.taxableSalary)}
            </span>
          </div>
          <div className="p-3 bg-[#FAF9F5] border border-line rounded-sm">
            <span className="text-muted block text-[10.5px] uppercase font-mono">{t("Effective Tax Rate", "কার্যকর কর হার")}</span>
            <span className="font-mono font-semibold text-green-deep">
              {resOfferA.effectiveTaxRatePct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
