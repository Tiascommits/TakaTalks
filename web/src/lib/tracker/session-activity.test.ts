import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, cookieValue } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), updateMany: vi.fn() } },
  cookieValue: { current: undefined as string | undefined },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue.current ? { value: cookieValue.current } : undefined) }),
}));

import { getCurrentUserId, signUserId } from "./session";

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  cookieValue.current = signUserId("u1");
  prisma.user.updateMany.mockResolvedValue({ count: 1 });
});

// The prune-anonymous cron deletes accounts by lastSeenAt, so a visit must keep it fresh.
describe("getCurrentUserId records activity", () => {
  it("bumps lastSeenAt when the last recorded visit is over a day old", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", lastSeenAt: new Date(Date.now() - 2 * DAY) });
    expect(await getCurrentUserId()).toBe("u1");
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.updateMany.mock.calls[0][0].where).toEqual({ id: "u1" });
  });

  it("skips the write when the account was seen within the last day", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", lastSeenAt: new Date(Date.now() - 60_000) });
    expect(await getCurrentUserId()).toBe("u1");
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("still returns the user if the activity write fails", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", lastSeenAt: new Date(0) });
    prisma.user.updateMany.mockRejectedValue(new Error("db down"));
    expect(await getCurrentUserId()).toBe("u1");
  });

  it("does nothing for a missing user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    expect(await getCurrentUserId()).toBeNull();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
