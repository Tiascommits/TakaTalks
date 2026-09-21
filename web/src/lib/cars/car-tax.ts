/**
 * Core Financial Logic for Car Buying, Engine CC Slabs, BRTA Advance Income Tax (AIT),
 * Multiple-Car Wealth Surcharge, and Total Cost of Ownership (TCO).
 *
 * Grounded in:
 * - Bangladesh Income Tax Act 2023, Section 153 (Table 1 by engine cc, Table 2 by
 *   motor kW), as substituted by the Finance Act 2026 from 1 July 2026. Section 153(8)
 *   counts jeeps and microbuses as motor vehicles and excludes motorcycles.
 * - Finance Act Surcharge Schedule (10% floor for owning >1 motor vehicle)
 */

import {
  VehicleCategory,
  VehicleSlabConfig,
  CarAitInput,
  CarAitResult,
  TaxAbsorptionResult,
  MultiCarComparisonResult,
  CarTcoInput,
  CarTcoResult,
} from "./types";

export const VEHICLE_SLABS: Record<VehicleCategory, VehicleSlabConfig> = {
  CAR_UP_TO_1500CC: {
    id: "CAR_UP_TO_1500CC",
    nameEn: "Up to 1500cc Sedan / Hatchback / Crossover",
    nameBn: "১৫০০ সিসি পর্যন্ত প্রাইভেট কার / হ্যাচব্যাক / ক্রসওভার",
    engineDescEn: "Up to 1500cc (1.5L)",
    engineDescBn: "১৫০০ সিসি পর্যন্ত (১.৫ লিটার)",
    typicalCarsEn: "Toyota Axio, Fielder, Allion 1.5, Premio 1.5, Yaris Cross, Honda Vezel 1.5, Suzuki Swift, Raize",
    typicalCarsBn: "টয়োটা এক্সিও, ফিল্ডার, এলিয়ন ১.৫, প্রিমিও ১.৫, ইয়ারিস, সুজুকি সুইফট, রেজ",
    baseAnnualAit: 25_000,
    fuelType: "PETROL_OCTANE",
  },
  CAR_1501_TO_2000CC: {
    id: "CAR_1501_TO_2000CC",
    nameEn: "1501cc to 2000cc Sedan / SUV / MPV",
    nameBn: "১৫০১ থেকে ২০০০ সিসি সেডান / এসইউভি / এমপিভি",
    engineDescEn: "1501cc – 2000cc (1.8L - 2.0L)",
    engineDescBn: "১৫০১ - ২০০০ সিসি (১.৮ - ২.০ লিটার)",
    typicalCarsEn: "Toyota Premio 1.8/2.0, Noah 2.0, Voxy 2.0, Honda Civic 1.8, CR-V 2.0, Harrier 2.0L",
    typicalCarsBn: "টয়োটা প্রিমিও ১.৮/২.০, নোয়া ২.০, ভক্সি, হোন্ডা সিভিক ১.৮, সিআর-ভি ২.০, হ্যারিয়ার ২.০",
    baseAnnualAit: 50_000,
    fuelType: "PETROL_OCTANE",
  },
  CAR_2001_TO_2500CC: {
    id: "CAR_2001_TO_2500CC",
    nameEn: "2001cc to 2500cc Luxury / Midsize SUV",
    nameBn: "২০০১ থেকে ২৫০০ সিসি লাক্সারি সেডান / এসইউভি",
    engineDescEn: "2001cc – 2500cc (2.5L)",
    engineDescBn: "২০০১ - ২৫০০ সিসি (২.৫ লিটার)",
    typicalCarsEn: "Toyota Camry 2.5, Harrier 2.5 Hybrid, RAV4 2.5, Crown 2.5, Lexus NX",
    typicalCarsBn: "টয়োটা ক্যামরি ২.৫, হ্যারিয়ার ২.৫ হাইব্রিড, র‍্যাভ-৪ ২.৫, ক্রাউন ২.৫",
    baseAnnualAit: 75_000,
    fuelType: "HYBRID",
  },
  CAR_2501_TO_3000CC: {
    id: "CAR_2501_TO_3000CC",
    nameEn: "2501cc to 3000cc Full-size SUV / Jeep",
    nameBn: "২৫০১ থেকে ৩০০০ সিসি ফুল-সাইজ এসইউভি / জিপ",
    engineDescEn: "2501cc – 3000cc (2.7L - 3.0L)",
    engineDescBn: "২৫০১ - ৩০০০ সিসি (২.৭ - ৩.০ লিটার)",
    typicalCarsEn: "Toyota Land Cruiser Prado 2.7L, Lexus RX350, BMW X5 3.0",
    typicalCarsBn: "টয়োটা ল্যান্ড ক্রুজার প্রাডো ২.৭ লিটার, লেক্সাস আরএক্স, বিএমডাব্লিউ এক্স-৫",
    baseAnnualAit: 200_000,
    fuelType: "PETROL_OCTANE",
  },
  CAR_3001_TO_3500CC: {
    id: "CAR_3001_TO_3500CC",
    nameEn: "3001cc to 3500cc Premium Luxury SUV",
    nameBn: "৩০০১ থেকে ৩৫০০ সিসি প্রিমিয়াম লাক্সারি এসইউভি",
    engineDescEn: "3001cc – 3500cc (3.5L)",
    engineDescBn: "৩০০১ - ৩৫০০ সিসি (৩.৫ লিটার)",
    typicalCarsEn: "Mercedes-Benz GLE 350, Lexus LX/RX 3500cc, Ford Explorer V6",
    typicalCarsBn: "মার্সিডিজ-বেঞ্জ জিএলই ৩৫০, লেক্সাস ৩৫০০ সিসি, ফোর্ড এক্সপ্লোরার",
    baseAnnualAit: 250_000,
    fuelType: "PETROL_OCTANE",
  },
  CAR_3501_TO_4500CC: {
    id: "CAR_3501_TO_4500CC",
    nameEn: "3501cc to 4500cc Flagship SUV",
    nameBn: "৩৫০১ থেকে ৪৫০০ সিসি ফ্ল্যাগশিপ এসইউভি",
    engineDescEn: "3501cc – 4500cc (4.0L - 4.5L)",
    engineDescBn: "৩৫০১ - ৪৫০০ সিসি (৪.০ - ৪.৫ লিটার)",
    typicalCarsEn: "Toyota Land Cruiser V8 (4.5L), Range Rover Vogue",
    typicalCarsBn: "টয়োটা ল্যান্ড ক্রুজার ভি৮ (৪.৫ লিটার), রেঞ্জ রোভার ভোগ",
    baseAnnualAit: 400_000,
    fuelType: "PETROL_OCTANE",
  },
  CAR_ABOVE_4500CC: {
    id: "CAR_ABOVE_4500CC",
    nameEn: "Above 4500cc Supercar / Full-size V8+",
    nameBn: "৪৫০০ সিসির উপরে সুপারকার / ফুল-সাইজ ভি৮+",
    engineDescEn: "Above 4500cc (5.0L+)",
    engineDescBn: "৪৫০০ সিসির উপরে (৫.০ লিটার+)",
    typicalCarsEn: "Toyota Land Cruiser 5.7L, Lexus LX 570",
    typicalCarsBn: "টয়োটা ল্যান্ড ক্রুজার ৫.৭ লিটার, লেক্সাস এলএক্স ৫৭০",
    baseAnnualAit: 500_000,
    fuelType: "PETROL_OCTANE",
  },
  MICROBUS: {
    id: "MICROBUS",
    nameEn: "Microbus / Double-Cabin Pickup (Any CC)",
    nameBn: "মাইক্রোবাস / ডাবল কেবিন পিকআপ (যেকোনো সিসি)",
    engineDescEn: "Van / Microbus seating up to 15 passengers, or double-cabin pickup",
    engineDescBn: "১৫ আসন পর্যন্ত ভ্যান বা মাইক্রোবাস, অথবা ডাবল কেবিন পিকআপ",
    typicalCarsEn: "Toyota HiAce, Nissan Caravan, Hyundai H1, Toyota Hilux double cab",
    typicalCarsBn: "টয়োটা হাইয়েস, নিশান ক্যারাভান, হুন্দাই এইচ-১, টয়োটা হাইলাক্স ডাবল কেবিন",
    baseAnnualAit: 40_000,
    fuelType: "PETROL_OCTANE",
  },
  EV_UP_TO_200KW: {
    id: "EV_UP_TO_200KW",
    nameEn: "Electric Vehicle (Up to 200 kW)",
    nameBn: "বৈদ্যুতিক গাড়ি (২০০ কিলোওয়াট পর্যন্ত)",
    engineDescEn: "EV motor capacity up to 200 kW (~268 HP)",
    engineDescBn: "মোটর ক্ষমতা ২০০ কিলোওয়াট পর্যন্ত (~২৬৮ হর্সপাওয়ার)",
    typicalCarsEn: "BYD Seagull, Wuling Bingo, Tata Tiago EV, BYD Dolphin, MG ZS EV, Hyundai Kona EV, BYD Atto 3, MG4 EV",
    typicalCarsBn: "বিওয়াইডি সীগাল, উলিং বিঙ্গো, টাটা টিয়াগো ইভি, বিওয়াইডি ডলফিন, এমজি জেডএস ইভি, হুন্দাই কোনা ইভি, বিওয়াইডি অ্যাটো ৩, এমজি-৪ ইভি",
    baseAnnualAit: 25_000,
    fuelType: "EV",
  },
  EV_201_TO_300KW: {
    id: "EV_201_TO_300KW",
    nameEn: "Electric Vehicle (201 kW to 300 kW)",
    nameBn: "বৈদ্যুতিক গাড়ি (২০১ থেকে ৩০০ কিলোওয়াট)",
    engineDescEn: "EV motor capacity 201 kW – 300 kW (~269 - 402 HP)",
    engineDescBn: "মোটর ক্ষমতা ২০১ - ৩০০ কিলোওয়াট (~২৬৯ - ৪০২ হর্সপাওয়ার)",
    typicalCarsEn: "BYD Seal (RWD), Kia EV6 (AWD)",
    typicalCarsBn: "বিওয়াইডি সিল (আরডব্লিউডি), কিয়া ইভি-৬ (এডব্লিউডি)",
    baseAnnualAit: 50_000,
    fuelType: "EV",
  },
  EV_301_TO_400KW: {
    id: "EV_301_TO_400KW",
    nameEn: "Electric Vehicle (301 kW to 400 kW)",
    nameBn: "বৈদ্যুতিক গাড়ি (৩০১ থেকে ৪০০ কিলোওয়াট)",
    engineDescEn: "EV motor capacity 301 kW – 400 kW (~403 - 536 HP)",
    engineDescBn: "মোটর ক্ষমতা ৩০১ - ৪০০ কিলোওয়াট (~৪০৩ - ৫৩৬ হর্সপাওয়ার)",
    typicalCarsEn: "BYD Seal AWD",
    typicalCarsBn: "বিওয়াইডি সিল এডব্লিউডি",
    baseAnnualAit: 75_000,
    fuelType: "EV",
  },
  EV_ABOVE_400KW: {
    id: "EV_ABOVE_400KW",
    nameEn: "Electric Vehicle (Above 400 kW High Performance)",
    nameBn: "বৈদ্যুতিক গাড়ি (৪০০ কিলোওয়াটের উপরে হাই-পারফরম্যান্স)",
    engineDescEn: "EV motor capacity above 400 kW (537+ HP)",
    engineDescBn: "মোটর ক্ষমতা ৪০০ কিলোওয়াটের বেশি (৫৩৭+ হর্সপাওয়ার)",
    typicalCarsEn: "Porsche Taycan Turbo, Audi RS e-tron GT",
    typicalCarsBn: "পোর্শে টাইকান টার্বো, অডি আরএস ই-ট্রন জিটি",
    baseAnnualAit: 100_000,
    fuelType: "EV",
  },
};

