import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BANKS } from "@/config/banks";
import { PLAUSIBLE_FDR_RATE_PCT } from "@/config/rate-monitoring";
import { RATE_ADAPTERS } from "./adapters/registry";

export type RunScrapeSummary = {
  banksUpserted: number;
  attempted: number;
  succeeded: number;
  failed: number;
  skippedNoAdapter: string[];
};

/**
 * Entry point for module 3, run by the daily cron (/api/cron/rate-scrape)
 * and the admin "Run scrape now" button. Upserts the configured bank list so
 * adding a bank to config/banks.ts is enough to make it show up, then runs
 * whichever adapter is registered for each one. A failing adapter only logs
 * a failure for its own bank — it never stops the run for the others.
 */
export async function runScrape(): Promise<RunScrapeSummary> {
  for (const b of BANKS) {
    // The two report URLs are only written when config actually has one,
    // so a URL entered by hand at /admin/banks/[id] for a bank config
    // can't supply isn't wiped on the next scrape.
    const reportUrls = {
      ...(b.annualReportPageUrl ? { annualReportPageUrl: b.annualReportPageUrl } : {}),
      ...(b.dseCompanyUrl ? { dseCompanyUrl: b.dseCompanyUrl } : {}),
    };
    await prisma.bank.upsert({
      where: { shortCode: b.shortCode },
      update: { name: b.name, type: b.type, ...reportUrls },
      create: { shortCode: b.shortCode, name: b.name, type: b.type, ...reportUrls },
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
      const plausible = (pct: number) => pct >= PLAUSIBLE_FDR_RATE_PCT.min && pct <= PLAUSIBLE_FDR_RATE_PCT.max;
      const implausible = rates.find((r) => !plausible(r.ratePct) || (r.ratePctMax !== undefined && !plausible(r.ratePctMax)));
      if (implausible) {
        throw new Error(
          `Implausible rate ${implausible.ratePct}%${implausible.ratePctMax !== undefined ? `-${implausible.ratePctMax}%` : ""} for ${implausible.termMonths} months; nothing stored`
        );
      }
      // A dated (manual) figure is stored once; re-storing it every day would
      // pile up identical rows that all count as "latest".
      const toStore: typeof rates = [];
      for (const r of rates) {
        const stored =
          r.asOf &&
          (await prisma.rateSnapshot.findFirst({
            where: { bankId: bank.id, instrument: r.instrument, termMonths: r.termMonths, ratePct: r.ratePct, ratePctMax: r.ratePctMax ?? null, scrapedAt: r.asOf },
          }));
        if (!stored) toStore.push(r);
      }
      await prisma.$transaction([
        prisma.scrapeLog.create({
          data: { bankId: bank.id, success: true, ratesFound: rates.length },
        }),
        ...toStore.map((r) =>
          prisma.rateSnapshot.create({
            data: {
              bankId: bank.id,
              instrument: r.instrument,
              termMonths: r.termMonths,
              ratePct: r.ratePct,
              ratePctMax: r.ratePctMax ?? null,
              method: r.method,
              source: r.source,
              scrapedAt: r.asOf, // undefined = now, for a live read
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

  // The nav and homepage hide /rates until rate data exists (root layout,
  // hasRateData); re-render every page so they pick up today's state.
  if (succeeded > 0) revalidatePath("/", "layout");

  return {
    banksUpserted: BANKS.length,
    attempted: banks.length - skippedNoAdapter.length,
    succeeded,
    failed,
    skippedNoAdapter,
  };
}
