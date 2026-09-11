import type { IncomeEntry, InvestmentEntry, TaxProfile } from "@prisma/client";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "@/lib/tax/types";

const CATEGORY_CODE_TO_ID: Record<string, string> = {
  GENERAL: "general",
  WOMAN_SENIOR: "woman_senior",
  THIRD_GENDER: "third_gender",
  DISABLED: "disabled",
  FREEDOM_FIGHTER: "freedom_fighter",
};

function annualize(amount: number, frequency: string): number {
  if (frequency === "MONTHLY") return amount * 12;
  return amount; // ANNUAL and ONE_TIME both treated as this year's total
}

/**
 * Best-effort mapping from tracker data to calculator input, so someone who
 * already logged their income/investments doesn't have to retype it. This is
 * a simplification: the tracker doesn't distinguish "basic vs. allowance" or
 * per-instrument monthly contribution the way the calculator form does, so
 * amounts land in the closest matching bucket rather than an exact split.
 */
export function deriveTaxInputFromTracker(
  income: IncomeEntry[],
  investments: InvestmentEntry[],
  profile: TaxProfile | null
): Partial<TaxCalculatorInput> {
  const input: Partial<TaxCalculatorInput> = { ...EMPTY_TAX_INPUT };

  let salaryAnnual = 0;
  let businessAnnual = 0;
  let housePropertyAnnual = 0;
  let otherIncomeAnnual = 0;
  let freelanceAnnual = 0;

  for (const e of income) {
    const annual = annualize(e.amount, e.frequency);
    switch (e.source) {
      case "salary":
        salaryAnnual += annual;
        break;
      case "business":
        businessAnnual += annual;
        break;
      case "rental":
        housePropertyAnnual += annual;
        break;
      case "freelance":
        freelanceAnnual += annual;
        break;
      default:
        otherIncomeAnnual += annual;
    }
  }

  input.basicMonthly = salaryAnnual / 12;
  input.businessAnnual = businessAnnual;
  input.housePropertyAnnual = housePropertyAnnual;
  input.otherIncomeAnnual = otherIncomeAnnual;
  input.freelanceAnnual = freelanceAnnual;

  for (const inv of investments) {
    const amount = inv.principalAmount;
    switch (inv.instrumentType) {
      case "SANCHAYPATRA":
        input.invSanchayAnnual = (input.invSanchayAnnual ?? 0) + amount;
        break;
      case "GOVT_BOND":
        input.invBondAnnual = (input.invBondAnnual ?? 0) + amount;
        break;
      case "MUTUAL_FUND":
        input.invMFAnnual = (input.invMFAnnual ?? 0) + amount;
        break;
      case "DSE_STOCK":
        input.invStockAnnual = (input.invStockAnnual ?? 0) + amount;
        break;
      case "LIFE_INSURANCE":
        input.invLifeAnnual = (input.invLifeAnnual ?? 0) + amount;
        break;
      case "PROVIDENT_FUND":
        input.invPFMonthly = (input.invPFMonthly ?? 0) + amount / 12;
        break;
      case "DPS":
        input.invDPSMonthly = (input.invDPSMonthly ?? 0) + amount / 12;
        break;
      case "DONATION":
        input.invDonationAnnual = (input.invDonationAnnual ?? 0) + amount;
        break;
      default:
        break;
    }
  }

  if (profile) {
    input.categoryId = CATEGORY_CODE_TO_ID[profile.category] ?? "general";
    input.disabledChildren = profile.disabledChildren;
    input.firstTimeFiler = profile.firstTimeFiler;
    input.netWealth = profile.netWealth;
    input.multiCar = profile.multiCar;
    input.bigHouse = profile.bigHouse;
  }

  return input;
}
