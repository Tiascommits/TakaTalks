import { prisma } from "@/lib/prisma";
import { BANKS } from "@/config/banks";
import { RATE_ADAPTERS } from "./adapters/registry";

export type RunScrapeSummary = {
  banksUpserted: number;
  attempted: number;
  succeeded: number;
  failed: number;
  skippedNoAdapter: string[];
};

/**
 * Manual-trigger entry point for module 3 (no cron wired up yet — see
 * prompts/02-rate-monitoring-and-scorecard.md, this project runs it from
 * the admin "Run scrape now" button). Upserts the configured bank list so
 * adding a bank to config/banks.ts is enough to make it show up, then runs
 * whichever adapter is registered for each one. A failing adapter only logs
 * a failure for its own bank — it never stops the run for the others.
 */
export async function runScrape(): Promise<RunScrapeSummary> {
  for (const b of BANKS) {
    await prisma.bank.upsert({
      where: { shortCode: b.shortCode },
      update: { name: b.name, type: b.type },
      create: { shortCode: b.shortCode, name: b.name, type: b.type },
    });
  }

  const banks = await prisma.bank.findMany({ where: { active: true } });
  const skippedNoAdapter: string[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const bank of banks) {
    const adapter = RATE_ADAPTERS.get(bank.shortCode);
    if (!adapter) {
      skippedNoAdapter.push(bank.shortCode);
      continue;
    }

    try {
      const rates = await adapter.scrape();
      await prisma.$transaction([
        prisma.scrapeLog.create({
          data: { bankId: bank.id, success: true, ratesFound: rates.length },
        }),
        ...rates.map((r) =>
          prisma.rateSnapshot.create({
            data: {
              bankId: bank.id,
              instrument: r.instrument,
              termMonths: r.termMonths,
              ratePct: r.ratePct,
              method: r.method,
              source: r.source,
            },
          })
        ),
      ]);
      succeeded++;
    } catch (err) {
      await prisma.scrapeLog.create({
        data: {
          bankId: bank.id,
          success: false,
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
      failed++;
    }
  }

  return {
    banksUpserted: BANKS.length,
    attempted: banks.length - skippedNoAdapter.length,
    succeeded,
    failed,
    skippedNoAdapter,
  };
}
