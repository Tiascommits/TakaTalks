import { describe, expect, it } from "vitest";
import { requestErrorMessage } from "./request-error";

describe("requestErrorMessage", () => {
  it("tells a rate-limited person to wait, not just to retry", () => {
    expect(requestErrorMessage(429).en).toMatch(/wait a minute/i);
  });

  it("points at the fields when the server rejects the values", () => {
    expect(requestErrorMessage(400).en).toMatch(/check/i);
  });

  it("says what to do when the entry limit is reached", () => {
    expect(requestErrorMessage(409).en).toMatch(/delete/i);
  });

  it("blames the connection when the request never got an answer", () => {
    expect(requestErrorMessage(null).en).toMatch(/connection/i);
  });

  it("owns server failures and always has Bangla", () => {
    for (const status of [500, 503, 404, 429, 400, null]) {
      expect(requestErrorMessage(status).bn.length).toBeGreaterThan(0);
    }
    expect(requestErrorMessage(500).en).toMatch(/our side/i);
  });
});
