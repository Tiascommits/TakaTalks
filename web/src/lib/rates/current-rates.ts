import type { BankType, RateInstrument, RateSourceMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FDR_TERMS_MONTHS } from "@/config/rate-monitoring";
import { isRateStale } from "./staleness";

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
  method: RateSourceMethod | null;
  source: string | null;
  lastVerifiedAt: Date | null;
  unverified: boolean;
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
    include: {
      rateSnapshots: {
        where: { instrument: "FDR" as RateInstrument, termMonths: { in: [...FDR_TERMS_MONTHS] } },
        orderBy: { scrapedAt: "desc" },
      },
      scrapeLogs: { orderBy: { attemptedAt: "desc" }, take: 1 },
    },
  });

  const rows: CurrentRateRow[] = [];
  for (const bank of banks) {
    const latestLog = bank.scrapeLogs[0] ?? null;
    for (const termMonths of FDR_TERMS_MONTHS) {
      const snapshot = bank.rateSnapshots.find((s) => s.termMonths === termMonths) ?? null;
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
        method: snapshot?.method ?? null,
        source: snapshot?.source ?? null,
        lastVerifiedAt: snapshot?.scrapedAt ?? null,
        unverified: isRateStale(
          snapshot?.scrapedAt ?? null,
          latestLog?.attemptedAt ?? null,
          latestLog?.success ?? null
        ),
      });
    }
  }
  return rows;
}

export async function getLatestBBAggregateRate() {
  return prisma.bBAggregateRate.findFirst({ orderBy: { enteredAt: "desc" } });
}
