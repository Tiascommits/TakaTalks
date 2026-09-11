import { describe, expect, it } from "vitest";
import { isRateStale } from "./staleness";

const day = (n: number) => new Date(2026, 0, n);

describe("isRateStale", () => {
  it("is not stale when there is no snapshot yet", () => {
    expect(isRateStale(null, day(2), false)).toBe(false);
  });

  it("is not stale when there has never been a scrape attempt", () => {
    expect(isRateStale(day(1), null, null)).toBe(false);
  });

  it("is not stale when the most recent attempt succeeded", () => {
    expect(isRateStale(day(1), day(2), true)).toBe(false);
  });

  it("is stale when a newer attempt failed after the last known-good snapshot", () => {
    expect(isRateStale(day(1), day(2), false)).toBe(true);
  });

  it("is not stale when the failed attempt predates the current snapshot", () => {
    // e.g. an old failure, then a later successful manual/scrape update
    expect(isRateStale(day(5), day(2), false)).toBe(false);
  });
});
