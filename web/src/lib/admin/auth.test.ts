import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, jar } = vi.hoisted(() => ({
  prisma: { adminSession: { create: vi.fn(), findUnique: vi.fn() }, adminUser: { count: vi.fn() } },
  jar: new Map<string, { value: string; options?: Record<string, unknown> }>(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => jar.get(name),
    set: (name: string, value: string, options?: Record<string, unknown>) => jar.set(name, { value, options }),
    delete: (name: string) => jar.delete(name),
  }),
}));

import { createAdminSession, getCurrentAdminUserId, isAdmin } from "./auth";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  jar.clear();
  prisma.adminSession.create.mockImplementation(async ({ data }) => data);
});

describe("admin session cookie", () => {
  it("is 32 random bytes, Secure on Vercel, and only its hash is stored", async () => {
    vi.stubEnv("VERCEL", "1");
    await createAdminSession("admin1");

    const cookie = jar.get("taka_admin_session")!;
    expect(cookie.value).toMatch(/^[0-9a-f]{64}$/);
    expect(cookie.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });
    const stored = prisma.adminSession.create.mock.calls[0][0].data;
    expect(stored.id).toBe(sha256(cookie.value));
    expect(stored.id).not.toBe(cookie.value);
  });

  it("is looked up by its hash", async () => {
    jar.set("taka_admin_session", { value: "a".repeat(64) });
    prisma.adminSession.findUnique.mockResolvedValue({ adminUserId: "admin1", expiresAt: new Date(Date.now() + 60_000) });

    expect(await getCurrentAdminUserId()).toBe("admin1");
    expect(prisma.adminSession.findUnique).toHaveBeenCalledWith({ where: { id: sha256("a".repeat(64)) } });
  });

  it("the old bootstrap cookie holding the raw ADMIN_SECRET no longer grants admin", async () => {
    vi.stubEnv("ADMIN_SECRET", "the-admin-secret");
    prisma.adminUser.count.mockResolvedValue(0);
    jar.set("taka_admin", { value: "the-admin-secret" });

    expect(await isAdmin()).toBe(false);
  });
});
