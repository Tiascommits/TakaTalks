import { prisma } from "@/lib/prisma";
import { deriveTaxInputFromTracker } from "@/lib/tracker/derive-tax-input";
import { calculateTax } from "@/lib/tax/calculate";
import { EMPTY_TAX_INPUT, type TaxCalculationResult } from "@/lib/tax/types";
import { computeReinvestSuggestion } from "./suggest";

export interface ReinvestContext {
  /** null when the person hasn't tracked any income/investments/profile yet — the scoring still runs, just without a tax-rebate bonus. */
  taxResult: TaxCalculationResult | null;
  /** Sum of confirmed-but-not-yet-reinvested payouts, same figure MaturityPanel shows on the tracker. */
  reinvestableCash: number;
  defaultAmount: number;
  defaultHorizonYears: number;
}

/**
 * Pulls together the same tracker data /calculator already uses to derive a
 * tax situation (see src/lib/tracker/derive-tax-input.ts), so a reinvestment
 * suggestion for a tracker user doesn't ask them to retype anything. Never
 * creates a user — read-only, safe to call from a GET route.
 */
export async function getReinvestContextForUser(userId: string): Promise<ReinvestContext> {
  const [income, investments, profile] = await Promise.all([
    prisma.incomeEntry.findMany({ where: { userId } }),
    prisma.investmentEntry.findMany({ where: { userId } }),
    prisma.taxProfile.findUnique({ where: { userId } }),
  ]);

  const hasAnyTrackedData = income.length > 0 || investments.length > 0 || profile !== null;
  const taxResult = hasAnyTrackedData
    ? calculateTax({ ...EMPTY_TAX_INPUT, ...deriveTaxInputFromTracker(income, investments, profile) })
    : null;

  const reinvestableCash = investments
    .filter((e) => e.payoutConfirmed)
    .reduce((sum, e) => sum + (e.payoutAmount ?? 0), 0);

  return {
    taxResult,
    reinvestableCash,
    defaultAmount: reinvestableCash > 0 ? reinvestableCash : 100_000,
    defaultHorizonYears: 3,
  };
}

/**
 * Computes a suggestion and writes it to ReinvestSuggestion so a later view
 * of the same link shows exactly what was computed then, and so
 * seen/dismissed state has somewhere to live (see the model's doc comment
 * in prisma/schema.prisma). Always call getReinvestContextForUser (or pass
 * its taxResult) first — this does not fetch tracker data itself, so it
 * stays a single easily-tested write path.
 */
export async function logReinvestSuggestion(params: {
  userId: string;
  investmentEntryId?: string | null;
  reinvestAmount: number;
  horizonYears: number;
  hasPSR: boolean;
  inflationPct: number;
  taxResult: TaxCalculationResult | null;
  markSeen?: boolean;
}) {
  const result = computeReinvestSuggestion({
    reinvestAmount: params.reinvestAmount,
    horizonYears: params.horizonYears,
    hasPSR: params.hasPSR,
    inflationPct: params.inflationPct,
    taxResult: params.taxResult,
  });

  const row = await prisma.reinvestSuggestion.create({
    data: {
      userId: params.userId,
      investmentEntryId: params.investmentEntryId ?? null,
      reinvestAmount: result.reinvestAmount,
      horizonYears: result.horizonYears,
      hasPSR: result.hasPSR,
      inflationPct: result.inflationPct,
      topCategory: result.topCategory,
      // JSON round-trip so the plain result object is JSON-safe before
      // hitting the Json column — same idiom as src/lib/admin/audit.ts.
      categoryScores: JSON.parse(JSON.stringify(result.categories)),
      seen: params.markSeen ?? false,
      seenAt: params.markSeen ? new Date() : null,
    },
  });

  return { row, result };
}
