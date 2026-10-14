import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, getCurrentUserId, clearUserIdCookie } = vi.hoisted(() => ({
  prisma: { user: { deleteMany: vi.fn() } },
  getCurrentUserId: vi.fn(),
  clearUserIdCookie: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/tracker/session", () => ({ getCurrentUserId, clearUserIdCookie }));

import { DELETE } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  prisma.user.deleteMany.mockResolvedValue({ count: 1 });
});

describe("DELETE /api/account (delete my data)", () => {
  it("deletes this browser's user, which cascades to every row it owns, and clears the cookie", async () => {
    getCurrentUserId.mockResolvedValue("u1");
    const res = await DELETE();

    expect(res.status).toBe(200);
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(clearUserIdCookie).toHaveBeenCalled();
  });

  it("with no account, deletes nothing and still clears any stale cookie", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const res = await DELETE();

    expect(res.status).toBe(200);
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(clearUserIdCookie).toHaveBeenCalled();
  });
});
