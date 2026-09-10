"use client";

import { useState } from "react";
import Link from "next/link";
import { TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { MaturityPanel } from "./MaturityPanel";
import { IncomeSection } from "./IncomeSection";
import { InvestmentSection } from "./InvestmentSection";
import type {
  IncomeEntryDTO,
  IncomeFrequency,
  InstrumentType,
  InvestmentEntryDTO,
  TaxProfileDTO,
  TaxpayerCategoryCode,
} from "./types";

type NewIncome = { label: string; source: string; amount: number; frequency: IncomeFrequency };
type NewInvestment = {
  label: string;
  instrumentType: InstrumentType;
  principalAmount: number;
  startDate: string;
  termMonths: number;
  expectedRatePct: number;
};

const CATEGORY_TO_CODE: Record<string, TaxpayerCategoryCode> = {
  general: "GENERAL",
  woman_senior: "WOMAN_SENIOR",
  third_gender: "THIRD_GENDER",
  disabled: "DISABLED",
  freedom_fighter: "FREEDOM_FIGHTER",
};

export function TrackerDashboard({
  initialIncome,
  initialInvestments,
  initialProfile,
}: {
  initialIncome: IncomeEntryDTO[];
  initialInvestments: InvestmentEntryDTO[];
  initialProfile: TaxProfileDTO | null;
}) {
  const [income, setIncome] = useState(initialIncome);
  const [investments, setInvestments] = useState(initialInvestments);
  const [profile, setProfile] = useState<TaxProfileDTO>(
    initialProfile ?? {
      category: "GENERAL",
      disabledChildren: 0,
      firstTimeFiler: false,
      netWealth: 0,
      multiCar: false,
      bigHouse: false,
    }
  );
  const [savingProfile, setSavingProfile] = useState(false);

  async function addIncome(e: NewIncome) {
    const res = await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
    if (res.ok) {
      const { entry } = await res.json();
      setIncome((prev) => [entry, ...prev]);
    }
  }

  async function deleteIncome(id: string) {
    const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
    if (res.ok) setIncome((prev) => prev.filter((e) => e.id !== id));
  }

  async function addInvestment(e: NewInvestment) {
    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
    if (res.ok) {
      const { entry } = await res.json();
      setInvestments((prev) => [...prev, entry].sort((a, b) => a.maturityDate.localeCompare(b.maturityDate)));
    }
  }

  async function deleteInvestment(id: string) {
    const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
    if (res.ok) setInvestments((prev) => prev.filter((e) => e.id !== id));
  }

  async function confirmPayout(id: string, payoutAmount: number) {
    const res = await fetch(`/api/investments/${id}/confirm-payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutAmount }),
    });
    if (res.ok) {
      const { entry } = await res.json();
      setInvestments((prev) => prev.map((e) => (e.id === id ? entry : e)));
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const { profile: saved } = await res.json();
      setProfile(saved);
    }
    setSavingProfile(false);
  }

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16 flex flex-col gap-5">
      <MaturityPanel entries={investments} onConfirmPayout={confirmPayout} />
      <IncomeSection entries={income} onAdd={addIncome} onDelete={deleteIncome} />
      <InvestmentSection entries={investments} onAdd={addInvestment} onDelete={deleteInvestment} />

      <section className="bg-card border border-line p-5">
        <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b-2 border-green">
          ট্যাক্স প্রোফাইল
        </h2>
        <p className="text-xs text-muted mb-3">
          এখানে সেভ করলে <Link href="/calculator" className="underline">ক্যালকুলেটর</Link> এ আবার
          টাইপ করতে হবে না।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-[#555] mb-1">Taxpayer category</label>
            <select
              value={profile.category}
              onChange={(e) =>
                setProfile({ ...profile, category: e.target.value as TaxpayerCategoryCode })
              }
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              {TAXPAYER_CATEGORIES.map((c) => (
                <option key={c.id} value={CATEGORY_TO_CODE[c.id]}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#555] mb-1">প্রতিবন্ধী সন্তান সংখ্যা</label>
            <input
              type="number"
              min={0}
              value={profile.disabledChildren}
              onChange={(e) =>
                setProfile({ ...profile, disabledChildren: parseInt(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={profile.firstTimeFiler}
              onChange={(e) => setProfile({ ...profile, firstTimeFiler: e.target.checked })}
              className="w-auto"
            />
            <label className="text-sm">প্রথমবার করদাতা</label>
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-3 bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          প্রোফাইল সেভ করো
        </button>
      </section>
    </div>
  );
}
