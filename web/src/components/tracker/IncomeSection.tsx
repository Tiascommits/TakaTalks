"use client";

import { useId, useState } from "react";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import {
  FREQUENCY_LABELS,
  FREQUENCY_LABELS_EN,
  INCOME_SOURCE_LABELS,
  INCOME_SOURCE_LABELS_EN,
  type IncomeEntryDTO,
  type IncomeFrequency,
} from "./types";
import { useLanguage } from "@/lib/i18n";

const SOURCES = Object.keys(INCOME_SOURCE_LABELS);
const FREQUENCIES: IncomeFrequency[] = ["MONTHLY", "ANNUAL", "ONE_TIME"];

export function IncomeSection({
  entries,
  onAdd,
  onDelete,
}: {
  entries: IncomeEntryDTO[];
  onAdd: (e: {
    label: string;
    source: string;
    amount: number;
    frequency: IncomeFrequency;
  }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [label, setLabel] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [amount, setAmount] = useState(0);
  const [frequency, setFrequency] = useState<IncomeFrequency>("MONTHLY");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const labelId = useId();
  const sourceId = useId();
  const frequencyId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label.trim()) {
      setError(t("Give it a label.", "লেবেল দাও।"));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("Amount must be a number greater than zero.", "পরিমাণ অবশ্যই শূন্যের চেয়ে বড় একটা সংখ্যা হতে হবে।"));
      return;
    }
    setSubmitting(true);
    const ok = await onAdd({ label: label.trim(), source, amount, frequency });
    setSubmitting(false);
    if (!ok) {
      setError(t("Couldn't save, try again.", "সেভ করা যায়নি, আবার চেষ্টা করো।"));
      return;
    }
    setLabel("");
    setAmount(0);
  }

  return (
    <section className="bg-card border border-line p-5">
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b-2 border-green">
        {t("Income sources", "আয়ের উৎস")}
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-muted mb-4">{t("No income sources added yet.", "এখনো কোনো আয়ের উৎস যোগ করোনি।")}</p>
      ) : (
        <ul className="mb-4 divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between items-center py-2 text-sm">
              <div>
                <span className="font-medium">{e.label}</span>{" "}
                <span className="text-muted text-xs">
                  ({t(INCOME_SOURCE_LABELS_EN[e.source] ?? e.source, INCOME_SOURCE_LABELS[e.source] ?? e.source)},{" "}
                  {t(FREQUENCY_LABELS_EN[e.frequency], FREQUENCY_LABELS[e.frequency])})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{fmtTaka(e.amount)}</span>
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
      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={labelId} className="block text-xs text-[#555] mb-1">
            {t("Label", "লেবেল")}
          </label>
          <input
            id={labelId}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            placeholder={t("e.g. Basic salary", "যেমন: মূল বেতন")}
          />
        </div>
        <div>
          <label htmlFor={sourceId} className="block text-xs text-[#555] mb-1">
            {t("Source", "উৎস")}
          </label>
          <select
            id={sourceId}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {t(INCOME_SOURCE_LABELS_EN[s], INCOME_SOURCE_LABELS[s])}
              </option>
            ))}
          </select>
        </div>
        <NumberField label={t("Amount (৳)", "পরিমাণ (৳)")} value={amount} onChange={setAmount} />
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor={frequencyId} className="block text-xs text-[#555] mb-1">
              {t("Frequency", "ফ্রিকোয়েন্সি")}
            </label>
            <select
              id={frequencyId}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {t(FREQUENCY_LABELS_EN[f], FREQUENCY_LABELS[f])}
                </option>
              ))}
            </select>
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
