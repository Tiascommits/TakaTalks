import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({ prisma: { user: { deleteMany: vi.fn() } } }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { GET } from "./route";
import { ANONYMOUS_RETENTION_DAYS } from "@/config/retention";

const DAY = 24 * 60 * 60 * 1000;
const run = (auth?: string) =>
  GET(new Request("http://localhost/api/cron/prune-anonymous", auth ? { headers: { authorization: auth } } : {}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  prisma.user.deleteMany.mockResolvedValue({ count: 3 });
});
afterEach(() => vi.unstubAllEnvs());

describe("prune-anonymous cron", () => {
  it("returns 401 and deletes nothing without the cron secret", async () => {
    expect((await run()).status).toBe(401);
    expect((await run("Bearer wrong")).status).toBe(401);
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only users with no email, no phone and no visit within the retention window", async () => {
    const before = Date.now();
    const res = await run("Bearer test-cron-secret");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 3 });
    expect(prisma.user.deleteMany).toHaveBeenCalledTimes(1);
    const { where } = prisma.user.deleteMany.mock.calls[0][0];
    expect(where.email).toBeNull();
    expect(where.phone).toBeNull();
    const cutoff: Date = where.lastSeenAt.lt;
    expect(Object.keys(where).sort()).toEqual(["email", "lastSeenAt", "phone"]);
    expect(Math.abs(before - ANONYMOUS_RETENTION_DAYS * DAY - cutoff.getTime())).toBeLessThan(5_000);
  });
});
