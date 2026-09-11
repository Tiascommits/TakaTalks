"use client";

import { useId, useState } from "react";
import { fmtTaka } from "@/lib/format";
import { INSTRUMENT_LABELS, INSTRUMENT_LABELS_EN, type InstrumentType, type InvestmentEntryDTO } from "./types";
import { useLanguage } from "@/lib/i18n";

const INSTRUMENTS = Object.keys(INSTRUMENT_LABELS) as InstrumentType[];

export function InvestmentSection({
  entries,
  onAdd,
  onDelete,
}: {
  entries: InvestmentEntryDTO[];
  onAdd: (e: {
    label: string;
    instrumentType: InstrumentType;
    principalAmount: number;
    startDate: string;
    termMonths: number;
    expectedRatePct: number;
  }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [label, setLabel] = useState("");
  const [instrumentType, setInstrumentType] = useState<InstrumentType>("SANCHAYPATRA");
  const [principal, setPrincipal] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [termMonths, setTermMonths] = useState("12");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const labelId = useId();
  const instrumentId = useId();
  const principalId = useId();
  const startDateId = useId();
  const termId = useId();
  const rateId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = parseFloat(principal);
    const t2 = parseInt(termMonths, 10);
    const r = parseFloat(rate) || 0;

    if (!label.trim()) {
      setError(t("Give it a label.", "লেবেল দাও।"));
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError(t("Principal amount must be greater than zero.", "আসল পরিমাণ অবশ্যই শূন্যের চেয়ে বড় হতে হবে।"));
      return;
    }
    if (!Number.isInteger(t2) || t2 <= 0) {
      setError(t("Term must be a positive whole number (months).", "মেয়াদ অবশ্যই একটা ধনাত্মক পূর্ণসংখ্যা (মাস) হতে হবে।"));
      return;
    }
    if (r < 0) {
      setError(t("Rate can't be negative.", "রেট ঋণাত্মক হতে পারে না।"));
      return;
    }

    setSubmitting(true);
    const ok = await onAdd({
      label: label.trim(),
      instrumentType,
      principalAmount: p,
      startDate,
      termMonths: t2,
      expectedRatePct: r,
    });
    setSubmitting(false);
    if (!ok) {
      setError(t("Couldn't save, try again.", "সেভ করা যায়নি, আবার চেষ্টা করো।"));
      return;
    }
    setLabel("");
    setPrincipal("");
    setRate("");
  }

  return (
    <section className="bg-card border border-line p-5">
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b-2 border-green">
        {t("Investments", "বিনিয়োগ")}
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-muted mb-4">{t("No investments added yet.", "এখনো কোনো বিনিয়োগ যোগ করোনি।")}</p>
      ) : (
        <ul className="mb-4 divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between items-center py-2 text-sm">
              <div>
                <span className="font-medium">{e.label}</span>{" "}
                <span className="text-muted text-xs">
                  ({t(INSTRUMENT_LABELS_EN[e.instrumentType], INSTRUMENT_LABELS[e.instrumentType])},{" "}
                  {t("matures", "matures")}{" "}
                  {new Date(e.maturityDate).toLocaleDateString("en-GB")})
                </span>
                {e.payoutConfirmed && (
                  <span className="ml-2 text-[11px] text-green-deep font-semibold">
                    {t(
                      `✓ Payout confirmed (${fmtTaka(e.payoutAmount ?? 0)})`,
                      `✓ পেমেন্ট নিশ্চিত হয়েছে (${fmtTaka(e.payoutAmount ?? 0)})`
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{fmtTaka(e.principalAmount)}</span>
                {confirmDeleteId === e.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted">{t("Delete?", "মুছে ফেলবে?")}</span>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(null);
                        onDelete(e.id);
                      }}
                      className="text-red text-xs font-semibold hover:underline"
                    >
                      {t("Yes", "হ্যাঁ")}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-muted hover:underline"
                    >
                      {t("Cancel", "বাতিল")}
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(e.id)}
                    className="text-red text-xs hover:underline"
                  >
                    {t("Delete", "মুছুন")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-red mb-2">
          {error}
        </p>
      )}
      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
        <div>
          <label htmlFor={labelId} className="block text-xs text-[#555] mb-1">
            {t("Label", "লেবেল")}
          </label>
          <input
            id={labelId}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            placeholder={t("e.g. Sonali Bank FDR", "যেমন: সোনালী ব্যাংক FDR")}
          />
        </div>
        <div>
          <label htmlFor={instrumentId} className="block text-xs text-[#555] mb-1">
            {t("Type", "ধরন")}
          </label>
          <select
            id={instrumentId}
            value={instrumentType}
            onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          >
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i}>
                {t(INSTRUMENT_LABELS_EN[i], INSTRUMENT_LABELS[i])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={principalId} className="block text-xs text-[#555] mb-1">
            {t("Principal (৳)", "আসল (৳)")}
          </label>
          <input
            id={principalId}
            type="number"
            min={0}
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={startDateId} className="block text-xs text-[#555] mb-1">
            {t("Start date", "শুরুর তারিখ")}
          </label>
          <input
            id={startDateId}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={termId} className="block text-xs text-[#555] mb-1">
            {t("Term (months)", "মেয়াদ (মাস)")}
          </label>
          <input
            id={termId}
            type="number"
            min={1}
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor={rateId} className="block text-xs text-[#555] mb-1">
              {t("Expected rate (%)", "প্রত্যাশিত রেট (%)")}
            </label>
            <input
              id={rateId}
              type="number"
              min={0}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 bg-green-deep text-paper px-3 py-2 text-sm font-medium disabled:opacity-50 self-end"
          >
            {t("Add", "যোগ করো")}
          </button>
        </div>
      </form>
    </section>
  );
}
