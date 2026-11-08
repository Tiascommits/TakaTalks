import { beforeEach, describe, expect, it, vi } from "vitest";

const { overLimit, getCurrentUserId, setUserIdCookie, consumeVerificationToken } = vi.hoisted(() => ({
  overLimit: vi.fn(),
  getCurrentUserId: vi.fn(),
  setUserIdCookie: vi.fn(),
  consumeVerificationToken: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  overLimit,
}));
vi.mock("@/lib/tracker/session", () => ({ getCurrentUserId, setUserIdCookie }));
vi.mock("@/lib/notify/verification", () => ({ consumeVerificationToken }));

import { POST } from "./route";

const post = (headers: Record<string, string>, body = JSON.stringify({ token: "T" })) =>
  new Request("https://www.takatalks.com/api/account/verify", {
    method: "POST",
    headers: { "x-real-ip": "203.0.113.7", ...headers },
    body,
  });

beforeEach(() => {
  vi.resetAllMocks();
  overLimit.mockResolvedValue(false);
  getCurrentUserId.mockResolvedValue(null);
  consumeVerificationToken.mockResolvedValue({ ok: true, userId: "token-owner" });
});

describe("POST /api/account/verify only signs in a browser from this site", () => {
  it("refuses a text/plain body (what a cross-site HTML form can send)", async () => {
    const res = await POST(post({ "Content-Type": "text/plain" }, '{"token":"T","x":"="}'));
    expect(res.status).toBe(415);
    expect(consumeVerificationToken).not.toHaveBeenCalled();
    expect(setUserIdCookie).not.toHaveBeenCalled();
  });

  it("refuses Sec-Fetch-Site: cross-site", async () => {
    const res = await POST(post({ "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" }));
    expect(res.status).toBe(403);
    expect(setUserIdCookie).not.toHaveBeenCalled();
  });

  it("refuses an Origin from another site", async () => {
    const res = await POST(post({ "Content-Type": "application/json", Origin: "https://unrelated.example" }));
    expect(res.status).toBe(403);
    expect(setUserIdCookie).not.toHaveBeenCalled();
  });

  it("accepts a same-origin JSON request with a valid token", async () => {
    const res = await POST(
      post({ "Content-Type": "application/json", Origin: "https://www.takatalks.com", "Sec-Fetch-Site": "same-origin" })
    );
    expect(res.status).toBe(200);
    expect(overLimit).toHaveBeenCalledWith("link", "203.0.113.7");
    expect(setUserIdCookie).toHaveBeenCalledWith("token-owner");
  });

  it("accepts JSON with no Origin or Sec-Fetch-Site (non-browser clients, which carry no victim cookie)", async () => {
    const res = await POST(post({ "Content-Type": "application/json; charset=utf-8" }));
    expect(res.status).toBe(200);
  });

  it("is rate limited per IP before the token is touched", async () => {
    overLimit.mockResolvedValue(true);
    const res = await POST(post({ "Content-Type": "application/json" }));
    expect(res.status).toBe(429);
    expect(consumeVerificationToken).not.toHaveBeenCalled();
    expect(setUserIdCookie).not.toHaveBeenCalled();
  });
});
