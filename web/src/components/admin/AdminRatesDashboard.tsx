"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBankDTO, AdminBBAggregateDTO, AdminDigestDTO } from "./types";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminRatesDashboard({
  banks,
  digest,
  bbAggregates,
}: {
  banks: AdminBankDTO[];
  digest: AdminDigestDTO;
  bbAggregates: AdminBBAggregateDTO[];
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  async function runScrape() {
    setRunning(true);
    setRunResult(null);
    const res = await fetch("/api/admin/rates/run-scrape", { method: "POST" });
    if (res.ok) {
      const { summary } = await res.json();
      setRunResult(
        `Attempted ${summary.attempted} bank(s): ${summary.succeeded} succeeded, ${summary.failed} failed. ` +
          `${summary.skippedNoAdapter.length} bank(s) have no adapter configured yet: ${
            summary.skippedNoAdapter.join(", ") || "none"
          }.`
      );
      router.refresh();
    } else {
      setRunResult("Run failed to start — check server logs.");
    }
    setRunning(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-card border border-line p-5">
        <h2 className="font-serif font-semibold text-lg text-green-deep mb-3">
          Daily digest (today, in-app — no email wired up yet)
        </h2>

        {digest.failedAdapters.length === 0 &&
        digest.unconfiguredBanks.length === 0 &&
        digest.changedRates.length === 0 ? (
          <p className="text-sm text-muted">Nothing to flag.</p>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            {digest.failedAdapters.length > 0 && (
              <div>
                <p className="font-semibold text-red mb-1">Failed adapters</p>
                <ul className="list-disc pl-5">
                  {digest.failedAdapters.map((f) => (
                    <li key={f.shortCode}>
                      {f.name} — {f.errorMessage ?? "unknown error"} ({fmtDateTime(f.attemptedAt)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {digest.changedRates.length > 0 && (
              <div>
                <p className="font-semibold text-gold mb-1">Significant rate changes</p>
                <ul className="list-disc pl-5">
                  {digest.changedRates.map((c, i) => (
                    <li key={`${c.shortCode}-${c.instrument}-${c.termMonths}-${i}`}>
                      {c.name} {c.instrument} {c.termMonths}mo: {c.previousPct.toFixed(2)}% →{" "}
                      {c.currentPct.toFixed(2)}% ({c.deltaPct > 0 ? "+" : ""}
                      {c.deltaPct.toFixed(2)}pp)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {digest.unconfiguredBanks.length > 0 && (
              <div>
                <p className="font-semibold text-muted mb-1">No adapter configured (never scraped)</p>
                <ul className="list-disc pl-5">
                  {digest.unconfiguredBanks.map((b) => (
                    <li key={b.shortCode}>{b.name} — needs rate-card page verified before an adapter can be built</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={runScrape}
          disabled={running}
          className="mt-4 bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {running ? "Running…" : "Run scrape now"}
        </button>
        {runResult && <p className="text-xs text-muted mt-2">{runResult}</p>}
      </section>

      <section className="bg-card border border-line p-5">
        <h2 className="font-serif font-semibold text-lg text-green-deep mb-3">Banks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left">
                <th className="py-1.5 px-2 border-b-2 border-green">Bank</th>
                <th className="py-1.5 px-2 border-b-2 border-green">Type</th>
                <th className="py-1.5 px-2 border-b-2 border-green">Adapter</th>
                <th className="py-1.5 px-2 border-b-2 border-green">Last scrape</th>
                <th className="py-1.5 px-2 border-b-2 border-green">Last rate snapshot</th>
              </tr>
            </thead>
            <tbody>
              {banks.map((b) => (
                <tr key={b.id} className="border-b border-line">
                  <td className="py-1.5 px-2">{b.name}</td>
                  <td className="py-1.5 px-2 text-muted">{b.type}</td>
                  <td className="py-1.5 px-2">
                    {b.hasAdapter ? "manual-seed" : <span className="text-muted">none configured</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {b.lastLog ? (
                      <span className={b.lastLog.success ? "text-green-deep" : "text-red"}>
                        {b.lastLog.success ? "ok" : "failed"} — {fmtDateTime(b.lastLog.attemptedAt)}
                      </span>
                    ) : (
                      <span className="text-muted">never</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2">{fmtDateTime(b.lastSnapshotAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <BankProfileEditor banks={banks} onSaved={() => router.refresh()} />
      <BBAggregateForm recent={bbAggregates} onSaved={() => router.refresh()} />
    </div>
  );
}

function BankProfileEditor({
  banks,
  onSaved,
}: {
  banks: AdminBankDTO[];
  onSaved: () => void;
}) {
  const bankSelectId = useId();
  const ratingId = useId();
  const agencyId = useId();
  const ratingDateId = useId();
  const statementId = useId();

  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const selected = banks.find((b) => b.id === bankId) ?? null;

  const [creditRating, setCreditRating] = useState(selected?.creditRating ?? "");
  const [ratingAgency, setRatingAgency] = useState(selected?.ratingAgency ?? "");
  const [ratingDate, setRatingDate] = useState(selected?.ratingDate?.slice(0, 10) ?? "");
  const [statementUrl, setStatementUrl] = useState(selected?.statementUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function selectBank(id: string) {
    setBankId(id);
    const b = banks.find((x) => x.id === id) ?? null;
    setCreditRating(b?.creditRating ?? "");
    setRatingAgency(b?.ratingAgency ?? "");
    setRatingDate(b?.ratingDate?.slice(0, 10) ?? "");
    setStatementUrl(b?.statementUrl ?? "");
    setSaved(false);
  }

  async function save() {
    if (!bankId) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/banks/${bankId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creditRating: creditRating || null,
        ratingAgency: ratingAgency || null,
        ratingDate: ratingDate || null,
        statementUrl: statementUrl || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved();
    }
  }

  return (
    <section className="bg-card border border-line p-5">
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-1">
        Bank profile — credit rating / statement link
      </h2>
      <p className="text-xs text-muted mb-3">
        Manual entry only — never guessed. Leave blank to show &quot;not available&quot; on the
        scorecard.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={bankSelectId} className="block text-xs text-[#555] mb-1">
            Bank
          </label>
          <select
            id={bankSelectId}
            value={bankId}
            onChange={(e) => selectBank(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          >
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ratingId} className="block text-xs text-[#555] mb-1">
            Credit rating (letter grade)
          </label>
          <input
            id={ratingId}
            value={creditRating}
            onChange={(e) => setCreditRating(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={agencyId} className="block text-xs text-[#555] mb-1">
            Rating agency
          </label>
          <input
            id={agencyId}
            value={ratingAgency}
            onChange={(e) => setRatingAgency(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={ratingDateId} className="block text-xs text-[#555] mb-1">
            Rating date
          </label>
          <input
            id={ratingDateId}
            type="date"
            value={ratingDate}
            onChange={(e) => setRatingDate(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={statementId} className="block text-xs text-[#555] mb-1">
            Latest published financial statement URL
          </label>
          <input
            id={statementId}
            value={statementUrl}
            onChange={(e) => setStatementUrl(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving || !bankId}
        className="mt-3 bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save bank profile"}
      </button>
      {saved && <span className="ml-3 text-xs text-green-deep">Saved.</span>}
    </section>
  );
}

function BBAggregateForm({
  recent,
  onSaved,
}: {
  recent: AdminBBAggregateDTO[];
  onSaved: () => void;
}) {
  const labelId = useId();
  const rateId = useId();
  const periodId = useId();
  const sourceId = useId();

  const [label, setLabel] = useState("Weighted average deposit rate");
  const [ratePct, setRatePct] = useState(0);
  const [periodLabel, setPeriodLabel] = useState("");
  const [source, setSource] = useState("Bangladesh Bank (bb.org.bd)");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/rates/bb-aggregate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, ratePct, periodLabel, source }),
    });
    setSaving(false);
    if (res.ok) {
      setPeriodLabel("");
      onSaved();
    }
  }

  return (
    <section className="bg-card border border-line p-5">
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-1">
        Bangladesh Bank aggregate cross-check
      </h2>
      <p className="text-xs text-muted mb-3">
        Manual entry for now (module 3&apos;s secondary cross-check). Shown on the scorecard,
        clearly labeled as an official aggregate, not a specific product rate.
      </p>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor={labelId} className="block text-xs text-[#555] mb-1">
            Label
          </label>
          <input
            id={labelId}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={rateId} className="block text-xs text-[#555] mb-1">
            Rate (%)
          </label>
          <input
            id={rateId}
            type="number"
            step="0.01"
            value={ratePct}
            onChange={(e) => setRatePct(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={periodId} className="block text-xs text-[#555] mb-1">
            Period (e.g. Aug 2026)
          </label>
          <input
            id={periodId}
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <div>
          <label htmlFor={sourceId} className="block text-xs text-[#555] mb-1">
            Source
          </label>
          <input
            id={sourceId}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !periodLabel}
          className="sm:col-span-4 bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50 w-fit"
        >
          {saving ? "Saving…" : "Add entry"}
        </button>
      </form>
      {recent.length > 0 && (
        <ul className="mt-3 text-xs text-muted list-disc pl-5">
          {recent.map((r) => (
            <li key={r.id}>
              {r.periodLabel}: {r.label} — {r.ratePct.toFixed(2)}% ({r.source})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
