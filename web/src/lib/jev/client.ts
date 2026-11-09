import { TypeSafeClient } from "@typesafe-ai/sdk";

/**
 * TypeSafe AI's Jev (todo/system-one-jev.md), server-side only and only on public
 * documents, never on anything a user typed. Returns null when TYPESAFE_API_KEY is
 * unset, so every caller keeps its deterministic heuristic; callers also catch API
 * errors and fall back the same way.
 */
export function jevClient(): TypeSafeClient | null {
  if (!process.env.TYPESAFE_API_KEY?.trim()) return null;
  // Crons run one bank a day under a serverless time limit: fail fast, retry once.
  return new TypeSafeClient({ timeout: 5_000, retry: { maxRetries: 1 } });
}

/** The client shape callers use, so tests can pass a stub. */
export type JevClient = Pick<TypeSafeClient, "systemOne">;
