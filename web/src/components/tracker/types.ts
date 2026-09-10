export type IncomeFrequency = "MONTHLY" | "ANNUAL" | "ONE_TIME";

export interface IncomeEntryDTO {
  id: string;
  label: string;
  source: string;
  amount: number;
  frequency: IncomeFrequency;
  createdAt: string;
}

export type InstrumentType =
  | "SANCHAYPATRA"
  | "GOVT_BOND"
  | "MUTUAL_FUND"
  | "DSE_STOCK"
  | "LIFE_INSURANCE"
  | "PROVIDENT_FUND"
  | "DPS"
  | "DONATION"
  | "FIXED_DEPOSIT"
  | "OTHER";

export interface InvestmentEntryDTO {
  id: string;
  label: string;
  instrumentType: InstrumentType;
  principalAmount: number;
  startDate: string;
  termMonths: number;
  expectedRatePct: number;
  maturityDate: string;
  payoutConfirmed: boolean;
  payoutAmount: number | null;
}

export type TaxpayerCategoryCode =
  | "GENERAL"
  | "WOMAN_SENIOR"
  | "THIRD_GENDER"
  | "DISABLED"
  | "FREEDOM_FIGHTER";

export interface TaxProfileDTO {
  category: TaxpayerCategoryCode;
  disabledChildren: number;
  firstTimeFiler: boolean;
  netWealth: number;
  multiCar: boolean;
  bigHouse: boolean;
}

// Default (Bengali) labels — kept as the canonical, language-agnostic values
// used wherever a single label is needed (e.g. persisted display defaults).
export const INCOME_SOURCE_LABELS: Record<string, string> = {
  salary: "বেতন",
  freelance: "ফ্রিল্যান্স",
  business: "ব্যবসা",
  rental: "বাড়ি ভাড়া",
  other: "অন্যান্য",
};

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  SANCHAYPATRA: "সঞ্চয়পত্র",
  GOVT_BOND: "Govt Bond",
  MUTUAL_FUND: "Mutual Fund",
  DSE_STOCK: "DSE Stock",
  LIFE_INSURANCE: "জীবন বীমা",
  PROVIDENT_FUND: "Provident Fund",
  DPS: "DPS",
  DONATION: "দান",
  FIXED_DEPOSIT: "FDR",
  OTHER: "অন্যান্য",
};

export const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  MONTHLY: "মাসিক",
  ANNUAL: "বাৎসরিক",
  ONE_TIME: "একবার",
};

// English variants, keyed the same way, for the language toggle.
export const INCOME_SOURCE_LABELS_EN: Record<string, string> = {
  salary: "Salary",
  freelance: "Freelance",
  business: "Business",
  rental: "House rent",
  other: "Other",
};

export const INSTRUMENT_LABELS_EN: Record<InstrumentType, string> = {
  SANCHAYPATRA: "Sanchaypatra",
  GOVT_BOND: "Govt Bond",
  MUTUAL_FUND: "Mutual Fund",
  DSE_STOCK: "DSE Stock",
  LIFE_INSURANCE: "Life Insurance",
  PROVIDENT_FUND: "Provident Fund",
  DPS: "DPS",
  DONATION: "Donation",
  FIXED_DEPOSIT: "FDR",
  OTHER: "Other",
};

export const FREQUENCY_LABELS_EN: Record<IncomeFrequency, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
  ONE_TIME: "One-time",
};
