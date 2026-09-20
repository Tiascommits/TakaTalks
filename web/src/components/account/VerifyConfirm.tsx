"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// Kept as a code (not a translated string) so the message follows the language toggle.
type VerifyError = "missing" | "already_used" | "expired" | "too_many_attempts" | "failed" | "network";

function VerifyContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<VerifyError | null>(!token ? "missing" : null);
  // Masked email this link will sign in (from the preview endpoint); null until known or if unavailable.
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/account/verify/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.destination === "string") setTarget(data.destination);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  const messages: Record<VerifyError, string> = {
    missing: t(
      "Missing or invalid verification link. Please request a new link from the Tracker.",
      "ভেরিফিকেশন লিংকটি নেই বা ঠিক নেই। ট্র্যাকার থেকে নতুন লিংক চেয়ে নাও।"
    ),
    already_used: t(
      "This link has already been used. Please request a new link from the Tracker.",
      "এই লিংকটি আগেই ব্যবহার করা হয়েছে। ট্র্যাকার থেকে নতুন লিংক চেয়ে নাও।"
    ),
    expired: t(
      "This link has expired. Magic links are valid for 15 minutes.",
      "এই লিংকের মেয়াদ শেষ। ম্যাজিক লিংক ১৫ মিনিট পর্যন্ত কাজ করে।"
    ),
    too_many_attempts: t(
      "Too many attempts. Please wait a while and try again.",
      "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করো।"
    ),
    failed: t(
      "Verification failed. Please check your link or request a new one.",
      "ভেরিফাই করা যায়নি। লিংকটি ঠিক আছে কিনা দেখো, অথবা নতুন লিংক চেয়ে নাও।"
    ),
    network: t(
      "Network error. Please try again or check your internet connection.",
      "নেটওয়ার্কে সমস্যা হয়েছে। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করো।"
    ),
  };

  async function handleConfirm() {
    if (!token || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === "already_used") setError("already_used");
        else if (data?.error === "expired") setError("expired");
        else if (data?.error === "too_many_attempts") setError("too_many_attempts");
        else setError("failed");
        setLoading(false);
        return;
      }

      // Success: redirect to tracker with confirmation badge
      router.push("/tracker?linked=1");
    } catch {
      setError("network");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
        🔐
      </div>

      <h1 className="text-xl font-semibold text-slate-100 mb-2">
        {t("Confirm Your TakaTalks Login", "তোমার TakaTalks লগইন নিশ্চিত করো")}
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        {t(
          "Click below to verify your email address and activate your maturity reminders.",
          "ইমেইল ভেরিফাই করে মেয়াদ পূর্তির রিমাইন্ডার চালু করতে নিচের বাটনে ক্লিক করো।"
        )}
      </p>

      {target && !error && (
        <p className="text-sm text-slate-200 mb-6" data-testid="verify-target">
          {t("You're confirming the login for", "তুমি এই লগইনটি নিশ্চিত করছ:")}{" "}
          <span className="font-semibold text-emerald-300">{target}</span>
          {". "}
          {t(
            "If that isn't your email, don't continue — just close this page.",
            "এটা তোমার ইমেইল না হলে এগিয়ো না — এই পেজ বন্ধ করে দাও।"
          )}
        </p>
      )}

      {error ? (
        <div
          role="alert"
          className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm mb-6 text-left"
        >
          {messages[error]}
          <div className="mt-3">
            <Link
              href="/tracker"
              className="text-xs font-semibold text-rose-300 hover:text-rose-200 underline"
            >
              {t("← Back to Tracker", "← ট্র্যাকারে ফিরে যাও")}
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={loading || !token}
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          {loading
            ? t("Verifying...", "ভেরিফাই হচ্ছে...")
            : t("Confirm & Continue to Tracker →", "নিশ্চিত করো ও ট্র্যাকারে যাও →")}
        </button>
      )}

      <p className="text-xs text-slate-400 mt-6">
        {t(
          "Calculations and data stay on your device. Only email and maturity dates are securely synchronized.",
          "হিসাব ও ডেটা তোমার ডিভাইসেই থাকে। শুধু ইমেইল আর মেয়াদ পূর্তির তারিখ নিরাপদে সিঙ্ক হয়।"
        )}
      </p>
    </div>
  );
}

function LoadingFallback() {
  const { t } = useLanguage();
  return (
    <div className="text-slate-400 text-sm animate-pulse">
      {t("Loading verification details...", "ভেরিফিকেশনের তথ্য লোড হচ্ছে...")}
    </div>
  );
}

export function VerifyConfirm() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
