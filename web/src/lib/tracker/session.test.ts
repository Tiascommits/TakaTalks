import { describe, expect, it } from "vitest";
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
