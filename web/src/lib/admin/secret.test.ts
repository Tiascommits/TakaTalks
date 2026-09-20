import { describe, expect, it } from "vitest";
import { adminSecretMatches } from "./secret";

describe("adminSecretMatches", () => {
  it("accepts the exact secret", () => {
    expect(adminSecretMatches("s3cret-value", "s3cret-value")).toBe(true);
  });

  it("rejects a wrong secret, including one of the same length", () => {
    expect(adminSecretMatches("s3cret-valuX", "s3cret-value")).toBe(false);
    expect(adminSecretMatches("short", "s3cret-value")).toBe(false);
  });

  it("never matches when the configured secret is missing or empty (undefined === undefined guard)", () => {
    expect(adminSecretMatches(undefined, undefined)).toBe(false);
    expect(adminSecretMatches("", "")).toBe(false);
    expect(adminSecretMatches("anything", undefined)).toBe(false);
    expect(adminSecretMatches(undefined, "")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(adminSecretMatches(null, "s3cret-value")).toBe(false);
    expect(adminSecretMatches(12345, "12345")).toBe(false);
    expect(adminSecretMatches({ secret: "s3cret-value" }, "s3cret-value")).toBe(false);
  });
});