/**
 * Calculates BRTA Advance Income Tax (AIT) for a given vehicle category,
 * applying the statutory 50% penalty surcharge if this is a 2nd or additional car.
 */
export function calculateCarAit(input: CarAitInput): CarAitResult {
  const config = VEHICLE_SLABS[input.category];
  const baseAit = config ? config.baseAnnualAit : 25_000;
  const effectiveMultiple = input.isSecondOrMoreCar ? 1.5 : 1.0;
  const penaltySurchargeAit = input.isSecondOrMoreCar ? Math.round(baseAit * 0.5) : 0;
  const totalAitDue = baseAit + penaltySurchargeAit;

  return {
    baseAit,
    penaltySurchargeAit,
    totalAitDue,
    effectiveMultiple,
  };
}

/**
 * Calculates how much of the vehicle AIT is offset against the taxpayer's
 * regular annual income tax liability vs. how much is lost as sunk cost.
 */
export function calculateTaxAbsorption(
  totalAitDue: number,
  annualTaxLiability: number
): TaxAbsorptionResult {
  const safeTax = Math.max(0, annualTaxLiability);
  const safeAit = Math.max(0, totalAitDue);

  const absorbedAit = Math.min(safeAit, safeTax);
  const wastedAit = Math.max(0, safeAit - safeTax);
  const netPayableAfterAit = Math.max(0, safeTax - safeAit);

  let status: "FULLY_ABSORBED" | "PARTIALLY_ABSORBED" | "PURE_SUNK_COST" = "FULLY_ABSORBED";
  let percentageAbsorbed = 100;

  if (safeTax === 0) {
    status = "PURE_SUNK_COST";
    percentageAbsorbed = 0;
  } else if (safeTax < safeAit) {
    status = "PARTIALLY_ABSORBED";
    percentageAbsorbed = Math.round((absorbedAit / safeAit) * 100);
  } else {
    status = "FULLY_ABSORBED";
    percentageAbsorbed = 100;
  }

  let insightEn = "";
  let insightBn = "";

  if (status === "FULLY_ABSORBED") {
    insightEn = `Your annual income tax (৳${safeTax.toLocaleString()}) fully absorbs the ৳${safeAit.toLocaleString()} car AIT. The car AIT effectively costs you ৳0 in net new tax because it reduces your year-end tax bill to ৳${netPayableAfterAit.toLocaleString()}.`;
    insightBn = `আপনার বাৎসরিক ট্যাক্স (৳${safeTax.toLocaleString()}) এই গাড়ির ৳${safeAit.toLocaleString()} এআইটিকে সম্পূর্ণ অ্যাডজাস্ট করে নেয়। ফলে এই গাড়ির এআইটি দিতে আপনার বাড়তি কোনো খরচ হচ্ছে না, কারণ বছর শেষে আপনার নিট প্রদেয় কর কমে ৳${netPayableAfterAit.toLocaleString()} হবে।`;
  } else if (status === "PARTIALLY_ABSORBED") {
    insightEn = `Your annual income tax (৳${safeTax.toLocaleString()}) can only offset ৳${absorbedAit.toLocaleString()} of the ৳${safeAit.toLocaleString()} AIT. You are losing ৳${wastedAit.toLocaleString()} every year as non-refundable sunk tax.`;
    insightBn = `আপনার বাৎসরিক ট্যাক্স (৳${safeTax.toLocaleString()}) গাড়ির ৳${safeAit.toLocaleString()} এআইটির মধ্যে মাত্র ৳${absorbedAit.toLocaleString()} অ্যাডজাস্ট করতে পারে। বাকি ৳${wastedAit.toLocaleString()} প্রতি বছর নন-রিফান্ডেবল অপচয় হচ্ছে।`;
  } else {
    insightEn = `Because your annual income tax liability is ৳0, the entire ৳${safeAit.toLocaleString()} car AIT is pure sunk cost every year. AIT cannot be refunded.`;
    insightBn = `আপনার বাৎসরিক ইনকাম ট্যাক্স ৳০ হওয়ায় পুরো ৳${safeAit.toLocaleString()} এআইটিই অতিরিক্ত খরচ হিসেবে নষ্ট হচ্ছে। বিআরটিএ-তে প্রদত্ত এআইটি কখনো রিফান্ড পাওয়া যায় না।`;
  }

  return {
    annualTaxLiability: safeTax,
    totalAitDue: safeAit,
    absorbedAit,
    wastedAit,
    netPayableAfterAit,
    status,
    percentageAbsorbed,
    insightEn,
    insightBn,
  };
}

