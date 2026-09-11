"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border border-line p-5">
      <h1 className="font-serif font-semibold text-lg text-green-deep mb-3">Admin sign-in</h1>
      <label htmlFor={emailId} className="block text-xs text-[#555] mb-1">
        Email
      </label>
      <input
        id={emailId}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm mb-3"
      />
      <label htmlFor={passwordId} className="block text-xs text-[#555] mb-1">
        Password
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
        Sign in
      </button>
    </form>
  );
}
