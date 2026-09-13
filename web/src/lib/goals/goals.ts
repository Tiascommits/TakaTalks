/**
 * Mathematical models and inflation-adjusted projections for Bangladeshi life goals
 * and retirement planning.
 *
 * Guiding principle: strictly deterministic math (compound interest, annuity formula,
 * statutory withholding tax TDS, and compounding inflation). Never issues financial
 * advice or recommends specific individual securities.
 */

export type GoalCategory =
  | "EMERGENCY_FUND"
  | "CAR_PURCHASE"
  | "FLAT_DOWNPAYMENT"
  | "CHILD_EDUCATION"
  | "HAJJ_UMRAH"
  | "RETIREMENT_FIRE"
  | "CUSTOM";

export interface GoalPreset {
  category: GoalCategory;
  titleEn: string;
  titleBn: string;
  defaultAmount: number;
  defaultYears: number;
  defaultInflationPct: number;
  icon: string;
  descriptionEn: string;
  descriptionBn: string;
}

export const GOAL_PRESETS: Record<GoalCategory, GoalPreset> = {
  EMERGENCY_FUND: {
    category: "EMERGENCY_FUND",
    titleEn: "Emergency Fund (3-6 Months)",
    titleBn: "জরুরি ফান্ড (৩-৬ মাসের খরচ)",
    defaultAmount: 300_000,
    defaultYears: 1,
    defaultInflationPct: 8.0,
    icon: "🛡️",
    descriptionEn: "3 to 6 months of basic living costs parked in high-liquidity, safe instruments.",
    descriptionBn: "৩ থেকে ৬ মাসের অপরিহার্য সংসার খরচ, যা যেকোনো বিপদে দ্রুত ক্যাশ করা যাবে।",
  },
  CAR_PURCHASE: {
    category: "CAR_PURCHASE",
    titleEn: "Car / Vehicle Purchase",
    titleBn: "গাড়ি কেনার স্বপ্ন",
    defaultAmount: 2_500_000,
    defaultYears: 4,
    defaultInflationPct: 9.0,
    icon: "🚗",
    descriptionEn: "Sedan or crossover purchase. Vehicle prices in BD correlate with USD/BDT and import duties.",
    descriptionBn: "সেডান বা ক্রসওভার ক্রয়। বাংলাদেশে গাড়ির দাম ডলার রেট ও শুল্কের সাথে বাড়ে।",
  },
  FLAT_DOWNPAYMENT: {
    category: "FLAT_DOWNPAYMENT",
    titleEn: "Apartment / Land Downpayment",
    titleBn: "ফ্ল্যাট বা জমির ডাউনপেমেন্ট",
    defaultAmount: 3_500_000,
    defaultYears: 5,
    defaultInflationPct: 8.5,
    icon: "🏢",
    descriptionEn: "20-30% initial downpayment + registration costs for buying an apartment or plot.",
    descriptionBn: "ফ্ল্যাট বা প্লট কেনার ২০-৩০% প্রাথমিক ডাউনপেমেন্ট এবং রেজিস্ট্রেশন খরচ।",
  },
  CHILD_EDUCATION: {
    category: "CHILD_EDUCATION",
    titleEn: "Child Higher Education",
    titleBn: "সন্তানের উচ্চশিক্ষা ফান্ড",
    defaultAmount: 4_000_000,
    defaultYears: 8,
    defaultInflationPct: 9.5,
    icon: "🎓",
    descriptionEn: "Local private university graduation or initial year tuition for studies abroad.",
    descriptionBn: "দেশীয় বেসরকারি বিশ্ববিদ্যালয় বা বিদেশে উচ্চশিক্ষার প্রাথমিক টিউশন ফি ফান্ড।",
  },
  HAJJ_UMRAH: {
    category: "HAJJ_UMRAH",
    titleEn: "Hajj / Umrah Pilgrimage",
    titleBn: "পবিত্র হজ্ব বা ওমরাহ ফান্ড",
    defaultAmount: 850_000,
    defaultYears: 3,
    defaultInflationPct: 8.0,
    icon: "🕋",
    descriptionEn: "Govt/private standard Hajj package for one or two pilgrims.",
    descriptionBn: "সরকারি বা বেসরকারি এজেন্সির মাধ্যমে পবিত্র হজ্বের স্ট্যান্ডার্ড প্যাকেজ ফান্ড।",
  },
  RETIREMENT_FIRE: {
    category: "RETIREMENT_FIRE",
    titleEn: "Retirement / Financial Freedom",
    titleBn: "অবসর / আর্থিক স্বাধীনতা (FIRE)",
    defaultAmount: 15_000_000,
    defaultYears: 15,
    defaultInflationPct: 8.5,
    icon: "🏖️",
    descriptionEn: "Long-term nest egg generating passive interest to cover monthly living expenses.",
    descriptionBn: "দীর্ঘমেয়াদী সঞ্চয় যা অবসরে প্রতি মাসে নিশ্চিন্তে সংসারের খরচ যোগাবে।",
  },
  CUSTOM: {
    category: "CUSTOM",
    titleEn: "Custom Life Goal",
    titleBn: "কাস্টম ভবিষ্যৎ লক্ষ্য",
    defaultAmount: 1_000_000,
    defaultYears: 3,
    defaultInflationPct: 8.5,
    icon: "🎯",
    descriptionEn: "Plan any personal financial milestone with custom inflation & tenure.",
    descriptionBn: "যেকোনো নির্দিষ্ট আর্থিক লক্ষ্য কাস্টম মেয়াদ ও মূল্যস্ফীতি দিয়ে প্ল্যান করুন।",
  },
};

