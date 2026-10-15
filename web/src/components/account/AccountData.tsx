"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type Saved = { income: number; investments: number; taxProfile: boolean; contact: string[] } | null;

export function AccountData({ saved }: { saved: Saved }) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"idle" | "confirm" | "deleting" | "done" | "error">("idle");

  async function deleteEverything() {
    setStep("deleting");
    const res = await fetch("/api/account", { method: "DELETE" }).catch(() => null);
    setStep(res?.ok ? "done" : "error");
  }

  const nothingSaved = !saved || step === "done";

  return (
    <section className="bg-card border border-line p-5">
      <h1 className="font-serif font-semibold text-2xl text-green-deep mb-3 pb-2 border-b-2 border-green">
        {t("Your account and data", "আপনার অ্যাকাউন্ট ও ডেটা")}
      </h1>

      {step === "done" && (
        <p role="status" className="text-sm mb-3">
          {t("Your data has been deleted.", "আপনার ডেটা মুছে ফেলা হয়েছে।")}
        </p>
      )}

      {nothingSaved ? (
        <p className="text-sm text-muted">
          {t("Nothing is saved for this browser. ", "এই ব্রাউজারের জন্য কিছু সেভ করা নেই। ")}
          <Link href="/tracker" className="underline text-green-deep">
            {t("Go to the tracker", "ট্র্যাকারে যান")}
          </Link>
        </p>
      ) : (
        <>
          <p className="text-sm mb-2">{t("Saved on our server for this browser:", "এই ব্রাউজারের জন্য আমাদের সার্ভারে সেভ আছে:")}</p>
          <ul className="text-sm list-disc pl-5 mb-5" data-testid="saved-summary">
            <li>{t(`Income entries: ${saved.income}`, `আয়ের এন্ট্রি: ${saved.income}`)}</li>
            <li>{t(`Investments: ${saved.investments}`, `বিনিয়োগ: ${saved.investments}`)}</li>
            <li>{saved.taxProfile ? t("Tax profile: saved", "ট্যাক্স প্রোফাইল: সেভ আছে") : t("Tax profile: none", "ট্যাক্স প্রোফাইল: নেই")}</li>
            {saved.contact.map((c) => (
              <li key={c}>{t(`For reminders: ${c}`, `রিমাইন্ডারের জন্য: ${c}`)}</li>
            ))}
          </ul>

          <h2 className="font-serif font-semibold text-lg text-green-deep mb-2">{t("Delete my data", "আমার ডেটা মুছে ফেলুন")}</h2>
          <p className="text-sm text-muted mb-3">
            {t(
              "This permanently deletes your income and investment entries, tax profile, reminders and email or phone from our server, and signs out every browser linked to this account. It can't be undone.",
              "এটা আমাদের সার্ভার থেকে আপনার আয় ও বিনিয়োগের এন্ট্রি, ট্যাক্স প্রোফাইল, রিমাইন্ডার আর ইমেইল বা ফোন নম্বর স্থায়ীভাবে মুছে দেবে, আর এই অ্যাকাউন্টে যুক্ত সব ব্রাউজার থেকে সাইন আউট করবে। এটা ফেরানো যাবে না।"
            )}
          </p>

          {step === "idle" || step === "error" ? (
            <button onClick={() => setStep("confirm")} className="border border-red text-red px-4 py-2 text-sm font-medium">
              {t("Delete my data", "আমার ডেটা মুছে ফেলুন")}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">{t("Delete everything?", "সব মুছে ফেলবে?")}</span>
              <button
                onClick={deleteEverything}
                disabled={step === "deleting"}
                className="bg-red text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {t("Yes, delete everything", "হ্যাঁ, সব মুছে ফেলুন")}
              </button>
              <button onClick={() => setStep("idle")} disabled={step === "deleting"} className="text-sm text-muted hover:underline">
                {t("Cancel", "বাতিল")}
              </button>
            </div>
          )}

          {step === "error" && (
            <p role="alert" className="text-xs text-red mt-2">
              {t("Couldn't delete. Please try again.", "মুছে ফেলা যায়নি। আবার চেষ্টা করুন।")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
