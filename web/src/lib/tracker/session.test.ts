import { afterEach, describe, expect, it, vi } from "vitest";
import { signUserId, verifyAndExtractUserId } from "./session";

describe("Tracker Session Security & Signing", () => {
  it("generates a signed user id in the format userId.signature", () => {
    const userId = "cuid1234567890abcdefgh";
    const signed = signUserId(userId);
    expect(signed).toContain(".");
    const [id, sig] = signed.split(".");
    expect(id).toBe(userId);
    expect(sig.length).toBe(64); // SHA-256 hex
  });

  it("verifies and extracts user id from valid signature", () => {
    const userId = "cuid1234567890abcdefgh";
    const signed = signUserId(userId);
    const extracted = verifyAndExtractUserId(signed);
    expect(extracted).toBe(userId);
  });

  it("rejects raw, unsigned CUID (backdoor regression guard)", () => {
    const rawCuid = "cuid1234567890abcdefgh";
    const extracted = verifyAndExtractUserId(rawCuid);
    // Must return null, NEVER accept raw CUID
    expect(extracted).toBeNull();
  });

  it("rejects tampered signatures", () => {
    const userId = "cuid1234567890abcdefgh";
    const signed = signUserId(userId);
    const [id, sig] = signed.split(".");
    const tamperedSig = sig.slice(0, -2) + "00";
    const extracted = verifyAndExtractUserId(`${id}.${tamperedSig}`);
    expect(extracted).toBeNull();
  });

  it("rejects invalid cookie formats", () => {
    expect(verifyAndExtractUserId("")).toBeNull();
    expect(verifyAndExtractUserId("too.many.dots.here")).toBeNull();
    expect(verifyAndExtractUserId(".onlysig")).toBeNull();
  });
});

describe("Session secret configuration", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refuses to sign in production when no secret is configured (no baked-in default)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("ADMIN_SECRET", "");
    expect(() => signUserId("cuid1234567890abcdefgh")).toThrow(/SESSION_SECRET/);
    expect(() => verifyAndExtractUserId("cuid1234567890abcdefgh.abcd")).toThrow(/SESSION_SECRET/);
  });

  it("still works outside production without configuration", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("ADMIN_SECRET", "");
    expect(verifyAndExtractUserId(signUserId("cuid1234567890abcdefgh"))).toBe("cuid1234567890abcdefgh");
  });

  it("prefers SESSION_SECRET and falls back to ADMIN_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("ADMIN_SECRET", "admin-secret-value");
    const withAdmin = signUserId("cuid1234567890abcdefgh");

    vi.stubEnv("SESSION_SECRET", "dedicated-session-secret");
    const withSession = signUserId("cuid1234567890abcdefgh");

    expect(withAdmin).not.toBe(withSession);
    expect(verifyAndExtractUserId(withSession)).toBe("cuid1234567890abcdefgh");
    // A cookie signed with the fallback key is not valid once a dedicated key is set.
    expect(verifyAndExtractUserId(withAdmin)).toBeNull();
  });
});
