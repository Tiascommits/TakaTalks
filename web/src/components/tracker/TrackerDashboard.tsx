"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { MaturityPanel } from "./MaturityPanel";
import { IncomeSection } from "./IncomeSection";
import { InvestmentSection } from "./InvestmentSection";
import { ReminderSignup, type ContactStatus } from "./ReminderSignup";
import { useLanguage } from "@/lib/i18n";
import { cleanNumberText } from "@/lib/format";
import { requestErrorMessage } from "@/lib/tracker/request-error";
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

type Message = { en: string; bn: string };

/** fetch that never throws: the JSON body on success, or a message saying why it failed. */
async function send<T>(url: string, init?: RequestInit): Promise<{ data: T | null; error: Message | null }> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return { data: null, error: requestErrorMessage(res.status) };
    return { data: (await res.json().catch(() => null)) as T | null, error: null };
  } catch {
    return { data: null, error: requestErrorMessage(null) };
  }
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

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
  contact,
  emailAvailable,
  whatsappAvailable,
  linked,
  linkError,
}: {
  initialIncome: IncomeEntryDTO[];
  initialInvestments: InvestmentEntryDTO[];
  initialProfile: TaxProfileDTO | null;
  contact: ContactStatus;
  emailAvailable: boolean;
  whatsappAvailable: boolean;
  linked: boolean;
  linkError: string | null;
}) {
  const { t } = useLanguage();
  const [income, setIncome] = useState(initialIncome);
  const [investments, setInvestments] = useState(initialInvestments);
  const [profile, setProfile] = useState<TaxProfileDTO>(
    initialProfile ?? {
      category: "GENERAL",
      disabledChildren: 0,
      netWealth: 0,
      multiCar: false,
      bigHouse: false,
    }
  );
  const [savingProfile, setSavingProfile] = useState(false);
  // Failures of actions that have no form of their own: delete, payout, profile.
  const [actionError, setActionError] = useState<Message | null>(null);
  const categoryId = useId();
  const disabledChildrenId = useId();

  async function addIncome(e: NewIncome): Promise<Message | null> {
    const { data, error } = await send<{ entry: IncomeEntryDTO }>("/api/income", jsonInit("POST", e));
    if (data) setIncome((prev) => [data.entry, ...prev]);
    return error;
  }

  async function deleteIncome(id: string) {
    setActionError(null);
    const { error } = await send(`/api/income/${id}`, { method: "DELETE" });
    if (error) setActionError(error);
    else setIncome((prev) => prev.filter((e) => e.id !== id));
  }

  async function addInvestment(e: NewInvestment): Promise<Message | null> {
    const { data, error } = await send<{ entry: InvestmentEntryDTO }>("/api/investments", jsonInit("POST", e));
    if (data) {
      setInvestments((prev) =>
        [...prev, data.entry].sort((a, b) => a.maturityDate.localeCompare(b.maturityDate))
      );
    }
    return error;
  }

  async function deleteInvestment(id: string) {
    setActionError(null);
    const { error } = await send(`/api/investments/${id}`, { method: "DELETE" });
    if (error) setActionError(error);
    else setInvestments((prev) => prev.filter((e) => e.id !== id));
  }

  async function confirmPayout(id: string, payoutAmount: number) {
    setActionError(null);
    const { data, error } = await send<{ entry: InvestmentEntryDTO }>(
      `/api/investments/${id}/confirm-payout`,
      jsonInit("POST", { payoutAmount })
    );
    if (error) setActionError(error);
    else if (data) setInvestments((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
  }

  async function saveProfile() {
    setActionError(null);
    setSavingProfile(true);
    const { data, error } = await send<{ profile: TaxProfileDTO }>("/api/profile", jsonInit("PUT", profile));
    if (error) setActionError(error);
    else if (data) setProfile(data.profile);
    setSavingProfile(false);
  }

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16 flex flex-col gap-5">
      {actionError && (
        <p
          role="alert"
          className="sticky top-2 z-10 flex items-start justify-between gap-3 bg-[#FFF9F9] border border-red/30 text-red text-sm px-3 py-2"
        >
          {t(actionError.en, actionError.bn)}
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label={t("Dismiss", "বন্ধ করুন")}
            className="shrink-0 px-2 -my-1 text-lg leading-none"
          >
            ×
          </button>
        </p>
      )}
      <ReminderSignup
        contact={contact}
        emailAvailable={emailAvailable}
        whatsappAvailable={whatsappAvailable}
        linked={linked}
        linkError={linkError}
      />
      <MaturityPanel entries={investments} onConfirmPayout={confirmPayout} />
      <IncomeSection entries={income} onAdd={addIncome} onDelete={deleteIncome} />
      <InvestmentSection entries={investments} onAdd={addInvestment} onDelete={deleteInvestment} />

      <section className="bg-card border border-line p-5">
        <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b-2 border-green">
          {t("Tax profile", "ট্যাক্স প্রোফাইল")}
        </h2>
        <p className="text-xs text-muted mb-3">
          {t("Saving it here means you won't have to type it again in the ", "এখানে সেভ করলে ")}
          <Link href="/calculator" className="underline">
            {t("calculator", "ক্যালকুলেটর")}
          </Link>
          {t(".", " এ আবার টাইপ করতে হবে না।")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label htmlFor={categoryId} className="block text-xs text-[#555] mb-1">
              {t("Taxpayer category", "করদাতার ক্যাটাগরি")}
            </label>
            <select
              id={categoryId}
              value={profile.category}
              onChange={(e) =>
                setProfile({ ...profile, category: e.target.value as TaxpayerCategoryCode })
              }
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            >
              {TAXPAYER_CATEGORIES.map((c) => (
                <option key={c.id} value={CATEGORY_TO_CODE[c.id]}>
                  {t(c.labelEn, c.label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={disabledChildrenId} className="block text-xs text-[#555] mb-1">
              {t("Number of disabled children", "প্রতিবন্ধী সন্তান সংখ্যা")}
            </label>
            <input
              id={disabledChildrenId}
              type="text"
              inputMode="numeric"
              value={profile.disabledChildren}
              onChange={(e) =>
                setProfile({ ...profile, disabledChildren: parseInt(cleanNumberText(e.target.value)) || 0 })
              }
              className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm"
            />
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-3 bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {t("Save profile", "প্রোফাইল সেভ করো")}
        </button>
      </section>
    </div>
  );
}
