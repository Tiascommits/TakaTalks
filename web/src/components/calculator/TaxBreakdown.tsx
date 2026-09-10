"use client";

import { TAX_RULES } from "@/config/tax-rules-2025-26";
import { fmtTaka } from "@/lib/format";
import type { TaxCalculationResult } from "@/lib/tax/types";
import { useLanguage } from "@/lib/i18n";

function Line({
  label,
  value,
  variant,
}: {
  label: React.ReactNode;
  value: string;
  variant?: "sub" | "total" | "payable" | "refund";
}) {
  const base = "flex justify-between gap-2 py-1.5";
  const variants: Record<string, string> = {
    sub: "text-[#777] pl-2 text-[11.5px] border-b border-dashed border-line",
    total: "border-t-[1.5px] border-ink mt-1 pt-1.5 font-bold",
    payable:
      "bg-[#EFF6F1] border border-green mt-3 px-2.5 py-3 font-bold text-[15.5px] text-green-deep",
    refund: "bg-[#FBEFEF] border border-red text-red mt-3 px-2.5 py-3 font-bold text-[15.5px]",
  };
  return (
    <div
      className={`${base} ${variant ? variants[variant] : "border-b border-dashed border-line"}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-sans font-semibold text-xs text-green-deep mt-3.5 mb-1 first:mt-0">{children}</div>;
}

export function TaxBreakdown({ r, ait }: { r: TaxCalculationResult; ait: number }) {
  const { t } = useLanguage();

  if (!r.hasAnyIncome) {
    return (
      <div className="font-mono text-[12.5px]">
        <Line label={t("Numbers you enter will show up here", "তথ্য দিলে হিসাব এখানে আসবে")} value="—" />
      </div>
    );
  }

  return (
    <div className="font-mono text-[12.5px]">
      <GroupTitle>{t("Income sources", "আয়ের খাত")}</GroupTitle>
      <Line label={t("Gross salary", "মোট বেতন (gross salary)")} value={fmtTaka(r.grossSalary)} />
      <Line
        label={t("Salary exemption (⅓ or ৳5 lakh, whichever lower)", "বেতন exemption (⅓ বা ৫ লাখ, যেটা কম)")}
        value={`−${fmtTaka(r.salaryExemption)}`}
        variant="sub"
      />
      <Line label={t("Taxable salary", "করযোগ্য বেতন")} value={fmtTaka(r.taxableSalary)} />
      <Line label={t("Business / profession profit", "ব্যবসা/পেশা মুনাফা")} value={fmtTaka(r.business)} />
      <Line label={t("House rent income", "বাড়ি ভাড়ার আয়")} value={fmtTaka(r.houseProperty)} />
      <Line label={t("Other sources", "অন্যান্য উৎস")} value={fmtTaka(r.otherIncome)} />
      <Line
        label={t("Capital gains (slab-rate portion)", "মূলধনী মুনাফা (slab rate অংশ)")}
        value={fmtTaka(r.cgWithin5 + r.cgLand)}
      />
      <Line label={t("Total slab-based income", "মোট স্লাব-ভিত্তিক আয়")} value={fmtTaka(r.slabBase)} variant="total" />

      <GroupTitle>{t("Tax-free limit & slabs", "কর-মুক্ত সীমা ও স্লাব")}</GroupTitle>
      <Line label={t("Tax-free limit", "করমুক্ত সীমা (tax-free)")} value={`−${fmtTaka(r.taxFree)}`} />
      <Line label={t("Income above tax-free limit", "স্লাবের আওতায় আয়")} value={fmtTaka(r.incomeAboveTaxFree)} />
      {r.slabRows.map((row, i) => (
        <Line
          key={i}
          label={t(
            `${(row.rate * 100).toFixed(0)}% slab: ${fmtTaka(row.chunk)}`,
            `${(row.rate * 100).toFixed(0)}% স্লাব: ${fmtTaka(row.chunk)}`
          )}
          value={fmtTaka(row.tax)}
          variant="sub"
        />
      ))}
      <Line label={t("Slab tax", "স্লাব কর")} value={fmtTaka(r.baseSlabTax)} variant="total" />

      <GroupTitle>{t("Flat-rate capital gains tax", "ফ্ল্যাট রেট মূলধনী মুনাফা কর")}</GroupTitle>
      <Line
        label={t("Shares/fund (after ৳50 lakh exempt, 15%)", "Shares/fund (৫০ লাখ exempt পরে, 15%)")}
        value={fmtTaka(r.flatShareTax)}
        variant="sub"
      />
      <Line
        label={t("Assets sold after 5 years (flat 15%)", "৫ বছর পর বিক্রি সম্পদ (flat 15%)")}
        value={fmtTaka(r.flatAfter5Tax)}
        variant="sub"
      />
      <Line label={t("Gold/jewellery (flat 5%)", "স্বর্ণ/গহনা (flat 5%)")} value={fmtTaka(r.flatGoldTax)} variant="sub" />
      <Line label={t("Total tax (before rebate)", "মোট কর (রিবেটের আগে)")} value={fmtTaka(r.grossTax)} variant="total" />

      <GroupTitle>{t("Investment rebate", "বিনিয়োগ রিবেট")}</GroupTitle>
      <Line label={t("Total eligible investment", "মোট eligible বিনিয়োগ")} value={fmtTaka(r.totalInvestment)} variant="sub" />
      <Line
        label={t(
          `${TAX_RULES.rebateRateOfIncome * 100}% of income = ${fmtTaka(r.rebate3pct)}`,
          `আয়ের ${TAX_RULES.rebateRateOfIncome * 100}% = ${fmtTaka(r.rebate3pct)}`
        )}
        value=""
        variant="sub"
      />
      <Line
        label={t(
          `${TAX_RULES.rebateRateOfInvestment * 100}% of investment = ${fmtTaka(r.rebate10pct)}`,
          `বিনিয়োগের ${TAX_RULES.rebateRateOfInvestment * 100}% = ${fmtTaka(r.rebate10pct)}`
        )}
        value=""
        variant="sub"
      />
      <Line
        label={t(`Cap = ${fmtTaka(TAX_RULES.rebateCap)}`, `সর্বোচ্চ সীমা = ${fmtTaka(TAX_RULES.rebateCap)}`)}
        value=""
        variant="sub"
      />
      <Line label={t("Rebate (lowest of the three)", "রিবেট (সবচেয়ে কম মান)")} value={`−${fmtTaka(r.rebate)}`} variant="total" />

      <GroupTitle>{t("Final calculation", "চূড়ান্ত হিসাব")}</GroupTitle>
      <Line
        label={t(
          `Tax after rebate ${r.minApplied ? "(minimum tax applied)" : ""}`,
          `রিবেটের পর কর ${r.minApplied ? "(minimum tax প্রয়োগ)" : ""}`
        )}
        value={fmtTaka(r.taxAfterRebate)}
      />
      <Line
        label={t(`Surcharge (${(r.surchargeRate * 100).toFixed(0)}%)`, `সারচার্জ (${(r.surchargeRate * 100).toFixed(0)}%)`)}
        value={fmtTaka(r.surchargeAmt)}
      />
      <Line label={t("Total tax liability", "মোট কর দায়")} value={fmtTaka(r.totalLiability)} variant="total" />
      <Line label={t("AIT already deducted", "পূর্বে কর্তিত AIT")} value={`−${fmtTaka(ait)}`} />
      <Line
        label={r.netPayable < 0 ? t("Refundable", "ফেরতযোগ্য (refund)") : t("Payable tax", "পরিশোধযোগ্য কর")}
        value={fmtTaka(Math.abs(r.netPayable))}
        variant={r.netPayable < 0 ? "refund" : "payable"}
      />
    </div>
  );
}
