/**
 * Which phone/email a verification guess is aimed at, or null for a bare
 * magic-link token.
 *
 * Phone OTPs are stored destination-scoped as `"<phone>:<code>"`, and the verify
 * route accepts that whole string as `token` without a separate `destination`.
 * Counting attempts per raw input would give every guess its own bucket and
 * never throttle, so all guesses for one phone must resolve to the same value:
 * the `destination` field, or the prefix of a scoped token.
 *
 * Email magic-link tokens are 256 random bits with no `:`; guessing one is
 * infeasible, so they need no per-destination budget (null).
 */
export function attemptDestination(tokenOrCode: string, destination?: string): string | null {
  const dest = destination?.trim();
  if (dest) return dest.toLowerCase();

  const input = tokenOrCode.trim();
  const sep = input.lastIndexOf(":");
  if (sep > 0) return input.slice(0, sep).trim().toLowerCase();

  return null;
}
