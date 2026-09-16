"use client";

import { useMemo, useState } from "react";
import { CRAR_REGULATORY_MINIMUM_PCT } from "@/config/rate-monitoring";
import { useLanguage } from "@/lib/i18n";
import type { BankHealthRow } from "@/lib/rates/current-rates";

const DISPLAY_FIELDS = ["CAR", "NPL", "ROA", "ROE"] as const;

function latestByField(row: BankHealthRow) {
  const byField: Record<string, BankHealthRow["figures"][number] | undefined> = {};
  for (const f of row.figures) {
    if (!byField[f.field]) byField[f.field] = f; // figures pre-sorted fiscalYear desc
  }
  return byField;
}

/**
 * Visually separate from the live rate table on purpose — these are
 * audited-but-dated figures (a year or more old by the time they're read),
 * never mixed in with the daily-scraped rates above. No composite score or
 * ranking, matching the rest of this module. See
 * prompts/03-annual-report-extraction.md.
 */
export function BankHealthPanel({ rows }: { rows: BankHealthRow[] }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"ALL" | "CAR_COMPLIANT" | "LOW_NPL">("ALL");
  const notAvailable = t("not disclosed / not extracted", "প্রকাশিত/extract করা হয়নি");
  const hasAnyData = rows.some((r) => r.figures.length > 0);

  const filteredRows = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => {
      const byField = latestByField(r);
      if (filter === "CAR_COMPLIANT") {
        const car = byField["CAR"]?.numericValue;
        return car !== undefined && car !== null && car >= CRAR_REGULATORY_MINIMUM_PCT;
      }
      if (filter === "LOW_NPL") {
        const npl = byField["NPL"]?.numericValue;
        return npl !== undefined && npl !== null && npl < 5.0;
      }
      return true;
    });
  }, [rows, filter]);

  return (
    <fieldset className="border border-line bg-card px-4 pt-4 pb-4.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <legend className="font-serif font-semibold text-[15.5px] text-green-deep px-1.5">
          {t("Bank health (from audited annual reports)", "Bank health (audited annual report থেকে)")}
        </legend>

        {hasAnyData && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] text-muted mr-1 font-mono uppercase">{t("Filter:", "ফিল্টার:")}</span>
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                filter === "ALL"
                  ? "bg-green-deep text-paper font-semibold"
                  : "bg-[#FAF9F5] border border-line text-muted hover:text-foreground"
              }`}
            >
              {t("All Banks", "সকল ব্যাংক")}
            </button>
            <button
              type="button"
              onClick={() => setFilter("CAR_COMPLIANT")}
              className={`px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                filter === "CAR_COMPLIANT"
                  ? "bg-green text-paper font-semibold"
                  : "bg-[#FAF9F5] border border-line text-muted hover:text-foreground"
              }`}
            >
              {t("CAR ≥ 12.5%", "CAR ≥ ১২.৫%")}
            </button>
            <button
              type="button"
              onClick={() => setFilter("LOW_NPL")}
              className={`px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                filter === "LOW_NPL"
                  ? "bg-gold text-green-deep font-semibold"
                  : "bg-[#FAF9F5] border border-line text-muted hover:text-foreground"
              }`}
            >
              {t("NPL < 5%", "NPL < ৫%")}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted mb-3">
        {t(
          `These figures come from each bank's own audited annual report, dated by fiscal year — they can be a year or more old, and are not the same as the live rates above. Bangladesh Bank's minimum CRAR requirement is ${CRAR_REGULATORY_MINIMUM_PCT}%. No composite score or ranking is computed here — just the disclosed numbers, side by side.`,
          `এই figures গুলো bank er নিজের audited annual report থেকে, fiscal year অনুযায়ী dated — এক বছর বা তার বেশি পুরনো হতে পারে, উপরের live rate এর মতো না। Bangladesh Bank er minimum CRAR requirement ${CRAR_REGULATORY_MINIMUM_PCT}%. এখানে কোনো composite score বা ranking নেই — শুধু disclosed number গুলো পাশাপাশি।`
        )}
      </p>

      {!hasAnyData ? (
        <p className="text-sm text-muted">
          {t(
            "No bank has an approved figure yet — this fills in as annual-report sources are added and reviewed.",
            "এখনো কোনো bank er approved figure নেই — annual-report source যোগ ও review হলে এখানে দেখা যাবে।"
          )}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-left">
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Bank", "ব্যাংক")}
                </th>
                {DISPLAY_FIELDS.map((field) => (
                  <th key={field} className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                    {field}
                    {field === "CAR" && (
                      <span className="block text-[10px] font-normal text-muted">
                        {t(`min ${CRAR_REGULATORY_MINIMUM_PCT}%`, `সর্বনিম্ন ${CRAR_REGULATORY_MINIMUM_PCT}%`)}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const byField = latestByField(row);
                return (
                  <tr key={row.bankShortCode} className="border-b border-line hover:bg-[#FBFAF6]">
                    <td className="py-2 px-2">{row.bankName}</td>
                    {DISPLAY_FIELDS.map((field) => {
                      const f = byField[field];
                      return (
                        <td key={field} className="py-2 px-2 text-right">
                          {f ? (
                            <a
                              href={f.sourceReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline decoration-dotted"
                              title={t(`FY${f.fiscalYear}, audited — source`, `FY${f.fiscalYear}, audited — source`)}
                            >
                              {f.numericValue !== null ? `${f.numericValue}%` : f.rawValue} (FY{f.fiscalYear})
                            </a>
                          ) : (
                            <span className="text-muted">{notAvailable}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </fieldset>
  );
}
