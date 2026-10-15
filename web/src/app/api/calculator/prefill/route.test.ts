import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, getCurrentUserId } = vi.hoisted(() => ({
  prisma: {
    incomeEntry: { findMany: vi.fn() },
    investmentEntry: { findMany: vi.fn() },
    taxProfile: { findUnique: vi.fn() },
  },
  getCurrentUserId: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/tracker/session", () => ({ getCurrentUserId }));

import { GET } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  prisma.incomeEntry.findMany.mockResolvedValue([
    { source: "salary", amount: 50_000, frequency: "MONTHLY" },
  ]);
  prisma.investmentEntry.findMany.mockResolvedValue([]);
  prisma.taxProfile.findUnique.mockResolvedValue(null);
});

describe("GET /api/calculator/prefill", () => {
  it("returns nothing and reads nothing for a browser with no tracker account", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const body = await (await GET()).json();

    expect(body).toEqual({ initial: null });
    expect(prisma.incomeEntry.findMany).not.toHaveBeenCalled();
  });

  it("maps only this user's tracker rows into calculator input", async () => {
    getCurrentUserId.mockResolvedValue("u1");
    const body = await (await GET()).json();

    expect(prisma.incomeEntry.findMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(body.initial.basicMonthly).toBe(50_000);
  });
});
