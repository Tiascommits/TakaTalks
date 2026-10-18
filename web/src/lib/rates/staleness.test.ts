import { describe, expect, it } from "vitest";
import { BB_DEPOSIT_CHART_URL } from "@/config/rate-monitoring";
import { isChartOverdue, isRateStale } from "./staleness";

const day = (n: number) => new Date(2026, 0, n);
// The day after the last attempt: within the daily cron's window.
const NOW = day(3);

describe("isRateStale", () => {
  it("is not stale when there is no snapshot yet", () => {
    expect(isRateStale(null, day(2), false, NOW)).toBe(false);
  });

  it("is not stale when there has never been a scrape attempt", () => {
    expect(isRateStale(day(1), null, null, NOW)).toBe(false);
  });

  it("is not stale when the most recent attempt succeeded", () => {
    expect(isRateStale(day(1), day(2), true, NOW)).toBe(false);
  });

  it("is stale when a newer attempt failed after the last known-good snapshot", () => {
    expect(isRateStale(day(1), day(2), false, NOW)).toBe(true);
  });

  it("is not stale when the failed attempt predates the current snapshot", () => {
    // e.g. an old failure, then a later successful manual/scrape update
    expect(isRateStale(day(5), day(2), false, day(5))).toBe(false);
  });

  it("is stale when no scrape has even been attempted for over two days (the cron stopped)", () => {
    expect(isRateStale(day(1), day(2), true, day(5))).toBe(true);
  });
});

describe("isChartOverdue", () => {
  const sep = new Date("2026-09-01T12:00:00Z");
  it("flags a chart older than the grace period, only for the chart source", () => {
    expect(isChartOverdue(BB_DEPOSIT_CHART_URL, sep, new Date("2026-10-30T00:00:00Z"))).toBe(false);
    expect(isChartOverdue(BB_DEPOSIT_CHART_URL, sep, new Date("2026-11-05T00:00:00Z"))).toBe(true);
    expect(isChartOverdue("https://abbl.com", sep, new Date("2027-01-01T00:00:00Z"))).toBe(false);
  });
});
