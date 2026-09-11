/**
 * A rate is "unverified" when the most recent scrape *attempt* for its bank
 * happened after the last successful one and failed — i.e. we're still
 * serving the last known-good value, but a newer check couldn't confirm it.
 * Never used to hide the value, only to flag it (see prompt: "never
 * silently show stale data as if it's current").
 */
export function isRateStale(
  latestSnapshotAt: Date | null,
  latestLogAttemptedAt: Date | null,
  latestLogSuccess: boolean | null
): boolean {
  if (!latestSnapshotAt || !latestLogAttemptedAt || latestLogSuccess === null) return false;
  return !latestLogSuccess && latestLogAttemptedAt.getTime() > latestSnapshotAt.getTime();
}
