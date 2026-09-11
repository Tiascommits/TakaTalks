"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/lib/i18n";

export type ContactStatus = {
  email: string | null;
  emailVerifiedAt: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
} | null;

type Step = "idle" | "choose" | "enter-email" | "enter-phone" | "enter-code" | "sent-email" | "done";

/**
 * The one place an account gets created (see
 * docs/feature-spec-tax-calculator.md: "account only appears at the one
 * moment it's actually needed"). Only offers a channel that's actually
 * deliverable — emailAvailable/whatsappAvailable reflect server config, not
 * just user preference, matching the "not available, never guessed" pattern
 * used on the rate scorecard.
 */
export function ReminderSignup({
  contact,
  emailAvailable,
  whatsappAvailable,
  linked,
  linkError,
}: {
  contact: ContactStatus;
  emailAvailable: boolean;
  whatsappAvailable: boolean;
  linked: boolean;
  linkError: string | null;
}) {
  const { t } = useLanguage();
  const emailId = useId();
  const phoneId = useId();
  const codeId = useId();

  const alreadyOn = Boolean(contact?.emailVerifiedAt || contact?.phoneVerifiedAt);
  const [step, setStep] = useState<Step>("idle");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!emailAvailable && !whatsappAvailable) return null; // nothing deliverable yet, don't offer it

  if (alreadyOn || step === "done" || linked) {
    return (
      <div className="bg-[#EFF6F1] border border-green px-3.5 py-2.5 text-xs text-green-deep">
        {t(
          "Maturity reminders are on" +
            (contact?.email ? ` (email: ${contact.email})` : "") +
            (contact?.phone ? ` (WhatsApp: ${contact.phone})` : ""),
          "মেয়াদপূর্তি reminder চালু আছে" +
            (contact?.email ? ` (email: ${contact.email})` : "") +
            (contact?.phone ? ` (WhatsApp: ${contact.phone})` : "")
        )}
      </div>
    );
  }

  async function submitEmail() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/account/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "EMAIL", destination }),
    });
    setSubmitting(false);
    if (res.ok) setStep("sent-email");
    else setError((await res.json().catch(() => null))?.error ?? "failed");
  }

  async function submitPhone() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/account/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "PHONE", destination }),
    });
    setSubmitting(false);
    if (res.ok) setStep("enter-code");
    else setError((await res.json().catch(() => null))?.error ?? "failed");
  }

  async function submitCode() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/account/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setSubmitting(false);
    if (res.ok) setStep("done");
    else setError((await res.json().catch(() => null))?.error ?? "failed");
  }

  return (
    <div className="bg-card border border-line px-3.5 py-3 text-sm">
      {linkError && (
        <p className="text-xs text-red mb-2">
          {t("That link didn't work, try again.", "সেই লিংকটা কাজ করেনি, আবার চেষ্টা করো।")}
        </p>
      )}

      {step === "idle" && (
        <button
          onClick={() => setStep("choose")}
          className="text-green-deep underline text-xs font-medium"
        >
          {t("Get notified when an investment matures", "বিনিয়োগের মেয়াদ শেষ হলে জানাও")}
        </button>
      )}

      {step === "choose" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            {t(
              "We'll need to save this one detail so we can reach you.",
              "তোমাকে জানানোর জন্য এই একটা তথ্য save করতে হবে।"
            )}
          </p>
          <div className="flex gap-2">
            {emailAvailable && (
              <button
                onClick={() => setStep("enter-email")}
                className="bg-green-deep text-paper px-3 py-1.5 text-xs font-medium"
              >
                {t("Email me", "Email এ জানাও")}
              </button>
            )}
            {whatsappAvailable && (
              <button
                onClick={() => setStep("enter-phone")}
                className="border border-green-deep text-green-deep px-3 py-1.5 text-xs font-medium"
              >
                {t("WhatsApp me", "WhatsApp এ জানাও")}
              </button>
            )}
          </div>
        </div>
      )}

      {step === "enter-email" && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={emailId} className="sr-only">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            placeholder="you@example.com"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="px-2.5 py-1.5 border border-line bg-[#FCFBF8] text-sm"
          />
          <button
            onClick={submitEmail}
            disabled={submitting || !destination}
            className="bg-green-deep text-paper px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {t("Send link", "লিংক পাঠাও")}
          </button>
        </div>
      )}

      {step === "enter-phone" && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={phoneId} className="sr-only">
            Phone
          </label>
          <input
            id={phoneId}
            type="tel"
            placeholder="+8801XXXXXXXXX"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="px-2.5 py-1.5 border border-line bg-[#FCFBF8] text-sm"
          />
          <button
            onClick={submitPhone}
            disabled={submitting || !destination}
            className="bg-green-deep text-paper px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {t("Send code", "কোড পাঠাও")}
          </button>
        </div>
      )}

      {step === "enter-code" && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={codeId} className="sr-only">
            Code
          </label>
          <input
            id={codeId}
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="px-2.5 py-1.5 border border-line bg-[#FCFBF8] text-sm w-28"
          />
          <button
            onClick={submitCode}
            disabled={submitting || code.length < 4}
            className="bg-green-deep text-paper px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {t("Confirm", "নিশ্চিত করো")}
          </button>
        </div>
      )}

      {step === "sent-email" && (
        <p className="text-xs text-green-deep">
          {t(
            `Check ${destination} for a login link.`,
            `${destination} এ পাঠানো লিংকটা দেখো।`
          )}
        </p>
      )}

      {error && <p className="text-xs text-red mt-1.5">{error}</p>}
    </div>
  );
}
