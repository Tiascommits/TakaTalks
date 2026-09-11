"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const secretId = useId();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError("Invalid secret.");
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border border-line p-5">
      <h1 className="font-serif font-semibold text-lg text-green-deep mb-3">Admin sign-in</h1>
      <label htmlFor={secretId} className="block text-xs text-[#555] mb-1">
        Admin secret
      </label>
      <input
        id={secretId}
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
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
