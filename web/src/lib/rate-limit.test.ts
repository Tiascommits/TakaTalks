import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, jar } = vi.hoisted(() => ({
  prisma: { rateLimit: { upsert: vi.fn(), deleteMany: vi.fn() } },
  jar: { taka_uid: undefined as string | undefined },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (jar.taka_uid ? { value: jar.taka_uid } : undefined) }),
}));

import { clientIp, overLimit, writeKey } from "./rate-limit";
import { signUserId } from "@/lib/tracker/session";

beforeEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  prisma.rateLimit.deleteMany.mockResolvedValue({ count: 0 });
  jar.taka_uid = undefined;
});

/** An in-memory RateLimit table, so counts add up the way Postgres would. */
function countInMemory() {
  const counts = new Map<string, number>();
  prisma.rateLimit.upsert.mockImplementation(async ({ where }: { where: { key: string } }) => {
    counts.set(where.key, (counts.get(where.key) ?? 0) + 1);
    return { count: counts.get(where.key) };
  });
}

describe("overLimit", () => {
  it("allows hits up to the bucket's limit and refuses the next one: the same address hits its link limit", async () => {
    countInMemory();
    for (let i = 0; i < 3; i++) expect(await overLimit("linkTo", "a@example.com")).toBe(false); // linkTo allows 3
    expect(await overLimit("linkTo", "a@example.com")).toBe(true);
    expect(await overLimit("linkTo", "b@example.com")).toBe(false);
  });

  it("counts atomically in the database, keyed by a hash that holds no IP or address", async () => {
    prisma.rateLimit.upsert.mockResolvedValue({ count: 1 });
    await overLimit("write", "203.0.113.7");

    const arg = prisma.rateLimit.upsert.mock.calls[0][0];
    expect(arg.update).toEqual({ count: { increment: 1 } });
    expect(arg.create).toMatchObject({ key: arg.where.key, count: 1 });
    expect(arg.where.key).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(arg)).not.toContain("203.0.113.7");
  });

  it("starts a new count in the next window, and the row expires when its window ends", async () => {
    prisma.rateLimit.upsert.mockResolvedValue({ count: 1 });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T10:01:00Z"));
    await overLimit("write", "ip");
    await overLimit("write", "ip");
    vi.setSystemTime(new Date("2026-10-15T10:11:00Z"));
    await overLimit("write", "ip");

    const [a, b, c] = prisma.rateLimit.upsert.mock.calls.map(([arg]) => arg);
    expect(a.where.key).toBe(b.where.key);
    expect(c.where.key).not.toBe(a.where.key);
    expect(a.create.expiresAt).toEqual(new Date("2026-10-15T10:10:00Z")); // write: 10-minute windows
  });

  it("keeps buckets and clients apart", async () => {
    prisma.rateLimit.upsert.mockResolvedValue({ count: 1 });
    await overLimit("write", "ip1");
    await overLimit("write", "ip2");
    await overLimit("adminLogin", "ip1");
    const keys = new Set(prisma.rateLimit.upsert.mock.calls.map(([arg]) => arg.where.key));
    expect(keys.size).toBe(3);
  });
});

describe("writeKey", () => {
  const sharedIp = new Request("http://x/", { headers: { "x-real-ip": "203.0.113.7" } });

  it("gives two signed-in users behind one shared IP their own save budgets", async () => {
    countInMemory();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T10:01:00Z")); // all hits in one 10-minute window
    const save = async (userId: string) => {
      jar.taka_uid = signUserId(userId);
      return overLimit("write", await writeKey(sharedIp));
    };
    for (let i = 0; i < 60; i++) expect(await save("alice")).toBe(false); // write allows 60
    expect(await save("alice")).toBe(true);
    expect(await save("bob")).toBe(false);
  });

  it("falls back to the IP with no session cookie or a forged one", async () => {
    expect(await writeKey(sharedIp)).toBe("203.0.113.7");
    jar.taka_uid = `alice.${"0".repeat(64)}`;
    expect(await writeKey(sharedIp)).toBe("203.0.113.7");
    jar.taka_uid = signUserId("alice");
    expect(await writeKey(sharedIp)).toBe("user:alice");
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x/", { headers });

  it("prefers x-real-ip, then the first x-forwarded-for hop", () => {
    expect(clientIp(req({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(req({ "x-forwarded-for": "2.2.2.2, 10.0.0.1" }))).toBe("2.2.2.2");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
