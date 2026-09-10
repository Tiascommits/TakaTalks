export interface TaxCalculatorInput {
  categoryId: string;
  disabledChildren: number;
  firstTimeFiler: boolean;

  // Salary (monthly unless noted)
  basicMonthly: number;
  allowanceMonthly: number;
  bonusAnnual: number;
  employerPFMonthly: number;

  businessAnnual: number;
  housePropertyAnnual: number;
  otherIncomeAnnual: number;

  // Capital gains (annual)
  cgSharesFund: number;
  cgWithin5Years: number;
  cgAfter5Years: number;
  cgLand: number;
  cgGold: number;

  // Investments
  invSanchayAnnual: number;
  invBondAnnual: number;
  invMFAnnual: number;
  invStockAnnual: number;
  invLifeAnnual: number;
  invPFMonthly: number;
  invDPSMonthly: number;
  invDonationAnnual: number;

  aitPaid: number;

  // Net wealth (opt-in)
  netWealth: number;
  multiCar: boolean;
  bigHouse: boolean;
}

export const EMPTY_TAX_INPUT: TaxCalculatorInput = {
  categoryId: "general",
  disabledChildren: 0,
  firstTimeFiler: false,
  basicMonthly: 0,
  allowanceMonthly: 0,
  bonusAnnual: 0,
  employerPFMonthly: 0,
  businessAnnual: 0,
  housePropertyAnnual: 0,
  otherIncomeAnnual: 0,
  cgSharesFund: 0,
  cgWithin5Years: 0,
  cgAfter5Years: 0,
  cgLand: 0,
  cgGold: 0,
  invSanchayAnnual: 0,
  invBondAnnual: 0,
  invMFAnnual: 0,
  invStockAnnual: 0,
  invLifeAnnual: 0,
  invPFMonthly: 0,
  invDPSMonthly: 0,
  invDonationAnnual: 0,
  aitPaid: 0,
  netWealth: 0,
  multiCar: false,
  bigHouse: false,
};

export interface SlabRow {
  rate: number;
  chunk: number;
  tax: number;
}

export interface TaxCalculationResult {
  taxFree: number;

  grossSalary: number;
  salaryExemption: number;
  taxableSalary: number;

  business: number;
  houseProperty: number;
  otherIncome: number;

  sharesFundGain: number;
  sharesFundExempt: number;
  sharesFundTaxable: number;
  cgWithin5: number;
  cgLand: number;

  slabBase: number;
  incomeAboveTaxFree: number;
  baseSlabTax: number;
  slabRows: SlabRow[];

  flatShareTax: number;
  flatAfter5Tax: number;
  flatGoldTax: number;
  flatCGTax: number;
  grossTax: number;

  sharedGroupRaw: number;
  sharedGroupCapped: number;
  dpsAnnual: number;
  dpsEligible: number;
  pfAnnual: number;
  totalInvestment: number;

  rebate3pct: number;
  rebate10pct: number;
  rebate: number;

  taxAfterRebate: number;
  minApplied: boolean;
  minFloor: number;

  surchargeRate: number;
  surchargeAmt: number;
  totalLiability: number;
  netPayable: number;

  hasAnyIncome: boolean;
}

export interface OptimizerSuggestion {
  instrumentId: string;
  label: string;
  investMore: number;
  note: string;
  taxSavingFromThis: number;
}

export interface OptimizerResult {
  maxRebate: number;
  rebateGap: number;
  taxSaving: number;
  additionalInvestmentNeeded: number;
  investmentNeeded: number;
  suggestions: OptimizerSuggestion[];
  alreadyAtMax: boolean;
  hasTaxableIncome: boolean;
}
