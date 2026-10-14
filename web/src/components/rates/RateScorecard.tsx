"use client";

import { useId, useMemo, useState } from "react";
import { fmtTaka } from "@/lib/format";
import { calculateAfterTaxReturn } from "@/lib/rates/after-tax";
import { DEPOSIT_INSURANCE_COVER_BDT, FDR_SOURCE_TAX } from "@/config/rate-monitoring";
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

const pctOf = (rate: number) => `${Math.round(rate * 100)}%`;

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
  const [taxRate, setTaxRate] = useState<number>(FDR_SOURCE_TAX.withPsr);
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

  const notAvailable = t("not available", "নেই");

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
          <strong>{t("Bangladesh Bank official aggregate", "বাংলাদেশ ব্যাংকের অফিসিয়াল গড় হার")}</strong> ({bbAggregate.periodLabel}):{" "}
          {bbAggregate.label} — {pct(bbAggregate.ratePct)}. {t("Source:", "উৎস:")} {bbAggregate.source},{" "}
          {t("entered", "যোগ করা হয়েছে")} {fmtDate(bbAggregate.enteredAt)}.{" "}
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
              {t("Source tax the bank deducts", "ব্যাংক যে উৎসে কর কাটবে")}
            </label>
            <select
              id={taxId}
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              <option value={FDR_SOURCE_TAX.withPsr}>
                {pctOf(FDR_SOURCE_TAX.withPsr)} {t("— I can show proof of return (PSR)", "— রিটার্ন জমার প্রমাণ (PSR) আছে")}
              </option>
              <option value={FDR_SOURCE_TAX.withoutPsr}>
                {pctOf(FDR_SOURCE_TAX.withoutPsr)} {t("— no proof of return", "— রিটার্ন জমার প্রমাণ নেই")}
              </option>
            </select>
          </div>
        </div>
        <p className="text-xs text-muted mt-2.5">
          {t(
            "Net interest is what is left after the bank's source tax. Your tax return settles the final tax on this interest.",
            "নীট সুদ = ব্যাংকের উৎসে কর কাটার পর যা থাকে। এই সুদের চূড়ান্ত কর ঠিক হয় আপনার আয়কর রিটার্নে।"
          )}
        </p>
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
                  {t("Bank", "ব্যাংক")}{sortIndicator("bank")}
                </th>
                <th
                  className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort("type")}
                >
                  {t("Type", "ধরন")}{sortIndicator("type")}
                </th>
                <th
                  className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold cursor-pointer select-none text-right"
                  onClick={() => toggleSort("rate")}
                >
                  {t("Gross rate", "মোট হার")}{sortIndicator("rate")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                  {t("Gross interest", "মোট সুদ")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                  {t("Net interest (after-tax)", "নীট সুদ (কর-পরবর্তী)")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold text-right">
                  {t("Effective after-tax rate", "কার্যকর কর-পরবর্তী হার")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Credit rating", "ক্রেডিট রেটিং")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Statement", "বিবরণী")}
                </th>
                <th className="py-2 px-2 border-b-2 border-green text-green-deep font-semibold">
                  {t("Source / date", "উৎস / তারিখ")}
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
                        {t("link", "লিংক")}
                      </a>
                    ) : (
                      <span className="text-muted">{notAvailable}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-[11px] text-muted">
                    {row.source ? (
                      <>
                        {row.method === "MANUAL" ? t("Manual: ", "ম্যানুয়াল: ") : t("Scraped: ", "স্ক্র্যাপড: ")}
                        {row.source}
                        <br />
                        {row.method === "MANUAL"
                          ? t(`Source dated ${fmtDate(row.asOf)}`, `সূত্রের তারিখ ${fmtDate(row.asOf)}`)
                          : t(`Last checked ${fmtDate(row.asOf)}`, `সর্বশেষ যাচাই ${fmtDate(row.asOf)}`)}
                        {row.unverified && (
                          <>
                            {" "}
                            <span className="text-red font-semibold">
                              {t(`— unverified since ${fmtDate(row.asOf)}`, `— অযাচাইকৃত, ${fmtDate(row.asOf)} থেকে`)}
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
