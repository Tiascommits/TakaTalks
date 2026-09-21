/**
 * Profit projections for tracked investments, and the consolidated figure shown
 * on /reinvest (profit already tracked + profit from reinvesting the payout).
 *
 * Pure functions, no I/O. Conventions deliberately match src/lib/instruments so
 * the tracker, the /instruments matrix and the /reinvest ranking never disagree:
 * - TDS (tax deducted at source) comes from the same INSTRUMENT_CATALOG rules.
 * - Sanchayapatra and mutual funds pay non-compounding profit; FDR and govt
 *   bonds compound annually on the after-tax rate.
 *
 * Only the four instrument types the catalog models get a tax figure. For the
 * rest (DPS, provident fund, stocks, insurance, other) the projection is a plain
 * simple-interest estimate with no tax taken off, and says so via `taxModelled`.
 * A donation returns nothing. These are estimates from the rate the person
 * entered, never a guarantee of what an institution will pay.
 */

import { INSTRUMENT_CATALOG } from "@/lib/instruments/instruments";
import type { InstrumentType, InvestmentEntryDTO } from "@/components/tracker/types";

/** Which INSTRUMENT_CATALOG entry supplies the tax and compounding rules for a tracker type. */
const CATALOG_ID_FOR_TYPE: Partial<Record<InstrumentType, string>> = {
  SANCHAYPATRA: "paribar-sanchaya",
  GOVT_BOND: "treasury-bond-sukuk",
  FIXED_DEPOSIT: "bank-fdr-top",
  MUTUAL_FUND: "mutual-fund-unit",
};

export interface InvestmentProjection {
  id: string;
  label: string;
  instrumentType: InstrumentType;
  principal: number;
  /** "confirmed" uses the real payout the person entered; "projected" is computed from the rate and term. */
  basis: "confirmed" | "projected";
  /** Profit before tax. Equals netProfit when tax is not modelled or the payout is confirmed. */
  grossProfit: number;
  /** TDS rate applied, or null when tax isn't modelled for this instrument type / the payout is real. */
  tdsPct: number | null;
  taxWithheld: number;
  netProfit: number;
  maturityValue: number;
  taxModelled: boolean;
  /** Returns move with the market (mutual funds), so the figure is indicative only. */
  marketLinked: boolean;
}

function nonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Projects one tracked investment to maturity. `hasPSR` picks the FDR / mutual
 * fund TDS band (10% with a return-filing proof, 15% without), the same switch
 * /instruments and /reinvest expose. It defaults to true, like they do.
 */
export function projectInvestment(
  entry: InvestmentEntryDTO,
  opts: { hasPSR?: boolean } = {}
): InvestmentProjection {
  const hasPSR = opts.hasPSR ?? true;
  const principal = Math.round(nonNegative(entry.principalAmount));
  const base = {
    id: entry.id,
    label: entry.label,
    instrumentType: entry.instrumentType,
    principal,
  };

  if (entry.payoutConfirmed && entry.payoutAmount !== null && Number.isFinite(entry.payoutAmount)) {
    const payout = Math.round(entry.payoutAmount);
    return {
      ...base,
      basis: "confirmed",
      grossProfit: payout - principal,
      tdsPct: null,
      taxWithheld: 0,
      netProfit: payout - principal,
      maturityValue: payout,
      taxModelled: false,
      marketLinked: false,
    };
  }

  const years = nonNegative(entry.termMonths) / 12;
  const rate = nonNegative(entry.expectedRatePct) / 100;

  if (entry.instrumentType === "DONATION") {
    return {
      ...base,
      basis: "projected",
      grossProfit: 0,
      tdsPct: null,
      taxWithheld: 0,
      netProfit: 0,
      maturityValue: 0,
      taxModelled: false,
      marketLinked: false,
    };
  }

  const specId = CATALOG_ID_FOR_TYPE[entry.instrumentType];
  const spec = specId ? INSTRUMENT_CATALOG.find((s) => s.id === specId) : undefined;

  if (!spec) {
    const profit = Math.round(principal * rate * years);
    return {
      ...base,
      basis: "projected",
      grossProfit: profit,
      tdsPct: null,
      taxWithheld: 0,
      netProfit: profit,
      maturityValue: principal + profit,
      taxModelled: false,
      marketLinked: false,
    };
  }

  const tdsPct = spec.tdsRatePct(hasPSR, principal);
  const netRate = rate * (1 - tdsPct / 100);
  const compounds = spec.compounds !== false;

  const pretaxValue = compounds
    ? principal * Math.pow(1 + rate, years)
    : principal + principal * rate * years;
  const netValue = compounds
    ? principal * Math.pow(1 + netRate, years)
    : principal + principal * netRate * years;

  const maturityValue = Math.round(netValue);
  const netProfit = maturityValue - principal;
  const grossProfit = Math.round(pretaxValue) - principal;

  return {
    ...base,
    basis: "projected",
    grossProfit,
    tdsPct,
    taxWithheld: grossProfit - netProfit,
    netProfit,
    maturityValue,
    taxModelled: true,
    marketLinked: Boolean(spec.isMarketLinked),
  };
}

