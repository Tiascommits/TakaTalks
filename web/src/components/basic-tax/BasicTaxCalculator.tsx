"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { calculateBasicTax, EMPTY_BASIC_TAX_INPUT, type BasicTaxInput } from "@/lib/tax/basic";
import { fmtTaka } from "@/lib/format";
import { NumberField, SelectField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

function Row({
  label,
  value,
  variant,
}: {
  label: React.ReactNode;
  value: string;
  variant?: "sub" | "total";
}) {
  const base = "flex justify-between gap-2 py-1.5";
  const variants: Record<string, string> = {
    sub: "text-[#777] pl-2 text-[12px] border-b border-dashed border-line",
    total: "border-t-[1.5px] border-ink mt-1 pt-1.5 font-bold text-[15px]",
  };
  return (
    <div className={`${base} ${variant ? variants[variant] : "border-b border-dashed border-line"}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function BasicTaxCalculator() {
  const { t } = useLanguage();
  const [input, setInput] = useState<BasicTaxInput>(EMPTY_BASIC_TAX_INPUT);

  const result = useMemo(() => calculateBasicTax(input), [input]);
  const hasIncome = input.income > 0;

  return (
    <div className="max-w-[700px] mx-auto px-5 mt-6 mb-16">
      <div className="bg-card border border-line px-4.5 py-5">
        <SelectField
          label={t("Taxpayer category", "করদাতার ক্যাটাগরি")}
          value={input.categoryId}
          onChange={(v) => setInput({ ...input, categoryId: v })}
          options={TAXPAYER_CATEGORIES.map((c) => ({
            value: c.id,
            label: `${t(c.labelEn, c.label)} — Tax-free ৳${c.taxFreeLimit.toLocaleString("en-IN")}`,
          }))}
        />

        <NumberField
          label={t("Total yearly income", "বছরের মোট ইনকাম")}
          value={input.income}
          onChange={(n) => setInput({ ...input, income: n })}
        />

        <div className="mt-2 mb-3 flex items-center gap-2">
          <input
            id="is-salary"
            type="checkbox"
            checked={Boolean(input.isSalary)}
            onChange={(e) => setInput({ ...input, isSalary: e.target.checked })}
            className="w-4 h-4 accent-green rounded border-line cursor-pointer"
          />
          <label htmlFor="is-salary" className="text-xs text-ink cursor-pointer select-none">
            {t(
              "This is salary income (apply 1/3 statutory exemption, max ৳4,50,000)",
              "এটি চাকরির বেতন আয় (১/৩ অংশ সংবিধিবদ্ধ কর অব্যাহতি, সর্বোচ্চ ৳৪,৫০,০০০)"
            )}
          </label>
        </div>

        <button
          type="button"
          onClick={() => setInput({ ...EMPTY_BASIC_TAX_INPUT, income: 1000000 })}
          className="text-xs text-green-deep underline underline-offset-2 hover:no-underline"
        >
          {t("Try the video's example (৳10,00,000)", "ভিডিওর উদাহরণ দেখুন (৳১০,০০,০০০)")}
        </button>
      </div>

      <div className="bg-card border border-line px-4.5 py-5 mt-4">
        <h2 className="font-serif font-semibold text-[17px] mb-3.5 pb-2 border-b-2 border-green text-green-deep">
          {t("Basic slab tax", "বেসিক স্ল্যাব কর")}
        </h2>

        {!hasIncome ? (
          <p className="text-[12.5px] text-muted">
            {t("Enter your income above to see the calculation.", "উপরে ইনকাম দিলে হিসাব এখানে আসবে।")}
          </p>
        ) : (
          <div className="text-[12.5px]">
            <Row label={t("Total yearly income", "মোট বছরের ইনকাম")} value={fmtTaka(input.income)} />
            {result.salaryExemption > 0 && (
              <>
                <Row
                  label={t("Statutory salary exemption (1/3, max ৳4.5L)", "সংবিধিবদ্ধ চাকরি অব্যাহতি (১/৩ অংশ, সর্বোচ্চ ৳৪.৫ লাখ)")}
                  value={`−${fmtTaka(result.salaryExemption)}`}
                  variant="sub"
                />
                <Row
                  label={t("Taxable salary income", "করযোগ্য বেতন আয়")}
                  value={fmtTaka(result.taxableIncome)}
                />
              </>
            )}
            <Row label={t("Tax-free limit", "করমুক্ত সীমা")} value={`−${fmtTaka(result.taxFree)}`} />
            <Row
              label={t("Income above tax-free limit", "করমুক্ত সীমার উপরে আয়")}
              value={fmtTaka(result.incomeAboveTaxFree)}
              variant="total"
            />
            {result.slabRows.map((row, i) => (
              <Row
                key={i}
                label={t(
                  `${(row.rate * 100).toFixed(0)}% slab: ${fmtTaka(row.chunk)}`,
                  `${(row.rate * 100).toFixed(0)}% স্ল্যাব: ${fmtTaka(row.chunk)}`
                )}
                value={fmtTaka(row.tax)}
                variant="sub"
              />
            ))}
            <Row
              label={t("Basic tax", "বেসিক ট্যাক্স")}
              value={fmtTaka(result.basicTax)}
              variant="total"
            />
          </div>
        )}

        <p className="text-[11px] text-muted mt-3.5 pt-2.5 border-t border-line">
          {t(
            "This is the basic slab tax only — it doesn't include TDS already deducted, investment rebate, minimum tax, or surcharge. For the full picture, use the ",
            "এটা শুধু basic slab tax — এখানে আগেই কর্তিত TDS, বিনিয়োগ রিবেট, minimum tax বা surcharge ধরা হয়নি। সম্পূর্ণ হিসাবের জন্য "
          )}
          <Link href="/calculator" className="text-green-deep underline underline-offset-2">
            {t("full tax calculator", "পূর্ণ ট্যাক্স ক্যালকুলেটর")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
