import type { RateInstrument } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SIGNIFICANT_CHANGE_THRESHOLD_PCT } from "@/config/rate-monitoring";
import { RATE_ADAPTERS } from "./adapters/registry";

export type DigestLogInput = { success: boolean; attemptedAt: Date; errorMessage: string | null };
export type DigestSnapshotInput = {
  instrument: RateInstrument;
  termMonths: number;
  ratePct: number;
  scrapedAt: Date;
};
export type DigestBankInput = {
  shortCode: string;
  name: string;
  hasAdapter: boolean;
  /** Most recent first. */
  logs: DigestLogInput[];
  /** Most recent first, within each instrument+term group. */
  snapshots: DigestSnapshotInput[];
};

export type FailedAdapterEntry = {
  shortCode: string;
  name: string;
  errorMessage: string | null;
  attemptedAt: Date;
};
export type UnconfiguredBankEntry = { shortCode: string; name: string };
export type ChangedRateEntry = {
  shortCode: string;
  name: string;
  instrument: RateInstrument;
  termMonths: number;
  previousPct: number;
  currentPct: number;
  deltaPct: number;
};

export type DigestResult = {
  failedAdapters: FailedAdapterEntry[];
  unconfiguredBanks: UnconfiguredBankEntry[];
  changedRates: ChangedRateEntry[];
};

/**
 * Pure so it's cheap to unit test: no DB access, just the shape a human
 * would want in the daily "what needs a look" summary (see prompt's admin
 * daily digest requirement — delivered as an in-app admin page for v1
 * rather than email).
 */
export function computeDigest(banks: DigestBankInput[]): DigestResult {
  const failedAdapters: FailedAdapterEntry[] = [];
  const unconfiguredBanks: UnconfiguredBankEntry[] = [];
  const changedRates: ChangedRateEntry[] = [];

  for (const bank of banks) {
    if (!bank.hasAdapter) {
      unconfiguredBanks.push({ shortCode: bank.shortCode, name: bank.name });
      continue;
    }

    const latestLog = bank.logs[0];
    if (latestLog && !latestLog.success) {
      failedAdapters.push({
        shortCode: bank.shortCode,
        name: bank.name,
        errorMessage: latestLog.errorMessage,
        attemptedAt: latestLog.attemptedAt,
      });
    }

    const byKey = new Map<string, DigestSnapshotInput[]>();
    for (const snap of bank.snapshots) {
      const key = `${snap.instrument}:${snap.termMonths}`;
      const group = byKey.get(key) ?? [];
      group.push(snap);
      byKey.set(key, group);
    }

    for (const group of byKey.values()) {
      if (group.length < 2) continue;
      const [current, previous] = group;
      const deltaPct = current.ratePct - previous.ratePct;
      if (Math.abs(deltaPct) >= SIGNIFICANT_CHANGE_THRESHOLD_PCT) {
        changedRates.push({
          shortCode: bank.shortCode,
          name: bank.name,
          instrument: current.instrument,
          termMonths: current.termMonths,
          previousPct: previous.ratePct,
          currentPct: current.ratePct,
          deltaPct,
        });
      }
    }
  }

  return { failedAdapters, unconfiguredBanks, changedRates };
}

/** DB-backed wrapper: fetch each bank's recent logs/snapshots, shape them, and run computeDigest. */
export async function getDigest(): Promise<DigestResult> {
  const banks = await prisma.bank.findMany({
    where: { active: true },
    include: {
      scrapeLogs: { orderBy: { attemptedAt: "desc" }, take: 2 },
      rateSnapshots: { orderBy: { scrapedAt: "desc" }, take: 40 },
    },
  });

  const input: DigestBankInput[] = banks.map((bank) => ({
    shortCode: bank.shortCode,
    name: bank.name,
    hasAdapter: RATE_ADAPTERS.has(bank.shortCode),
    logs: bank.scrapeLogs.map((l) => ({
      success: l.success,
      attemptedAt: l.attemptedAt,
      errorMessage: l.errorMessage,
    })),
    snapshots: bank.rateSnapshots.map((s) => ({
      instrument: s.instrument,
      termMonths: s.termMonths,
      ratePct: s.ratePct,
      scrapedAt: s.scrapedAt,
    })),
  }));

  return computeDigest(input);
}