export interface PortfolioSummary {
  projections: InvestmentProjection[];
  count: number;
  totalPrincipal: number;
  /** Real profit on confirmed payouts plus projected profit on the rest. */
  totalNetProfit: number;
  confirmedProfit: number;
  projectedProfit: number;
  totalMaturityValue: number;
  /** At least one entry's tax could not be modelled, so the total is before tax for it. */
  anyTaxNotModelled: boolean;
  anyMarketLinked: boolean;
}

/**
 * Projects every tracked investment and totals them. Donations are still
 * projected (to zero) so each row can look its figure up, but they are left out
 * of the totals: money given away isn't an investment and would inflate
 * "invested" without ever coming back.
 */
export function summarizePortfolio(
  entries: InvestmentEntryDTO[],
  opts: { hasPSR?: boolean } = {}
): PortfolioSummary {
  const projections = entries.map((e) => projectInvestment(e, opts));
  const counted = projections.filter((p) => p.instrumentType !== "DONATION");
  const sum = (pick: (p: InvestmentProjection) => number, only?: InvestmentProjection["basis"]) =>
    counted.filter((p) => !only || p.basis === only).reduce((s, p) => s + pick(p), 0);

  return {
    projections,
    count: counted.length,
    totalPrincipal: sum((p) => p.principal),
    totalNetProfit: sum((p) => p.netProfit),
    confirmedProfit: sum((p) => p.netProfit, "confirmed"),
    projectedProfit: sum((p) => p.netProfit, "projected"),
    totalMaturityValue: sum((p) => p.maturityValue),
    anyTaxNotModelled: counted.some((p) => p.basis === "projected" && !p.taxModelled),
    anyMarketLinked: counted.some((p) => p.marketLinked),
  };
}

export interface ConsolidatedProjection {
  /** Profit already tracked: real on confirmed payouts, projected on the rest. */
  trackedProfit: number;
  /** Extra after-tax profit from putting `reinvestAmount` into the suggested category. */
  reinvestProfit: number;
  /** trackedProfit + reinvestProfit. */
  consolidatedProfit: number;
}

/**
 * Combines profit the person is already on track to earn with the extra profit
 * from reinvesting money in a suggested category. `reinvestMaturityValue` is the
 * category's after-tax maturity value for `reinvestAmount` (as computed by
 * computeReinvestSuggestion), so only the incremental profit is added and the
 * payout being reinvested is not counted twice.
 */
export function consolidateWithReinvestment(
  portfolio: Pick<PortfolioSummary, "totalNetProfit">,
  reinvest: { amount: number; maturityValue: number }
): ConsolidatedProjection {
  const reinvestProfit = Math.round(reinvest.maturityValue - reinvest.amount);
  return {
    trackedProfit: portfolio.totalNetProfit,
    reinvestProfit,
    consolidatedProfit: portfolio.totalNetProfit + reinvestProfit,
  };
}