export interface YieldTier {
  id: string;
  nameEn: string;
  nameBn: string;
  headlineRatePct: number;
  tdsPct: number;
  netRatePct: number;
  monthlyDPSRequired: number;
  totalInvested: number;
  totalInterestEarned: number;
}

export interface YearMilestone {
  year: number;
  futureTarget: number;
  accumulatedBalance: number;
  totalPrincipal: number;
  totalInterest: number;
}

export interface GoalPlanResult {
  category: GoalCategory;
  presentCost: number;
  targetYears: number;
  inflationPct: number;
  futureNominalCost: number;
  existingSavings: number;
  futureValueExistingSavings: number;
  shortfall: number;
  yieldTiers: YieldTier[];
  lazyMoneyPurchasingPowerLoss: number;
  timeline: YearMilestone[];
}

/**
 * Calculates inflation-adjusted required corpus and monthly SIP requirements across
 * Bangladeshi asset tiers.
 */
export function calculateGoalPlan({
  category = "CUSTOM",
  presentCost,
  targetYears,
  inflationPct = 8.5,
  existingSavings = 0,
}: {
  category?: GoalCategory;
  presentCost: number;
  targetYears: number;
  inflationPct?: number;
  existingSavings?: number;
}): GoalPlanResult {
  const safeCost = Math.max(0, Number.isFinite(presentCost) ? presentCost : 0);
  const safeYears = Math.max(1, Math.min(40, Number.isFinite(targetYears) ? targetYears : 1));
  const safeInflation = Math.max(0, Math.min(25, Number.isFinite(inflationPct) ? inflationPct : 8.5)) / 100;
  const safeSavings = Math.max(0, Number.isFinite(existingSavings) ? existingSavings : 0);

  // Future target adjusted for Bangladesh inflation
  const futureNominalCost = Math.round(safeCost * Math.pow(1 + safeInflation, safeYears));

  // Defined asset tiers representative of Bangladeshi fixed-income instruments
  const rawTiers = [
    {
      id: "gov-sukuk",
      nameEn: "Govt Sukuk / Sanchayapatra",
      nameBn: "সরকারি সুকুক / সঞ্চয়পত্র",
      headlineRatePct: 11.2,
      tdsPct: 10,
    },
    {
      id: "bank-dps",
      nameEn: "Top Bank DPS",
      nameBn: "শীর্ষ ব্যাংক ডিপিএস",
      headlineRatePct: 9.5,
      tdsPct: 10,
    },
    {
      id: "bank-fdr",
      nameEn: "Commercial Bank FDR",
      nameBn: "বাণিজ্যিক ব্যাংক এফডিআর",
      headlineRatePct: 8.5,
      tdsPct: 10,
    },
    {
      id: "savings-account",
      nameEn: "Ordinary Savings (Lazy Money)",
      nameBn: "সাধারণ সঞ্চয়ী হিসাব (অলস টাকা)",
      headlineRatePct: 3.5,
      tdsPct: 15,
    },
  ];

  const totalMonths = safeYears * 12;

  // We benchmark the future value of existing savings at the Top Bank DPS net rate
  const benchmarkMonthlyRate = (9.5 * (1 - 0.1) / 100) / 12;
  const futureValueExistingSavings = Math.round(
    safeSavings * Math.pow(1 + benchmarkMonthlyRate, totalMonths)
  );

  const shortfall = Math.max(0, futureNominalCost - futureValueExistingSavings);

  const yieldTiers: YieldTier[] = rawTiers.map((t) => {
    const netAnnualRate = (t.headlineRatePct * (1 - t.tdsPct / 100)) / 100;
    const monthlyRate = netAnnualRate / 12;

    let monthlyDPS = 0;
    if (shortfall > 0) {
      if (monthlyRate > 0) {
        // Monthly payment required to reach shortfall: PMT = FV * r / ((1 + r)^n - 1)
        const factor = Math.pow(1 + monthlyRate, totalMonths) - 1;
        monthlyDPS = factor > 0 ? (shortfall * monthlyRate) / factor : shortfall / totalMonths;
      } else {
        monthlyDPS = shortfall / totalMonths;
      }
    }

    const roundedMonthly = Math.ceil(monthlyDPS);
    const totalInvested = roundedMonthly * totalMonths + safeSavings;
    const totalInterestEarned = Math.max(0, futureNominalCost - totalInvested);

    return {
      id: t.id,
      nameEn: t.nameEn,
      nameBn: t.nameBn,
      headlineRatePct: t.headlineRatePct,
      tdsPct: t.tdsPct,
      netRatePct: Math.round(netAnnualRate * 1000) / 10,
      monthlyDPSRequired: roundedMonthly,
      totalInvested,
      totalInterestEarned,
    };
  });

  // Calculate lazy money loss: if today's cost is kept in an ordinary savings account
  // earning ~2.98% net vs 8.5% inflation over the duration
  const ordinaryNetAnnual = (3.5 * (1 - 0.15)) / 100;
  const purchasingPowerRetainedRatio = Math.pow((1 + ordinaryNetAnnual) / (1 + safeInflation), safeYears);
  const lazyMoneyPurchasingPowerLoss = Math.round(
    safeCost * Math.max(0, 1 - purchasingPowerRetainedRatio)
  );

  // Milestone trajectory based on the Top Bank DPS tier
  const dpsTier = yieldTiers.find((y) => y.id === "bank-dps") ?? yieldTiers[0];
  const monthlyRate = (dpsTier.netRatePct / 100) / 12;
  const monthlyContribution = dpsTier.monthlyDPSRequired;

  const timeline: YearMilestone[] = [];
  for (let y = 1; y <= safeYears; y++) {
    const months = y * 12;
    const targetAtY = Math.round(safeCost * Math.pow(1 + safeInflation, y));
    const principalFromSavings = safeSavings;
    const principalFromDPS = monthlyContribution * months;
    const totalPrincipal = principalFromSavings + principalFromDPS;

    let accumulatedBalance = 0;
    if (monthlyRate > 0) {
      const fvDPS = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      const fvSavings = safeSavings * Math.pow(1 + monthlyRate, months);
      accumulatedBalance = Math.round(fvDPS + fvSavings);
    } else {
      accumulatedBalance = totalPrincipal;
    }

    timeline.push({
      year: y,
      futureTarget: targetAtY,
      accumulatedBalance,
      totalPrincipal,
      totalInterest: Math.max(0, accumulatedBalance - totalPrincipal),
    });
  }

  return {
    category,
    presentCost: safeCost,
    targetYears: safeYears,
    inflationPct: Math.round(safeInflation * 1000) / 10,
    futureNominalCost,
    existingSavings: safeSavings,
    futureValueExistingSavings,
    shortfall,
    yieldTiers,
    lazyMoneyPurchasingPowerLoss,
    timeline,
  };
}
