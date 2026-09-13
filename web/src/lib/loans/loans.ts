/**
 * Loan EMI & Prepayment Engine for Bangladesh.
 *
 * Provides:
 * 1. Standard reducing balance EMI calculation.
 * 2. Full amortization schedule (monthly & annual summaries).
 * 3. Prepayment accelerator (monthly extra + annual lump sum savings).
 * 4. Bangladesh statutory fees:
 *    - Bank processing fees + 15% NBR VAT.
 *    - National Board of Revenue (NBR) Excise Duty slabs on loan balances.
 */

export interface LoanPreset {
  id: string;
  nameEn: string;
  nameBn: string;
  principal: number;
  tenureYears: number;
  annualInterestRatePct: number;
  descriptionEn: string;
  descriptionBn: string;
}

export const LOAN_PRESETS: LoanPreset[] = [
  {
    id: "home_loan",
    nameEn: "Home / Apartment Loan",
    nameBn: "হোম / ফ্ল্যাট লোন",
    principal: 5_000_000,
    tenureYears: 20,
    annualInterestRatePct: 10.5,
    descriptionEn: "Typical 20-year apartment mortgage from DBH or commercial banks.",
    descriptionBn: "ডিবিএইচ বা বাণিজ্যিক ব্যাংক থেকে ২০ বছরের ফ্ল্যাট কেনার গৃহঋণ।",
  },
  {
    id: "auto_loan",
    nameEn: "Auto / Car Loan",
    nameBn: "অটো / গাড়ি লোন",
    principal: 2_000_000,
    tenureYears: 5,
    annualInterestRatePct: 11.5,
    descriptionEn: "5-year financing for sedan or crossover with commercial banks.",
    descriptionBn: "বাণিজ্যিক ব্যাংক হতে ৫ বছর মেয়াদী সেডান বা ক্রসওভার ক্রয় ঋণ।",
  },
  {
    id: "personal_loan",
    nameEn: "Personal Loan",
    nameBn: "পার্সোনাল লোন",
    principal: 500_000,
    tenureYears: 3,
    annualInterestRatePct: 13.0,
    descriptionEn: "Unsecured multi-purpose loan for family emergencies or home renovation.",
    descriptionBn: "জরুরি পারিবারিক প্রয়োজন বা বাসা সংস্কারে ৩ বছরের ব্যক্তিগত ঋণ।",
  },
  {
    id: "nano_loan",
    nameEn: "Digital Nano Loan",
    nameBn: "ডিজিটাল ন্যানো লোন",
    principal: 30_000,
    tenureYears: 0.5, // 6 months
    annualInterestRatePct: 9.0,
    descriptionEn: "Short-term instant digital credit via bKash / City Bank nano loan.",
    descriptionBn: "বিকাশ বা সিটি ব্যাংকের মতো ডিজিটাল ওয়ালেট থেকে ৬ মাসের তাৎক্ষণিক ঋণ।",
  },
];

/**
 * NBR Excise Duty Slabs on Bank Accounts & Loans in Bangladesh.
 * Source: National Board of Revenue & Bangladesh Bank circulars.
 */
export function calculateExciseDuty(amount: number): number {
  if (amount <= 100_000) return 0;
  if (amount <= 500_000) return 150;
  if (amount <= 1_000_000) return 500;
  if (amount <= 10_000_000) return 3_000;
  if (amount <= 50_000_000) return 15_000;
  return 50_000;
}

export interface AmortizationMonth {
  month: number;
  year: number;
  openingBalance: number;
  emi: number;
  principalPayment: number;
  interestPayment: number;
  extraPrepayment: number;
  totalPayment: number;
  closingBalance: number;
}

export interface AmortizationYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  extraPrepaid: number;
  totalPaid: number;
  endingBalance: number;
}

export interface LoanCalculationInput {
  principal: number;
  tenureYears: number;
  annualInterestRatePct: number;
  processingFeePct?: number; // default 0.5%
  extraMonthlyPayment?: number;
  annualLumpSumPrepayment?: number;
}

export interface LoanCalculationResult {
  principal: number;
  tenureMonths: number;
  annualInterestRatePct: number;
  monthlyInterestRate: number;
  standardMonthlyEMI: number;
  totalStandardInterest: number;
  totalStandardPayment: number;

  // With prepayment accelerator
  hasPrepayment: boolean;
  actualMonthsToPayoff: number;
  monthsSaved: number;
  actualTotalInterestPaid: number;
  interestSaved: number;
  actualTotalPayment: number;

  // Bangladesh statutory upfront charges
  processingFee: number;
  processingFeeVAT: number; // 15% NBR VAT
  estimatedExciseDuty: number; // First year excise duty
  totalUpfrontCharges: number;

  // Schedules
  monthlySchedule: AmortizationMonth[];
  yearlySchedule: AmortizationYear[];
}