/**
 * Quantifies the dual financial penalty of buying a 2nd car in Bangladesh:
 * 1. 50% extra BRTA AIT
 * 2. Statutory 10% Wealth Surcharge on entire income tax bill
 */
export function calculateMultiCarComparison(
  carCategory: VehicleCategory,
  totalAnnualTaxLiability: number
): MultiCarComparisonResult {
  const single = calculateCarAit({ category: carCategory, isSecondOrMoreCar: false });
  const second = calculateCarAit({ category: carCategory, isSecondOrMoreCar: true });

  const extraAitFromSecondCar = second.totalAitDue - single.baseAit; // 50% extra AIT
  const statutorySurchargeRate = 0.10; // 10% statutory floor
  const annualSurchargeAmount = Math.round(totalAnnualTaxLiability * statutorySurchargeRate);

  const totalAnnualPenaltyCost = extraAitFromSecondCar + annualSurchargeAmount;
  const monthlyEquivalentPenalty = Math.round(totalAnnualPenaltyCost / 12);

  // In Dhaka, a heavy ride-sharing / Uber Premier user spends around ৳18,000 - ৳25,000 / month
  const alternativeUberMonthlyBudget = 22_000;

  let breakEvenRecommendationEn = "";
  let breakEvenRecommendationBn = "";

  if (annualSurchargeAmount > 40_000) {
    breakEvenRecommendationEn = `Registering a 2nd vehicle under your TIN triggers a statutory 10% wealth surcharge floor (৳${annualSurchargeAmount.toLocaleString()}/yr) on your entire tax liability plus ৳${extraAitFromSecondCar.toLocaleString()} extra AIT. Total extra annual government levy: ৳${totalAnnualPenaltyCost.toLocaleString()}/yr. Given this substantial recurring cost, evaluate whether alternative corporate transport arrangements or a ride-sharing budget (approx ৳${alternativeUberMonthlyBudget.toLocaleString()}/mo) is more cost-effective before purchasing a 2nd private car.`;
    breakEvenRecommendationBn = `আপনার টিআইএন-এ ২য় গাড়ি রেজিস্টার করলে আয়কর আইন অনুযায়ী ১০% ন্যূনতম ওয়েলথ সারচার্জ (৳${annualSurchargeAmount.toLocaleString()}/বছর) এবং ৫০% অতিরিক্ত এআইটি (৳${extraAitFromSecondCar.toLocaleString()}/বছর) যুক্ত হবে। মোট বাড়তি সরকারি কর ও ফি: বছরে ৳${totalAnnualPenaltyCost.toLocaleString()}। ২য় গাড়ি কেনার আগে এই অতিরিক্ত বার্ষিক ব্যয়ের তুলনায় বিকল্প যাতায়াত ব্যবস্থা (মাসে আনুমানিক ৳${alternativeUberMonthlyBudget.toLocaleString()}) সাশ্রয়ী কি না তা মূল্যায়ন করুন।`;
  } else {
    breakEvenRecommendationEn = `Owning 2 cars in your name adds ৳${totalAnnualPenaltyCost.toLocaleString()} annually in extra AIT and wealth surcharge (৳${monthlyEquivalentPenalty.toLocaleString()}/mo). Factor this statutory overhead into your annual budget before purchasing.`;
    breakEvenRecommendationBn = `নিজের নামে ২টি গাড়ি রাখলে অতিরিক্ত এআইটি ও সারচার্জ বাবদ বছরে ৳${totalAnnualPenaltyCost.toLocaleString()} (মাসে ৳${monthlyEquivalentPenalty.toLocaleString()}) বাড়তি খরচ হবে। গাড়ি কেনার আগেই এই আইনি খরচটি বাৎসরিক বাজেটে বিবেচনায় রাখুন।`;
  }

  return {
    totalAnnualTaxLiability,
    singleCarAit: single.baseAit,
    secondCarAit: second.totalAitDue,
    extraAitFromSecondCar,
    statutorySurchargeRate,
    annualSurchargeAmount,
    totalAnnualPenaltyCost,
    monthlyEquivalentPenalty,
    alternativeUberMonthlyBudget,
    breakEvenRecommendationEn,
    breakEvenRecommendationBn,
  };
}

