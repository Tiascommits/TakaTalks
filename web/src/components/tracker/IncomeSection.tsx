"use client";

import { useState } from "react";
import { fmtTaka } from "@/lib/format";
import { FREQUENCY_LABELS, INCOME_SOURCE_LABELS, type IncomeEntryDTO, type IncomeFrequency } from "./types";

const SOURCES = Object.keys(INCOME_SOURCE_LABELS);
const FREQUENCIES: IncomeFrequency[] = ["MONTHLY", "ANNUAL", "ONE_TIME"];

export function IncomeSection({
  entries,
  onAdd,
  onDelete,
}: {
  entries: IncomeEntryDTO[];
  onAdd: (e: { label: string; source: string; amount: number; frequency: IncomeFrequency }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<IncomeFrequency>("MONTHLY");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!label || !amt) return;
    setSubmitting(true);
    await onAdd({ label, source, amount: amt, frequency });
    setLabel("");
    setAmount("");
    setSubmitting(false);
  }

  return (
    <section className="bg-card border border-line p-5">
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b-2 border-green">
        আয়ের উৎস
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-muted mb-4">এখনো কোনো আয়ের উৎস যোগ করোনি।</p>
      ) : (
        <ul className="mb-4 divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between items-center py-2 text-sm">
              <div>
                <span className="font-medium">{e.label}</span>{" "}
                <span className="text-muted text-xs">
                  ({INCOME_SOURCE_LABELS[e.source] ?? e.source}, {FREQUENCY_LABELS[e.frequency]})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{fmtTaka(e.amount)}</span>
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-red text-xs hover:underline"
                  aria-label="মুছে ফেলো"
                >
                  মুছুন
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-[#555] mb-1">লেবেল</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            placeholder="যেমন: মূল বেতন"
          />
        </div>
        <div>
          <label className="block text-xs text-[#555] mb-1">উৎস</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {INCOME_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#555] mb-1">পরিমাণ (৳)</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-[#555] mb-1">ফ্রিকোয়েন্সি</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 bg-green-deep text-paper px-3 py-2 text-sm font-medium disabled:opacity-50 self-end"
          >
            যোগ করো
          </button>
        </div>
      </form>
    </section>
  );
}
