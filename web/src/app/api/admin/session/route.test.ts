import { beforeEach, describe, expect, it, vi } from "vitest";

const { overLimit, prisma, verifyPassword, createAdminSession } = vi.hoisted(() => ({
  overLimit: vi.fn(),
  prisma: { adminUser: { findUnique: vi.fn() } },
  verifyPassword: vi.fn(),
  createAdminSession: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  overLimit,
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/admin/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/auth")>()),
  verifyPassword,
  createAdminSession,
}));

import { POST } from "./route";

const login = (email: string) =>
  POST(
    new Request("http://localhost/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrong" }),
    })
  );

beforeEach(() => {
  vi.resetAllMocks();
  overLimit.mockResolvedValue(false);
  verifyPassword.mockReturnValue(false);
});

describe("POST /api/admin/session", () => {
  it("still checks a password when the email is unknown, so timing doesn't reveal which emails are admins", async () => {
    prisma.adminUser.findUnique.mockResolvedValue(null);
    const res = await login("nobody@example.com");
    expect(res.status).toBe(401);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
    expect(verifyPassword).toHaveBeenCalledWith("wrong", expect.stringMatching(/^[0-9a-f]+:[0-9a-f]+$/));
  });

  it("checks the real hash once for a known email", async () => {
    prisma.adminUser.findUnique.mockResolvedValue({ id: "a1", passwordHash: "salt:hash" });
    const res = await login("admin@example.com");
    expect(res.status).toBe(401);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
    expect(verifyPassword).toHaveBeenCalledWith("wrong", "salt:hash");
    expect(createAdminSession).not.toHaveBeenCalled();
  });
});
