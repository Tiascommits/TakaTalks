import { describe, expect, it } from "vitest";
import {
  boxChallengeTotal,
  decodeBits,
  encodeBits,
  fmtDuration,
  fmtMonthFromNow,
  fmtPct,
  fmtTakaShort,
  freedomNumber,
  monthsToGoal,
  monthsToPayoff,
  progress,
  purchasingPower,
  realReturnPct,
} from "./math";

describe("viz maths", () => {
  it("clamps progress and survives a zero target", () => {
    expect(progress(50, 100)).toBe(0.5);
    expect(progress(500, 100)).toBe(1);
    expect(progress(10, 0)).toBe(0);
  });

  it("counts months to a goal without and with returns", () => {
    expect(monthsToGoal(100_000, 0, 10_000)).toBe(10);
    expect(monthsToGoal(100_000, 100_000, 0)).toBe(0);
    expect(monthsToGoal(100_000, 0, 0)).toBeNull();
    // Growth can only shorten the wait.
    expect(monthsToGoal(1_000_000, 0, 10_000, 10)!).toBeLessThan(100);
  });

  it("computes real return and the freedom number", () => {
    expect(realReturnPct(10, 10)).toBeCloseTo(0, 10);
    expect(realReturnPct(12, 8)).toBeCloseTo(3.7037, 3);
    expect(freedomNumber(50_000, 4)).toBe(15_000_000);
    expect(freedomNumber(50_000, 0)).toBe(0);
  });

  it("shrinks purchasing power with inflation", () => {
    expect(purchasingPower(100_000, 10, 1)).toBeCloseTo(90_909.09, 1);
  });

  it("amortizes a loan and spots an EMI that never clears it", () => {
    expect(monthsToPayoff(120_000, 0, 10_000)).toBe(12);
    expect(monthsToPayoff(1_000_000, 12, 10_000)).toBeNull(); // interest alone is 10k
    const m = monthsToPayoff(1_000_000, 12, 22_244)!; // ≈ 5-year EMI
    expect(m).toBeGreaterThanOrEqual(59);
    expect(m).toBeLessThanOrEqual(61);
  });

  it("totals the 100-box challenge", () => {
    expect(boxChallengeTotal(100, 100)).toBe(505_000);
  });

  it("round-trips ticked boxes through the URL encoding", () => {
    const ticked = new Set([0, 1, 19, 20, 55, 99]);
    expect([...decodeBits(encodeBits(ticked, 100), 100)].sort((a, b) => a - b)).toEqual([0, 1, 19, 20, 55, 99]);
    expect(decodeBits("", 100).size).toBe(0);
    expect(decodeBits("garbage!", 100).size).toBe(0);
  });

  it("formats for posters in both languages", () => {
    expect(fmtTakaShort(2_500_000, "en")).toBe("৳25 lakh");
    expect(fmtTakaShort(12_500_000, "bn")).toBe("৳১.২৫ কোটি");
    expect(fmtTakaShort(45_000, "en")).toBe("৳45,000");
    expect(fmtPct(0.426, "bn")).toBe("৪২%");
    expect(fmtDuration(27, "en")).toBe("2 yrs 3 mo");
    expect(fmtDuration(12, "bn")).toBe("১ বছর");
    expect(fmtMonthFromNow(14, "en", new Date(2026, 9, 5))).toBe("Dec 2027");
  });
});
