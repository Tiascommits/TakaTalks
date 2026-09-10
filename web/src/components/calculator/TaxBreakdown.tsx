import { TAX_RULES } from "@/config/tax-rules-2025-26";
import { fmtTaka } from "@/lib/format";
import type { TaxCalculationResult } from "@/lib/tax/types";

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
  if (!r.hasAnyIncome) {
    return (
      <div className="font-mono text-[12.5px]">
        <Line label="তথ্য দিলে হিসাব এখানে আসবে" value="—" />
      </div>
    );
  }

  return (
    <div className="font-mono text-[12.5px]">
      <GroupTitle>আয়ের খাত</GroupTitle>
      <Line label="মোট বেতন (gross salary)" value={fmtTaka(r.grossSalary)} />
      <Line
        label="বেতন exemption (⅓ বা ৫ লাখ, যেটা কম)"
        value={`−${fmtTaka(r.salaryExemption)}`}
        variant="sub"
      />
      <Line label="করযোগ্য বেতন" value={fmtTaka(r.taxableSalary)} />
      <Line label="ব্যবসা/পেশা মুনাফা" value={fmtTaka(r.business)} />
      <Line label="বাড়ি ভাড়ার আয়" value={fmtTaka(r.houseProperty)} />
      <Line label="অন্যান্য উৎস" value={fmtTaka(r.otherIncome)} />
      <Line label="মূলধনী মুনাফা (slab rate অংশ)" value={fmtTaka(r.cgWithin5 + r.cgLand)} />
      <Line label="মোট স্লাব-ভিত্তিক আয়" value={fmtTaka(r.slabBase)} variant="total" />

      <GroupTitle>কর-মুক্ত সীমা ও স্লাব</GroupTitle>
      <Line label="করমুক্ত সীমা (tax-free)" value={`−${fmtTaka(r.taxFree)}`} />
      <Line label="স্লাবের আওতায় আয়" value={fmtTaka(r.incomeAboveTaxFree)} />
      {r.slabRows.map((row, i) => (
        <Line
          key={i}
          label={`${(row.rate * 100).toFixed(0)}% স্লাব: ${fmtTaka(row.chunk)}`}
          value={fmtTaka(row.tax)}
          variant="sub"
        />
      ))}
      <Line label="স্লাব কর" value={fmtTaka(r.baseSlabTax)} variant="total" />

      <GroupTitle>ফ্ল্যাট রেট মূলধনী মুনাফা কর</GroupTitle>
      <Line
        label="Shares/fund (৫০ লাখ exempt পরে, 15%)"
        value={fmtTaka(r.flatShareTax)}
        variant="sub"
      />
      <Line label="৫ বছর পর বিক্রি সম্পদ (flat 15%)" value={fmtTaka(r.flatAfter5Tax)} variant="sub" />
      <Line label="স্বর্ণ/গহনা (flat 5%)" value={fmtTaka(r.flatGoldTax)} variant="sub" />
      <Line label="মোট কর (রিবেটের আগে)" value={fmtTaka(r.grossTax)} variant="total" />

      <GroupTitle>বিনিয়োগ রিবেট</GroupTitle>
      <Line label="মোট eligible বিনিয়োগ" value={fmtTaka(r.totalInvestment)} variant="sub" />
      <Line label={`আয়ের ${TAX_RULES.rebateRateOfIncome * 100}% = ${fmtTaka(r.rebate3pct)}`} value="" variant="sub" />
      <Line
        label={`বিনিয়োগের ${TAX_RULES.rebateRateOfInvestment * 100}% = ${fmtTaka(r.rebate10pct)}`}
        value=""
        variant="sub"
      />
      <Line label={`সর্বোচ্চ সীমা = ${fmtTaka(TAX_RULES.rebateCap)}`} value="" variant="sub" />
      <Line label="রিবেট (সবচেয়ে কম মান)" value={`−${fmtTaka(r.rebate)}`} variant="total" />

      <GroupTitle>চূড়ান্ত হিসাব</GroupTitle>
      <Line
        label={`রিবেটের পর কর ${r.minApplied ? "(minimum tax প্রয়োগ)" : ""}`}
        value={fmtTaka(r.taxAfterRebate)}
      />
      <Line label={`সারচার্জ (${(r.surchargeRate * 100).toFixed(0)}%)`} value={fmtTaka(r.surchargeAmt)} />
      <Line label="মোট কর দায়" value={fmtTaka(r.totalLiability)} variant="total" />
      <Line label="পূর্বে কর্তিত AIT" value={`−${fmtTaka(ait)}`} />
      <Line
        label={r.netPayable < 0 ? "ফেরতযোগ্য (refund)" : "পরিশোধযোগ্য কর"}
        value={fmtTaka(Math.abs(r.netPayable))}
        variant={r.netPayable < 0 ? "refund" : "payable"}
      />
    </div>
  );
}
