import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time check of a caller-supplied secret against the configured one.
 * An unset/empty `expected` never matches: a bare `provided !== expected`
 * lets `undefined === undefined` pass when the env var is missing.
 */
export function adminSecretMatches(provided: unknown, expected: string | undefined): boolean {
  if (!expected) return false;
  if (typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
