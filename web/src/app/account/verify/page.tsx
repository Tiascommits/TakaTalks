"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    !token ? "Missing or invalid verification link. Please request a new link from the Tracker." : null
  );

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
        if (data?.error === "already_used") {
          setError("This link has already been used. Please request a new link from the Tracker.");
        } else if (data?.error === "expired") {
          setError("This link has expired. Magic links are valid for 15 minutes.");
        } else {
          setError("Verification failed. Please check your link or request a new one.");
        }
        setLoading(false);
        return;
      }

      // Success: redirect to tracker with confirmation badge
      router.push("/tracker?linked=1");
    } catch {
      setError("Network error. Please try again or check your internet connection.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
        🔐
      </div>

      <h1 className="text-xl font-semibold text-slate-100 mb-2">
        Confirm Your TakaTalks Login
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        Click below to verify your email address and activate your maturity reminders.
      </p>

      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm mb-6 text-left">
          {error}
          <div className="mt-3">
            <Link
              href="/tracker"
              className="text-xs font-semibold text-rose-300 hover:text-rose-200 underline"
            >
              ← Back to Tracker
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={loading || !token}
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          {loading ? "Verifying..." : "Confirm & Continue to Tracker →"}
        </button>
      )}

      <p className="text-xs text-slate-400 mt-6">
        Calculations and data stay on your device. Only email and maturity dates are securely synchronized.
      </p>
    </div>
  );
}

export default function AccountVerifyPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm animate-pulse">
            Loading verification details...
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </main>
  );
}