export function calculateLoan(input: LoanCalculationInput): LoanCalculationResult {
  const principal = Math.max(0, input.principal);
  const tenureMonths = Math.max(1, Math.round(Math.max(0.1, input.tenureYears) * 12));
  const annualRate = Math.max(0, input.annualInterestRatePct);
  const monthlyRate = annualRate / 100 / 12;
  const processingFeePct = input.processingFeePct !== undefined ? Math.max(0, input.processingFeePct) : 0.5;
  const extraMonthly = Math.max(0, input.extraMonthlyPayment || 0);
  const annualLumpSum = Math.max(0, input.annualLumpSumPrepayment || 0);

  // Standard Reducing Balance EMI formula:
  // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
  let standardMonthlyEMI = 0;
  if (principal > 0) {
    if (monthlyRate === 0) {
      standardMonthlyEMI = principal / tenureMonths;
    } else {
      const factor = Math.pow(1 + monthlyRate, tenureMonths);
      standardMonthlyEMI = (principal * monthlyRate * factor) / (factor - 1);
    }
  }

  // Calculate baseline schedule without prepayments to get exact standard interest
  let standardTotalInterest = 0;
  let tempBalance = principal;
  for (let m = 1; m <= tenureMonths; m++) {
    const interest = tempBalance * monthlyRate;
    const principalPart = Math.min(tempBalance, standardMonthlyEMI - interest);
    standardTotalInterest += interest;
    tempBalance -= principalPart;
    if (tempBalance <= 0) break;
  }

  const roundedStandardInterest = Math.round(standardTotalInterest);
  const totalStandardPayment = principal + roundedStandardInterest;

  // Build actual schedule with prepayments
  const monthlySchedule: AmortizationMonth[] = [];
  let currentBalance = principal;
  let actualTotalInterest = 0;
  let actualTotalPrepaid = 0;
  let monthCounter = 0;

  while (currentBalance > 0.01 && monthCounter < 600) {
    monthCounter++;
    const currentYear = Math.ceil(monthCounter / 12);
    const openingBalance = currentBalance;
    const interestPart = openingBalance * monthlyRate;
    actualTotalInterest += interestPart;

    let scheduledPrincipal = standardMonthlyEMI - interestPart;
    if (scheduledPrincipal > openingBalance) {
      scheduledPrincipal = openingBalance;
    }

    let extraThisMonth = extraMonthly;
    if (monthCounter % 12 === 0 && annualLumpSum > 0) {
      extraThisMonth += annualLumpSum;
    }

    const remAfterScheduled = openingBalance - scheduledPrincipal;
    if (extraThisMonth > remAfterScheduled) {
      extraThisMonth = remAfterScheduled;
    }

    const actualPrincipalPaid = scheduledPrincipal + extraThisMonth;
    actualTotalPrepaid += extraThisMonth;
    const closingBalance = Math.max(0, openingBalance - actualPrincipalPaid);
    const emiPaid = scheduledPrincipal + interestPart;
    const totalMonthPaid = emiPaid + extraThisMonth;

    monthlySchedule.push({
      month: monthCounter,
      year: currentYear,
      openingBalance,
      emi: emiPaid,
      principalPayment: scheduledPrincipal,
      interestPayment: interestPart,
      extraPrepayment: extraThisMonth,
      totalPayment: totalMonthPaid,
      closingBalance,
    });

    currentBalance = closingBalance;
  }

  const roundedActualInterest = Math.round(actualTotalInterest);
  const actualMonthsToPayoff = monthCounter;
  const monthsSaved = Math.max(0, tenureMonths - actualMonthsToPayoff);
  const interestSaved = Math.max(0, roundedStandardInterest - roundedActualInterest);
  const hasPrepayment = (extraMonthly > 0 || annualLumpSum > 0) && interestSaved > 0;
  const actualTotalPayment = principal + roundedActualInterest;

  // Aggregate Yearly Schedule
  const yearlyMap = new Map<number, AmortizationYear>();
  for (const m of monthlySchedule) {
    const existing = yearlyMap.get(m.year) || {
      year: m.year,
      principalPaid: 0,
      interestPaid: 0,
      extraPrepaid: 0,
      totalPaid: 0,
      endingBalance: m.closingBalance,
    };
    existing.principalPaid += m.principalPayment;
    existing.interestPaid += m.interestPayment;
    existing.extraPrepaid += m.extraPrepayment;
    existing.totalPaid += m.totalPayment;
    existing.endingBalance = m.closingBalance;
    yearlyMap.set(m.year, existing);
  }
  const yearlySchedule = Array.from(yearlyMap.values());

  // Bangladesh Upfront Charges
  const processingFee = (principal * processingFeePct) / 100;
  const processingFeeVAT = processingFee * 0.15; // 15% NBR VAT
  const estimatedExciseDuty = calculateExciseDuty(principal);
  const totalUpfrontCharges = processingFee + processingFeeVAT + estimatedExciseDuty;

  return {
    principal,
    tenureMonths,
    annualInterestRatePct: annualRate,
    monthlyInterestRate: monthlyRate,
    standardMonthlyEMI: Math.round(standardMonthlyEMI),
    totalStandardInterest: roundedStandardInterest,
    totalStandardPayment,

    hasPrepayment,
    actualMonthsToPayoff,
    monthsSaved,
    actualTotalInterestPaid: roundedActualInterest,
    interestSaved,
    actualTotalPayment,

    processingFee: Math.round(processingFee),
    processingFeeVAT: Math.round(processingFeeVAT),
    estimatedExciseDuty,
    totalUpfrontCharges: Math.round(totalUpfrontCharges),

    monthlySchedule,
    yearlySchedule,
  };
}
