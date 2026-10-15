import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_ENTRIES_PER_USER } from "@/lib/tracker/limits";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    incomeEntry: { count: vi.fn(), create: vi.fn() },
    investmentEntry: { count: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  overLimit: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/tracker/session", () => ({ getOrCreateUserId: vi.fn().mockResolvedValue("u1"), signedCookieUserId: vi.fn() }));

import { POST as postIncome } from "./income/route";
import { POST as postInvestment } from "./investments/route";

const json = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body) });
const income = () => postIncome(json({ label: "x", source: "salary", amount: 1, frequency: "MONTHLY" }));
const investment = () =>
  postInvestment(
    json({ label: "x", instrumentType: "DPS", principalAmount: 1, startDate: "2026-01-01", termMonths: 12, expectedRatePct: 5 })
  );

beforeEach(() => {
  prisma.incomeEntry.create.mockReset().mockResolvedValue({ id: "e" });
  prisma.investmentEntry.create.mockReset().mockResolvedValue({ id: "e" });
});

describe("tracker entries are capped per user, so every read of them stays bounded", () => {
  it.each([
    ["income", income, prisma.incomeEntry],
    ["investments", investment, prisma.investmentEntry],
  ] as const)("%s: refuses a new entry once the user has the maximum", async (_name, call, table) => {
    table.count.mockResolvedValue(MAX_ENTRIES_PER_USER);
    const res = await call();
    expect(res.status).toBe(409);
    expect(table.create).not.toHaveBeenCalled();
  });

  it.each([
    ["income", income, prisma.incomeEntry],
    ["investments", investment, prisma.investmentEntry],
  ] as const)("%s: still saves below the maximum", async (_name, call, table) => {
    table.count.mockResolvedValue(MAX_ENTRIES_PER_USER - 1);
    const res = await call();
    expect(res.status).toBe(201);
  });
});
