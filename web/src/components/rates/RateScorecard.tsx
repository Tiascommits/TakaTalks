"use client";

import { useId, useMemo, useState } from "react";
import { fmtTaka } from "@/lib/format";
import { calculateAfterTaxReturn } from "@/lib/rates/after-tax";
import { DEPOSIT_INSURANCE_COVER_BDT, MARGINAL_TAX_RATE_OPTIONS } from "@/config/rate-monitoring";
import type { BankTypeCode, BBAggregateRateDTO, CurrentRateRowDTO } from "./types";
import { useLanguage } from "@/lib/i18n";

const TERM_OPTIONS = [3, 6, 12] as const;

const BANK_TYPE_LABEL: Record<BankTypeCode, { en: string; bn: string }> = {
  STATE_OWNED: { en: "State-owned", bn: "রাষ্ট্রায়ত্ত (State-owned)" },
  PRIVATE: { en: "Private", bn: "বেসরকারি (Private)" },
  FOREIGN: { en: "Foreign", bn: "বিদেশি (Foreign)" },
  ISLAMIC: { en: "Islamic", bn: "ইসলামি (Islamic)" },
};

type SortColumn = "bank" | "rate" | "type";
type SortDirection = "asc" | "desc";

function pct(n: number): string {
  return n.toFixed(2) + "%";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function RateScorecard({
  rows,
  bbAggregate,
}: {
  rows: CurrentRateRowDTO[];
  bbAggregate: BBAggregateRateDTO | null;
}) {
  const { t } = useLanguage();
  const amountId = useId();
  const termId = useId();
  const taxId = useId();

  const [amount, setAmount] = useState(100000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [taxRate, setTaxRate] = useState<number>(0.1);
  const [sortColumn, setSortColumn] = useState<SortColumn>("bank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const visibleRows = useMemo(() => rows.filter((r) => r.termMonths === termMonths), [rows, termMonths]);

  const computed = useMemo(
    () =>
      visibleRows.map((row) => ({
        row,
        afterTax:
          row.ratePct !== null
            ? calculateAfterTaxReturn(amount, row.ratePct, row.termMonths, taxRate)
            : null,
      })),
    [visibleRows, amount, taxRate]
  );

  const sorted = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...computed].sort((a, b) => {
      if (sortColumn === "bank") return dir * a.row.bankName.localeCompare(b.row.bankName);
      if (sortColumn === "type") return dir * a.row.bankType.localeCompare(b.row.bankType);
      // rate: nulls (not available) always sort last, regardless of direction
      if (a.row.ratePct === null && b.row.ratePct === null) return 0;
      if (a.row.ratePct === null) return 1;
      if (b.row.ratePct === null) return -1;
      return dir * (a.row.ratePct - b.row.ratePct);
    });
  }, [computed, sortColumn, sortDirection]);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function sortIndicator(column: SortColumn) {
    if (sortColumn !== column) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  const notAvailable = t("not available", "not available");

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16 flex flex-col gap-5">
      {/* Permanent, non-dismissible — deposit insurance context stays visible regardless of scroll/interaction. */}
      <div className="bg-amber-bg border border-amber-border px-4 py-3 text-[13px] text-[#7A5A12]">
        <strong>{t("Deposit protection:", "আমানত সুরক্ষা:")}</strong>{" "}
        {t(
          "Bangladesh's Deposit Protection Act covers up to",
          "Bangladesh's Deposit Protection Act covers up to"
        )}{" "}
        <strong>{fmtTaka(DEPOSIT_INSURANCE_COVER_BDT)}</strong>{" "}
        {t(
          "per depositor per bank, and only pays out if a bank is formally liquidated. Anything above that, at a single bank, isn't protected. Spreading a large amount across multiple banks reduces this exposure.",
          "per depositor per bank, and only pays out if a bank is formally liquidated. এর বেশি যেকোনো amount, single bank e, protected না। বড় amount হলে একাধিক ব্যাংকে ছড়িয়ে রাখলে এই exposure কমে।"
        )}
      </div>

      <div className="bg-[#FBEFEF] border border-red px-4 py-3 text-[13px] text-red">
        {t(
          "Rates and disclosed figures are self-reported by banks and may lag real conditions. Verify at the bank yourself before depositing, especially for larger amounts. This is not investment advice.",
          "Rates এবং disclosed figures গুলো bank নিজে self-report করে, real condition থেকে lag করতে পারে। Deposit করার আগে, বিশেষ করে বড় amount হলে, নিজে bank e গিয়ে verify করো। This is not investment advice."
        )}
      </div>

      {bbAggregate && (
        <div className="bg-[#EFF6F1] border border-green px-4 py-3 text-[13px] text-green-deep">
          <strong>{t("Bangladesh Bank official aggregate", "Bangladesh Bank official aggregate")}</strong> ({bbAggregate.periodLabel}):{" "}
          {bbAggregate.label} — {pct(bbAggregate.ratePct)}. {t("Source:", "Source:")} {bbAggregate.source},{" "}
          {t("entered", "entered")} {fmtDate(bbAggregate.enteredAt)}.{" "}
          <span className="text-muted">
            {t(
              "This is an official aggregate, not a specific product's rate — it won't match any individual bank's rate.",
              "এটা official aggregate, নির্দিষ্ট কোনো product rate না — individual bank er rate এর সাথে মিলবে না।"
            )}
          </span>
        </div>
      )}

      <fieldset className="border border-line bg-card px-4 pt-4 pb-4.5">
        <legend className="font-serif font-semibold text-[15.5px] text-green-deep px-1.5">
          {t("Your calculation", "তোমার হিসাব")}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor={amountId} className="block text-xs text-[#555] mb-1">
              {t("Deposit amount (BDT)", "জমা রাখার পরিমাণ (BDT)")}
            </label>
            <input
              id={amountId}
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            />
          </div>
          <div>
            <label htmlFor={termId} className="block text-xs text-[#555] mb-1">
              {t("Term (Tenor)", "মেয়াদ (Tenor)")}
            </label>
            <select
              id={termId}
              value={termMonths}
              onChange={(e) => setTermMonths(parseInt(e.target.value))}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              {TERM_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === 12 ? t("1 year", "১ বছর") : t(`${m} months`, `${m} মাস`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={taxId} className="block text-xs text-[#555] mb-1">
              {t("Your marginal/AIT tax rate (estimate)", "তোমার marginal/AIT tax rate (estimate)")}
            </label>
            <select
              id={taxId}
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              {MARGINAL_TAX_RATE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 0 ? t("0% (below tax-free limit)", "0% (tax-free সীমার নিচে)") : `${Math.round(r * 100)}%`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-line bg-card px-4 pt-4 pb-4.5">
        <legend className="font-serif font-semibold text-[15.5px] text-green-deep px-1.5">
          {t("FDR comparison", "FDR তুলনা")}
        </legend>
        <p className="text-xs text-muted mb-2.5">
          {t(
            "Click a column header to sort by it. There's no “best” ranking or badge — sorting is just for convenience, not a verdict.",
            "Column header ক্লিক করলে সেই column অনুযায়ী sort হবে। কোনো “best” ranking বা badge নেই — sort টা শুধু দেখার সুবিধার জন্য, কোনো verdict না।"
          )}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-left">
                <th
                  className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort("bank")}
                >
                  {t("Bank", "Bank")}{sortIndicator("bank")}
                </th>
                <th
                  className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort("type")}
                >
                  {t("Type", "Type")}{sortIndicator("type")}
                </th>
                <th
                  className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold cursor-pointer select-none text-right"
                  onClick={() => toggleSort("rate")}
                >
                  {t("Gross rate", "Gross rate")}{sortIndicator("rate")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                  {t("Gross interest", "Gross interest")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                  {t("Net interest (after-tax)", "Net interest (after-tax)")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                  {t("Effective after-tax rate", "Effective after-tax rate")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Credit rating", "Credit rating")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Statement", "Statement")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Source / last verified", "Source / last verified")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ row, afterTax }) => (
                <tr key={row.bankShortCode} className="border-b border-line hover:bg-[#FBFAF6]">
                  <td className="py-2 px-2">{row.bankName}</td>
                  <td className="py-2 px-2 text-muted">{t(BANK_TYPE_LABEL[row.bankType].en, BANK_TYPE_LABEL[row.bankType].bn)}</td>
                  <td className="py-2 px-2 text-right">
                    {row.ratePct !== null ? pct(row.ratePct) : <span className="text-muted">{notAvailable}</span>}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {afterTax ? fmtTaka(afterTax.grossInterest) : "—"}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {afterTax ? fmtTaka(afterTax.netInterest) : "—"}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {afterTax ? pct(afterTax.effectiveAfterTaxRatePct) : "—"}
                  </td>
                  <td className="py-2 px-2">
                    {row.creditRating ? (
                      <>
                        {row.creditRating}
                        <span className="text-muted">
                          {" "}
                          ({row.ratingAgency ?? "—"}, {fmtDate(row.ratingDate)})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">{notAvailable}</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {row.statementUrl ? (
                      <a
                        href={row.statementUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-green-deep"
                      >
                        {t("link", "link")}
                      </a>
                    ) : (
                      <span className="text-muted">{notAvailable}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-[11px] text-muted">
                    {row.source ? (
                      <>
                        {row.method === "MANUAL" ? t("Manual: ", "Manual: ") : t("Scraped: ", "Scraped: ")}
                        {row.source}
                        <br />
                        {t("Last verified", "Last verified")} {fmtDate(row.lastVerifiedAt)}
                        {row.unverified && (
                          <>
                            {" "}
                            <span className="text-red font-semibold">
                              {t(`— unverified since ${fmtDate(row.lastVerifiedAt)}`, `— unverified since ${fmtDate(row.lastVerifiedAt)}`)}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      notAvailable
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}
