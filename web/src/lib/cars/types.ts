/**
 * Types for the Car Buying, CC Tier, and Advance Income Tax (AIT) Engine.
 * Grounded in:
 * - Bangladesh Income Tax Act 2023, Section 153 (Table 1 by engine cc, Table 2 by
 *   motor kW), as substituted by the Finance Act 2026 from 1 July 2026
 * - BRTA annual fitness renewal & advance tax rules
 * - Surcharge rules on multiple motor cars
 */

export type FuelType = "PETROL_OCTANE" | "HYBRID" | "EV" | "CNG_LPG";

export type VehicleCategory =
  | "CAR_UP_TO_1500CC"
  | "CAR_1501_TO_2000CC"
  | "CAR_2001_TO_2500CC"
  | "CAR_2501_TO_3000CC"
  | "CAR_3001_TO_3500CC"
  | "CAR_3501_TO_4500CC"
  | "CAR_ABOVE_4500CC"
  | "MICROBUS"
  | "EV_UP_TO_200KW"
  | "EV_201_TO_300KW"
  | "EV_301_TO_400KW"
  | "EV_ABOVE_400KW";

export interface VehicleSlabConfig {
  id: VehicleCategory;
  nameEn: string;
  nameBn: string;
  engineDescEn: string;
  engineDescBn: string;
  typicalCarsEn: string;
  typicalCarsBn: string;
  baseAnnualAit: number;
  fuelType: FuelType;
}

export interface CarAitInput {
  category: VehicleCategory;
  isSecondOrMoreCar: boolean;
}

export interface CarAitResult {
  baseAit: number;
  penaltySurchargeAit: number; // 50% extra if 2nd or more car under same TIN
  totalAitDue: number;
  effectiveMultiple: number; // 1.0 or 1.5
}

export type AbsorptionStatus =
  | "FULLY_ABSORBED"
  | "PARTIALLY_ABSORBED"
  | "PURE_SUNK_COST";

export interface TaxAbsorptionResult {
  annualTaxLiability: number;
  totalAitDue: number;
  absorbedAit: number; // The portion offset against income tax
  wastedAit: number; // The portion lost because liability < AIT
  netPayableAfterAit: number; // Remaining income tax payable to NBR
  status: AbsorptionStatus;
  percentageAbsorbed: number;
  insightEn: string;
  insightBn: string;
}

export interface MultiCarComparisonResult {
  totalAnnualTaxLiability: number;
  singleCarAit: number;
  secondCarAit: number;
  extraAitFromSecondCar: number;
  statutorySurchargeRate: number; // 0.10 (10%) floor for multiple cars
  annualSurchargeAmount: number;
  totalAnnualPenaltyCost: number; // extra 50% AIT + 10% tax surcharge
  monthlyEquivalentPenalty: number;
  alternativeUberMonthlyBudget: number;
  breakEvenRecommendationEn: string;
  breakEvenRecommendationBn: string;
}

export interface CarTcoInput {
  vehiclePrice: number; // In BDT (e.g. 2,500,000)
  downPayment: number; // In BDT
  loanTenureYears: number; // e.g. 3 or 5 years (0 if cash)
  loanInterestRatePct: number; // e.g. 12%
  monthlyKm: number; // e.g. 1000 km
  fuelType: FuelType;
  hasDriver: boolean;
  driverSalaryMonthly: number; // default 20000
  parkingTollMonthly: number; // default 4000
  monthlyHouseholdIncome: number; // Net take-home
}

export interface CarTcoResult {
  monthlyLoanEmi: number;
  monthlyFuelCost: number;
  monthlyDriverCost: number;
  monthlyMaintenanceRepair: number;
  monthlyBrtaFeesAndInsurance: number;
  monthlyDepreciationCost: number;
  totalMonthlyRunningCost: number; // Excluding loan EMI
  totalMonthlyCommitment: number; // Including loan EMI
  affordabilityRatio: number; // totalMonthlyCommitment / monthlyHouseholdIncome
  affordabilityStatus: "SAFE" | "STRETCHED" | "RISKY";
  recommendationEn: string;
  recommendationBn: string;
}
