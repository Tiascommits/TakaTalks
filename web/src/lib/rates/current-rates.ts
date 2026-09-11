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
