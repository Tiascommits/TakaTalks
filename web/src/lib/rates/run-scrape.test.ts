import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  prisma: {
    bank: { upsert: vi.fn(), findMany: vi.fn() },
    scrapeLog: { create: vi.fn() },
    rateSnapshot: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { runScrape } from "./run-scrape";
import { SEED_AS_OF } from "./seed-rates";

beforeEach(() => {
  vi.resetAllMocks();
  prisma.bank.findMany.mockResolvedValue([{ id: "b1", shortCode: "MIDLAND" }]);
  prisma.rateSnapshot.create.mockImplementation((args) => args);
  prisma.$transaction.mockResolvedValue([]);
});

describe("runScrape", () => {
  it("dates a manual-seed rate by its source, not by today's run", async () => {
    await runScrape();
    const writes = prisma.rateSnapshot.create.mock.calls.map(([args]) => args.data);
    expect(writes.length).toBeGreaterThan(0);
    for (const data of writes) {
      expect(data.method).toBe("MANUAL");
      expect(data.scrapedAt).toBeInstanceOf(Date);
      expect(data.scrapedAt).toEqual(SEED_AS_OF);
    }
  });

  it("stores a dated seed figure once, not again on every run", async () => {
    prisma.rateSnapshot.findFirst.mockResolvedValue({ id: "already-stored" });
    await runScrape();
    expect(prisma.rateSnapshot.create).not.toHaveBeenCalled();
    expect(prisma.scrapeLog.create).toHaveBeenCalledWith({
      data: { bankId: "b1", success: true, ratesFound: 3 },
    });
  });

  it("re-renders every page after a successful run, so the nav can show /rates", async () => {
    await runScrape();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
