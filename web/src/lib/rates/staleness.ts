import { MAX_HOURS_WITHOUT_SCRAPE } from "@/config/rate-monitoring";

/**
 * A rate is "unverified" when the most recent scrape *attempt* for its bank
 * happened after the last successful one and failed — i.e. we're still
 * serving the last known-good value, but a newer check couldn't confirm it —
 * or when no attempt has run at all for MAX_HOURS_WITHOUT_SCRAPE (the cron
 * stopped). Never used to hide the value, only to flag it (see prompt:
 * "never silently show stale data as if it's current").
 */
export function isRateStale(
  latestSnapshotAt: Date | null,
  latestLogAttemptedAt: Date | null,
  latestLogSuccess: boolean | null,
  now: Date = new Date()
): boolean {
  if (!latestSnapshotAt || !latestLogAttemptedAt || latestLogSuccess === null) return false;
  const lastChecked = Math.max(latestLogAttemptedAt.getTime(), latestSnapshotAt.getTime());
  if (now.getTime() - lastChecked > MAX_HOURS_WITHOUT_SCRAPE * 3_600_000) return true;
  return !latestLogSuccess && latestLogAttemptedAt.getTime() > latestSnapshotAt.getTime();
}
