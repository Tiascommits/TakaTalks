"use client";

import { useState } from "react";
import { fmtTaka } from "@/lib/format";
import { daysUntil } from "@/lib/tracker/derive";
import { INSTRUMENT_LABELS, INSTRUMENT_LABELS_EN, type InvestmentEntryDTO } from "./types";
import { useLanguage } from "@/lib/i18n";

export function MaturityPanel({
  entries,
  onConfirmPayout,
}: {
  entries: InvestmentEntryDTO[];
  onConfirmPayout: (id: string, payoutAmount: number) => Promise<void>;
}) {
  const { t } = useLanguage();
  const upcoming = entries
    .filter((e) => !e.payoutConfirmed && daysUntil(e.maturityDate) >= 0 && daysUntil(e.maturityDate) <= 90)
    .sort((a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime());

  const matured = entries.filter((e) => !e.payoutConfirmed && daysUntil(e.maturityDate) < 0);

  const reinvestableCash = entries
    .filter((e) => e.payoutConfirmed)
    .reduce((sum, e) => sum + (e.payoutAmount ?? 0), 0);

  if (entries.length === 0) return null;

  return (
    <section className="bg-card border border-line p-5">
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b-2 border-green">
        {t("Maturity dashboard", "মেয়াদপূর্তি ড্যাশবোর্ড")}
      </h2>

      {reinvestableCash > 0 && (
        <div className="bg-[#EFF6F1] border border-green px-3.5 py-3 mb-3.5 text-sm">
          <span className="font-mono font-bold text-green-deep">{fmtTaka(reinvestableCash)}</span>{" "}
          {t("reinvestable cash (from confirmed payouts)", "পুনঃবিনিয়োগযোগ্য নগদ (নিশ্চিত হওয়া পেমেন্ট থেকে)")}
        </div>
      )}

      {matured.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-red mb-2">{t("Matured, confirm payout:", "মেয়াদ শেষ, পেমেন্ট নিশ্চিত করো:")}</p>
          <ul className="space-y-2">
            {matured.map((e) => (
              <MaturedRow key={e.id} entry={e} onConfirmPayout={onConfirmPayout} />
            ))}
          </ul>
        </div>
      )}

      {upcoming.length > 0 ? (
        <ul className="divide-y divide-line">
          {upcoming.map((e) => {
            const days = daysUntil(e.maturityDate);
            return (
              <li key={e.id} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <span className="font-medium">{e.label}</span>{" "}
                  <span className="text-muted text-xs">({t(INSTRUMENT_LABELS_EN[e.instrumentType], INSTRUMENT_LABELS[e.instrumentType])})</span>
                </div>
                <div className="text-right">
                  <div className="font-mono">{fmtTaka(e.principalAmount)}</div>
                  <div className="text-[11px] text-muted">{t(`${days} days left`, `${days} দিন বাকি`)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        matured.length === 0 && (
          <p className="text-sm text-muted">
            {t("No investments are maturing in the next 90 days.", "সামনের ৯০ দিনে কোনো বিনিয়োগের মেয়াদ শেষ হচ্ছে না।")}
          </p>
        )
      )}
    </section>
  );
}

function MaturedRow({
  entry,
  onConfirmPayout,
}: {
  entry: InvestmentEntryDTO;
  onConfirmPayout: (id: string, payoutAmount: number) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(String(entry.principalAmount));
  const [submitting, setSubmitting] = useState(false);

  return (
    <li className="flex flex-wrap items-center gap-2 bg-[#FBEFEF] border border-red px-3 py-2 text-sm">
      <span className="font-medium">{entry.label}</span>
      <span className="text-xs text-muted">({t(INSTRUMENT_LABELS_EN[entry.instrumentType], INSTRUMENT_LABELS[entry.instrumentType])})</span>
      <div className="ml-auto flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 px-2 py-1 border border-line bg-[#FCFBF8] text-sm"
        />
        <button
          disabled={submitting}
          onClick={async () => {
            const amt = parseFloat(amount);
            if (!amt) return;
            setSubmitting(true);
            await onConfirmPayout(entry.id, amt);
            setSubmitting(false);
          }}
          className="bg-green-deep text-paper px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {t("Confirm payout", "পেমেন্ট নিশ্চিত করো")}
        </button>
      </div>
    </li>
  );
}
