import { beforeEach, describe, expect, it, vi } from "vitest";

const { overLimit, getOrCreateUserId, requestEmailLink, requestPhoneOtp } = vi.hoisted(() => ({
  overLimit: vi.fn(),
  getOrCreateUserId: vi.fn(),
  requestEmailLink: vi.fn(),
  requestPhoneOtp: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  overLimit,
}));
vi.mock("@/lib/tracker/session", () => ({ getOrCreateUserId }));
vi.mock("@/lib/notify/verification", () => ({ requestEmailLink, requestPhoneOtp }));

import { canonicalDestination } from "@/lib/rate-limit";
import { POST } from "./route";

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://www.takatalks.com/api/account/link", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "203.0.113.7", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
  overLimit.mockResolvedValue(false);
  getOrCreateUserId.mockResolvedValue("u1");
  requestEmailLink.mockResolvedValue({ ok: true });
  requestPhoneOtp.mockResolvedValue({ ok: true });
});

const linkToKeys = () => overLimit.mock.calls.filter(([bucket]) => bucket === "linkTo").map(([, who]) => who);

describe("POST /api/account/link", () => {
  it("counts every spelling of one Gmail inbox against the same per-address limit", async () => {
    const spellings = ["person@gmail.com", "person+1@gmail.com", "p.erson@gmail.com", "Person@GoogleMail.com"];
    for (const destination of spellings) await POST(post({ channel: "EMAIL", destination }));
    expect(new Set(linkToKeys())).toEqual(new Set(["person@gmail.com"]));
    // The mail still goes to the address as typed.
    expect(requestEmailLink.mock.calls.map(([, to]) => to)).toEqual(spellings);
  });

  it("counts a phone number with or without + against the same limit", async () => {
    await POST(post({ channel: "PHONE", destination: "+8801712345678" }));
    await POST(post({ channel: "PHONE", destination: "8801712345678" }));
    expect(new Set(linkToKeys())).toEqual(new Set(["8801712345678"]));
  });

  it("does not pass a provider error message to the caller", async () => {
    requestEmailLink.mockResolvedValue({ ok: false, reason: "PROVIDER-INTERNAL-MESSAGE" });
    const res = await POST(post({ channel: "EMAIL", destination: "a@example.com" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "send_failed" });
  });

  it("keeps the fixed reasons the UI understands", async () => {
    requestEmailLink.mockResolvedValue({ ok: false, reason: "not_configured" });
    expect((await POST(post({ channel: "EMAIL", destination: "a@example.com" }))).status).toBe(503);
    requestEmailLink.mockResolvedValue({ ok: false, reason: "too_soon" });
    const res = await POST(post({ channel: "EMAIL", destination: "a@example.com" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "too_soon" });
  });

  it("refuses a cross-site request before creating a session", async () => {
    const res = await POST(post({ channel: "EMAIL", destination: "a@example.com" }, { "Sec-Fetch-Site": "cross-site" }));
    expect(res.status).toBe(403);
    expect(getOrCreateUserId).not.toHaveBeenCalled();
  });
});

describe("canonicalDestination", () => {
  it.each([
    ["EMAIL", "First.Last+news@Example.com", "first.last@example.com"], // dots only matter outside Gmail
    ["EMAIL", "f.i.r.s.t@googlemail.com", "first@gmail.com"],
    ["PHONE", "+880 1712-345678", "8801712345678"],
  ] as const)("%s %s -> %s", (channel, input, expected) => {
    expect(canonicalDestination(channel, input)).toBe(expected);
  });
});
