"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminExtractedFigureDTO } from "./types";

function confidenceLabel(c: number): { text: string; className: string } {
  if (c >= 0.75) return { text: "high", className: "text-green-deep" };
  if (c >= 0.5) return { text: "medium", className: "text-gold" };
  return { text: "low", className: "text-red" };
}

export function AdminBankHealthDashboard({ figures }: { figures: AdminExtractedFigureDTO[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(f: AdminExtractedFigureDTO) {
    setBusy(f.id);
    const edited = editing[f.id];
    const res = await fetch(`/api/admin/bank-health/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        edited !== undefined && edited !== "" ? { numericValue: parseFloat(edited) } : {}
      ),
    });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  async function reject(f: AdminExtractedFigureDTO) {
    setBusy(f.id);
    const res = await fetch(`/api/admin/bank-health/${f.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  if (figures.length === 0) {
    return (
      <section className="bg-card border border-line p-5">
        <p className="text-sm text-muted">
          Nothing pending review. Either every extracted figure has been handled, or no
          bank has an annualReportPageUrl configured yet (see /admin/rates).
        </p>
      </section>
    );
  }

  return (
    <section className="bg-card border border-line p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="text-left">
              <th className="py-1.5 px-2 border-b-2 border-green">Bank</th>
              <th className="py-1.5 px-2 border-b-2 border-green">FY</th>
              <th className="py-1.5 px-2 border-b-2 border-green">Field</th>
              <th className="py-1.5 px-2 border-b-2 border-green">Raw match</th>
              <th className="py-1.5 px-2 border-b-2 border-green">Value</th>
              <th className="py-1.5 px-2 border-b-2 border-green">Confidence</th>
              <th className="py-1.5 px-2 border-b-2 border-green">Source</th>
              <th className="py-1.5 px-2 border-b-2 border-green">Action</th>
            </tr>
          </thead>
          <tbody>
            {figures.map((f) => {
              const conf = confidenceLabel(f.extractionConfidence);
              return (
                <tr key={f.id} className="border-b border-line align-top">
                  <td className="py-1.5 px-2">{f.bankName}</td>
                  <td className="py-1.5 px-2">{f.fiscalYear}</td>
                  <td className="py-1.5 px-2">{f.field}</td>
                  <td className="py-1.5 px-2 text-muted max-w-[220px]">{f.rawValue}</td>
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      defaultValue={f.numericValue ?? ""}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [f.id]: e.target.value }))
                      }
                      className="w-24 px-1.5 py-1 border border-line bg-[#FCFBF8] text-sm"
                    />
                  </td>
                  <td className={`py-1.5 px-2 font-medium ${conf.className}`}>
                    {conf.text} ({(f.extractionConfidence * 100).toFixed(0)}%)
                  </td>
                  <td className="py-1.5 px-2">
                    <a
                      href={f.sourceReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-green-deep"
                    >
                      PDF
                    </a>
                  </td>
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <button
                      onClick={() => approve(f)}
                      disabled={busy === f.id}
                      className="bg-green-deep text-paper px-2.5 py-1 text-xs font-medium disabled:opacity-50 mr-1.5"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(f)}
                      disabled={busy === f.id}
                      className="border border-red text-red px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