/**
 * Calculates Total Cost of Ownership (TCO) per month and benchmarks
 * against the household income (15-20% affordability rule).
 */
export function calculateCarTco(input: CarTcoInput): CarTcoResult {
  const safePrice = Math.max(0, input.vehiclePrice);
  const safeDown = Math.min(safePrice, Math.max(0, input.downPayment));
  const loanPrincipal = safePrice - safeDown;

  // Monthly Loan EMI (Reducing balance)
  let monthlyLoanEmi = 0;
  if (loanPrincipal > 0 && input.loanTenureYears > 0) {
    const monthlyRate = input.loanInterestRatePct / 100 / 12;
    const totalMonths = input.loanTenureYears * 12;
    if (monthlyRate > 0) {
      monthlyLoanEmi = Math.round(
        (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1)
      );
    } else {
      monthlyLoanEmi = Math.round(loanPrincipal / totalMonths);
    }
  }

  // Monthly Fuel/Charging Cost
  // Estimates based on Dhaka urban driving conditions (2025-2026 prices):
  // Octane @ ৳125/L, avg 8 km/L -> ৳15.6 / km
  // Hybrid @ ৳125/L, avg 15 km/L -> ৳8.3 / km
  // EV @ ৳12/kWh, avg 5.5 km/kWh -> ৳2.2 / km
  // CNG/LPG -> ~৳6.5 / km
  let costPerKm = 15.6;
  if (input.fuelType === "HYBRID") costPerKm = 8.3;
  else if (input.fuelType === "EV") costPerKm = 2.2;
  else if (input.fuelType === "CNG_LPG") costPerKm = 6.5;

  const monthlyFuelCost = Math.round(input.monthlyKm * costPerKm);

  // Driver Cost
  const monthlyDriverCost = input.hasDriver ? Math.max(0, input.driverSalaryMonthly) : 0;

  // Maintenance & Wear/Tear (~2% of vehicle price annually)
  const monthlyMaintenanceRepair = Math.round((safePrice * 0.02) / 12);

  // BRTA fees, Tax Token, Fitness & Insurance (~1.2% of price annually + parking)
  const monthlyBrtaFeesAndInsurance = Math.round(
    (safePrice * 0.012) / 12 + Math.max(0, input.parkingTollMonthly)
  );

  // Depreciation (~10% annual loss in value)
  const monthlyDepreciationCost = Math.round((safePrice * 0.10) / 12);

  // Total running cost (operational out-of-pocket, excluding loan EMI)
  const totalMonthlyRunningCost =
    monthlyFuelCost +
    monthlyDriverCost +
    monthlyMaintenanceRepair +
    monthlyBrtaFeesAndInsurance;

  // Total monthly commitment (running cost + loan EMI)
  const totalMonthlyCommitment = totalMonthlyRunningCost + monthlyLoanEmi;

  // Affordability Ratio
  const safeIncome = Math.max(1, input.monthlyHouseholdIncome);
  const affordabilityRatio = Number(((totalMonthlyCommitment / safeIncome) * 100).toFixed(1));

  let affordabilityStatus: "SAFE" | "STRETCHED" | "RISKY" = "SAFE";
  if (affordabilityRatio <= 15) {
    affordabilityStatus = "SAFE";
  } else if (affordabilityRatio <= 25) {
    affordabilityStatus = "STRETCHED";
  } else {
    affordabilityStatus = "RISKY";
  }

  let recommendationEn = "";
  let recommendationBn = "";

  if (affordabilityStatus === "SAFE") {
    recommendationEn = `Healthy Affordability: Total monthly vehicle expenses (৳${totalMonthlyCommitment.toLocaleString()}) represent ${affordabilityRatio}% of your net household income, well within the safe 15% rule.`;
    recommendationBn = `নিরাপদ বাজেট: গাড়ির মাসিক মোট খরচ (৳${totalMonthlyCommitment.toLocaleString()}) আপনার পারিবারিক আয়ের ${affordabilityRatio}%, যা আন্তর্জাতিক নিরাপদ সীমা ১৫%-এর মধ্যেই আছে।`;
  } else if (affordabilityStatus === "STRETCHED") {
    recommendationEn = `Manageable but Stretched: Vehicle commitments consume ${affordabilityRatio}% of your monthly income. Keep emergency buffers for major repairs and annual BRTA renewal.`;
    recommendationBn = `টাইট বাজেট: গাড়ির মোট খরচ আপনার মাসিক আয়ের ${affordabilityRatio}%, যা কিছুটা ঝুঁকিপূর্ণ। হঠাৎ মেরামত ও বাৎসরিক ফি দেওয়ার জন্য আলাদা ফান্ড রাখুন।`;
  } else {
    recommendationEn = `High Financial Risk: At ${affordabilityRatio}% of your monthly take-home, vehicle costs exceed the recommended 20% ceiling. Consider a lower-CC car, hybrid/EV, self-driving instead of a chauffeur, or delaying the purchase.`;
    recommendationBn = `উচ্চ আর্থিক ঝুঁকি: মাসিক আয়ের ${affordabilityRatio}% গাড়ির পেছনে ব্যয় হওয়া অতিরিক্ত বোঝা। কম সিসির গাড়ি, হাইব্রিড/ইভি, বা ড্রাইভার ছাড়া নিজে ড্রাইভ করার কথা ভাবুন।`;
  }

  return {
    monthlyLoanEmi,
    monthlyFuelCost,
    monthlyDriverCost,
    monthlyMaintenanceRepair,
    monthlyBrtaFeesAndInsurance,
    monthlyDepreciationCost,
    totalMonthlyRunningCost,
    totalMonthlyCommitment,
    affordabilityRatio,
    affordabilityStatus,
    recommendationEn,
    recommendationBn,
  };
}
