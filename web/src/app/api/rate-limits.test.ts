import { beforeEach, describe, expect, it, vi } from "vitest";

const { overLimit, getOrCreateUserId, getCurrentUserId, prisma, requestEmailLink } = vi.hoisted(() => ({
  overLimit: vi.fn(),
  getOrCreateUserId: vi.fn(),
  getCurrentUserId: vi.fn(),
  prisma: { adminUser: { findUnique: vi.fn(), count: vi.fn() }, investmentEntry: { findUnique: vi.fn() } },
  requestEmailLink: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  overLimit,
}));
vi.mock("@/lib/tracker/session", () => ({ getOrCreateUserId, getCurrentUserId }));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/notify/verification", () => ({ requestEmailLink, requestPhoneOtp: vi.fn() }));

import { POST as postIncome } from "./income/route";
import { POST as postInvestment } from "./investments/route";
import { POST as confirmPayout } from "./investments/[id]/confirm-payout/route";
import { PUT as putProfile } from "./profile/route";
import { POST as postSuggestion } from "./reinvest/suggestions/route";
import { POST as postLink } from "./account/link/route";
import { POST as adminLogin } from "./admin/session/route";
import { POST as adminSetup } from "./admin/setup/route";

const json = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "203.0.113.7" },
    body: JSON.stringify(body),
  });
const params = { params: Promise.resolve({ id: "inv1" }) };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST routes refuse callers over their rate limit before doing any work", () => {
  const cases: [string, string, () => Promise<Response>][] = [
    ["income", "write", () => postIncome(json({ label: "x", source: "salary", amount: 1, frequency: "MONTHLY" }))],
    ["investments", "write", () =>
      postInvestment(json({ label: "x", instrumentType: "DPS", principalAmount: 1, startDate: "2026-01-01", termMonths: 12, expectedRatePct: 5 }))],
    ["confirm-payout", "write", () => confirmPayout(json({ payoutAmount: 1 }), params)],
    ["profile", "write", () => putProfile(json({ category: "GENERAL" }))],
    ["reinvest suggestion", "write", () => postSuggestion(json({ reinvestAmount: 1, horizonYears: 1 }))],
    ["login link", "link", () => postLink(json({ channel: "EMAIL", destination: "a@example.com" }))],
    ["admin login", "adminLogin", () => adminLogin(json({ email: "a@example.com", password: "x" }))],
    ["admin setup", "adminLogin", () => adminSetup(json({ secret: "s", email: "a@example.com", password: "0123456789" }))],
  ];

  it.each(cases)("%s", async (_name, bucket, call) => {
    overLimit.mockResolvedValue(true);
    const res = await call();
    expect(res.status).toBe(429);
    expect(overLimit).toHaveBeenCalledWith(bucket, "203.0.113.7");
    expect(getOrCreateUserId).not.toHaveBeenCalled();
    expect(getCurrentUserId).not.toHaveBeenCalled();
    expect(prisma.adminUser.findUnique).not.toHaveBeenCalled();
    expect(prisma.adminUser.count).not.toHaveBeenCalled();
  });

  it("a login link is also limited per address, so one inbox can't be flooded from many IPs", async () => {
    overLimit.mockImplementation(async (bucket: string) => bucket === "linkTo");
    const res = await postLink(json({ channel: "EMAIL", destination: "Victim@Example.com" }));
    expect(res.status).toBe(429);
    expect(overLimit).toHaveBeenCalledWith("linkTo", "victim@example.com");
    expect(requestEmailLink).not.toHaveBeenCalled();
  });
});
