import { describe, expect, it } from "vitest";
import { attemptDestination } from "./attempt-key";

describe("attemptDestination", () => {
  it("resolves every OTP guess for one phone to the same destination (scoped-token form)", () => {
    const a = attemptDestination("+8801712345678:123456");
    expect(a).toBe("+8801712345678");
    expect(attemptDestination("+8801712345678:123457")).toBe(a);
    expect(attemptDestination("+8801712345678:999999")).toBe(a);
  });

  it("matches the {code, destination} form to the scoped-token form", () => {
    expect(attemptDestination("123456", "+8801712345678")).toBe(attemptDestination("+8801712345678:654321"));
  });

  it("ignores surrounding whitespace and letter case", () => {
    expect(attemptDestination("  +8801712345678:123456  ")).toBe("+8801712345678");
    expect(attemptDestination("123456", " +8801712345678 ")).toBe("+8801712345678");
    expect(attemptDestination("123456", "Person@Example.com")).toBe("person@example.com");
  });

  it("keeps different phones apart", () => {
    expect(attemptDestination("+8801712345678:111111")).not.toBe(attemptDestination("+8801812345678:111111"));
  });

  it("returns null for a bare magic-link token (no per-destination budget needed)", () => {
    expect(attemptDestination("a".repeat(64))).toBeNull();
  });

  it("never lets a per-guess value become the destination of a scoped token", () => {
    // Regression: the limiter key used to be the raw input, so each guess got a fresh bucket.
    const seen = new Set(Array.from({ length: 50 }, (_, i) => attemptDestination(`+8801712345678:${100000 + i}`)));
    expect(seen.size).toBe(1);
  });
});
