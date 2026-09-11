"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

/** One-time: creates the first named AdminUser, replacing the shared ADMIN_SECRET as ongoing auth. */
export function AdminSetupForm() {
  const secretId = useId();
  const emailId = useId();
  const passwordId = useId();
  const router = useRouter();

  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/rates");
      router.refresh();
    } else {
      setError((await res.json().catch(() => null))?.error ?? "Setup failed");
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border border-line p-5">
      <h1 className="font-serif font-semibold text-lg text-green-deep mb-1">Create the first admin account</h1>
      <p className="text-xs text-muted mb-3">
        Requires the ADMIN_SECRET env var — this form only works once, before any admin
        account exists.
      </p>
      <label htmlFor={secretId} className="block text-xs text-[#555] mb-1">
        ADMIN_SECRET
      </label>
      <input
        id={secretId}
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm mb-3"
      />
      <label htmlFor={emailId} className="block text-xs text-[#555] mb-1">
        Your email
      </label>
      <input
        id={emailId}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm mb-3"
      />
      <label htmlFor={passwordId} className="block text-xs text-[#555] mb-1">
        Password (min 10 characters)
      </label>
      <input
        id={passwordId}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm mb-3"
      />
      {error && <p className="text-red text-xs mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-green-deep text-paper px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Create account
      </button>
    </form>
  );
}
