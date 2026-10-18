import type { BankType, RateInstrument, RateSourceMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BB_DEPOSIT_CHART_URL, FDR_TERMS_MONTHS } from "@/config/rate-monitoring";
import { isChartOverdue, isRateStale } from "./staleness";

export type CurrentRateRow = {
  bankShortCode: string;
  bankName: string;
  bankType: BankType;
  creditRating: string | null;
  ratingAgency: string | null;
  ratingDate: Date | null;
  statementUrl: string | null;
  termMonths: number;
  ratePct: number | null;
  /** Upper end when the source gives a range; null for a single figure. */
  ratePctMax: number | null;
  method: RateSourceMethod | null;
  source: string | null;
  asOf: Date | null;
  unverified: boolean;
};

const FDR_SNAPSHOTS = {
  instrument: "FDR" as RateInstrument,
  termMonths: { in: [...FDR_TERMS_MONTHS] },
};

/**
 * One row per active bank per tracked FDR term, even when nothing has ever
 * been scraped for it — the scorecard shows "not available" rather than
 * omitting the bank (see prompt: never synthesize a placeholder number, but
 * also never quietly drop a bank from the comparison).
 */
export async function getCurrentFdrRates(): Promise<CurrentRateRow[]> {
  const banks = await prisma.bank.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { scrapeLogs: { orderBy: { attemptedAt: "desc" }, take: 1 } },
  });

  // Only the newest snapshot per bank, term and source: the table gains rows
  // every day, so reading the full history would slow this page without bound.
  const latest = await prisma.rateSnapshot.groupBy({
    by: ["bankId", "termMonths", "source"],
    where: FDR_SNAPSHOTS,
    _max: { scrapedAt: true },
  });
  // The chart outranks any other source for the same bank and term, whatever
  // the dates: an older scraper's row dated after the chart's 1st-of-month
  // must not win. Otherwise the newest date wins.
  const best = new Map<string, (typeof latest)[number]>();
  for (const l of latest) {
    if (!l._max.scrapedAt) continue;
    const key = `${l.bankId}:${l.termMonths}`;
    const cur = best.get(key);
    const rank = (x: typeof l) => (x.source === BB_DEPOSIT_CHART_URL ? 1 : 0);
    if (!cur || rank(l) > rank(cur) || (rank(l) === rank(cur) && l._max.scrapedAt > cur._max.scrapedAt!)) best.set(key, l);
  }
  const latestKeys = [...best.values()].map((l) => ({
    bankId: l.bankId,
    termMonths: l.termMonths,
    source: l.source,
    scrapedAt: l._max.scrapedAt!,
  }));
  const snapshots = latestKeys.length
    ? await prisma.rateSnapshot.findMany({
        where: { ...FDR_SNAPSHOTS, OR: latestKeys },
        orderBy: { id: "desc" }, // a revised chart keeps the chart's date: the later row (cuid) wins the tie
      })
    : [];

  const rows: CurrentRateRow[] = [];
  for (const bank of banks) {
    const latestLog = bank.scrapeLogs[0] ?? null;
    for (const termMonths of FDR_TERMS_MONTHS) {
      const snapshot = snapshots.find((s) => s.bankId === bank.id && s.termMonths === termMonths) ?? null;
      rows.push({
        bankShortCode: bank.shortCode,
        bankName: bank.name,
        bankType: bank.type,
        creditRating: bank.creditRating,
        ratingAgency: bank.ratingAgency,
        ratingDate: bank.ratingDate,
        statementUrl: bank.statementUrl,
        termMonths,
        ratePct: snapshot?.ratePct ?? null,
        ratePctMax: snapshot?.ratePctMax ?? null,
        method: snapshot?.method ?? null,
        source: snapshot?.source ?? null,
        asOf: snapshot?.scrapedAt ?? null,
        unverified:
          isRateStale(snapshot?.scrapedAt ?? null, latestLog?.attemptedAt ?? null, latestLog?.success ?? null) ||
          isChartOverdue(snapshot?.source ?? null, snapshot?.scrapedAt ?? null),
      });
    }
  }
  return rows;
}

/**
 * True once any active bank has an FDR rate stored. Gates /rates in the nav
 * and homepage, so an empty scorecard is never advertised.
 */
export async function hasRateData(): Promise<boolean> {
  try {
    const any = await prisma.rateSnapshot.findFirst({
      where: { ...FDR_SNAPSHOTS, bank: { active: true } },
      select: { id: true },
    });
    return any !== null;
  } catch {
    // No reachable or migrated database (e.g. `next build` in CI): keep it hidden.
    return false;
  }
}

export async function getLatestBBAggregateRate() {
  return prisma.bBAggregateRate.findFirst({ orderBy: { enteredAt: "desc" } });
}

export type BankHealthRow = {
  bankShortCode: string;
  bankName: string;
  figures: {
    fiscalYear: number;
    field: string;
    numericValue: number | null;
    rawValue: string;
    sourceReportUrl: string;
  }[];
};

/**
 * Only approved figures ever reach this — see /admin/bank-health. Every
 * active bank appears even with an empty figures array, so the UI can show
 * "not disclosed / not extracted" per prompts/03 rather than omitting the
 * bank silently.
 */
export async function getApprovedBankHealthFigures(): Promise<BankHealthRow[]> {
  const banks = await prisma.bank.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      extractedFigures: {
        where: { approved: true },
        orderBy: { fiscalYear: "desc" },
      },
    },
  });

  return banks.map((bank) => ({
    bankShortCode: bank.shortCode,
    bankName: bank.name,
    figures: bank.extractedFigures.map((f) => ({
      fiscalYear: f.fiscalYear,
      field: f.field,
      numericValue: f.numericValue,
      rawValue: f.rawValue,
      sourceReportUrl: f.sourceReportUrl,
    })),
  }));
}
