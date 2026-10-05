/**
 * Financial-freedom (FIRE) engine: what corpus a household actually needs to stop
 * depending on a salary, how long it takes to get there, and how the corpus is
 * parked once it arrives.
 *
 * This is the deeper sibling of `/goals`' RETIREMENT_FIRE preset. That preset asks
 * "how much monthly DPS reaches a number you already picked". Here the number itself
 * is derived, from four things the goals preset cannot express:
 *
 *   1. Inflation the person sets, compounding on both sides — it inflates the expense
 *      they will have at freedom age, and it erodes the portfolio's return while they
 *      are living off it.
 *   2. The lifestyle they actually want afterwards. Stopping fully, doing light work,
 *      travelling, or moving back to the village are different expense bases, not the
 *      same number with a different label.
 *   3. Passive income they already own (flat rent, shop rent). Rent that covers half
 *      the monthly bill halves the corpus the portfolio has to produce.
 *   4. A plan-until age, so the corpus is allowed to deplete rather than having to last
 *      forever. Both numbers are reported: the depleting one, and the never-touch-the-
 *      principal one.
 *
 * Guiding principle, same as the rest of the app (docs/product-notes.md): deterministic
 * arithmetic on numbers the person typed. The allocation section splits a corpus across
 * *roles* (liquid buffer, income floor, growth, a capped venture slice) with the loss each
 * role can absorb, never a named bank, fund or product, and never a "put your money here"
 * verdict.
 */

export type FreedomLifestyle =
  | "FULL_STOP"
  | "LIGHT_WORK"
  | "TRAVEL"
  | "VILLAGE"
  | "HOME_CHILL";

export interface LifestylePreset {
  id: FreedomLifestyle;
  titleEn: string;
  titleBn: string;
  icon: string;
  descriptionEn: string;
  descriptionBn: string;
  /** Multiple of today's monthly household spend this lifestyle implies. */
  expenseMultiplier: number;
  /** Monthly income from light work, in today's money. Zero for the lifestyles without it. */
  defaultLightWorkIncome: number;
}

export const LIFESTYLE_PRESETS: Record<FreedomLifestyle, LifestylePreset> = {
  FULL_STOP: {
    id: "FULL_STOP",
    titleEn: "Stop working entirely",
    titleBn: "কাজ পুরোপুরি বন্ধ",
    icon: "🛑",
    descriptionEn:
      "No earned income at all after freedom age. Same standard of living as today, funded only by the corpus and existing passive income.",
    descriptionBn:
      "স্বাধীনতার পর আর কোনো উপার্জন নয়। আজকের মানের জীবনযাত্রা, পুরোটাই চলবে সঞ্চিত মূলধন ও বিদ্যমান প্যাসিভ আয় থেকে।",
    expenseMultiplier: 1.0,
    defaultLightWorkIncome: 0,
  },
  LIGHT_WORK: {
    id: "LIGHT_WORK",
    titleEn: "Light work / consulting",
    titleBn: "হালকা কাজ / পরামর্শ",
    icon: "💼",
    descriptionEn:
      "Part-time, freelance or advisory work by choice. Slightly lower costs than a full job, and earned income still covers part of the bill.",
    descriptionBn:
      "ইচ্ছেমতো খণ্ডকালীন, ফ্রিল্যান্স বা পরামর্শমূলক কাজ। চাকরির তুলনায় খরচ কিছুটা কম, আর আয়ের একটি অংশ খরচ মেটাতে সাহায্য করবে।",
    expenseMultiplier: 0.95,
    defaultLightWorkIncome: 25_000,
  },
  TRAVEL: {
    id: "TRAVEL",
    titleEn: "Travel often",
    titleBn: "ঘন ঘন ভ্রমণ",
    icon: "✈️",
    descriptionEn:
      "Regular domestic and foreign travel. Costs more than today, and travel costs track the dollar rate rather than local inflation alone.",
    descriptionBn:
      "নিয়মিত দেশ-বিদেশ ভ্রমণ। খরচ আজকের চেয়ে বেশি, এবং ভ্রমণ ব্যয় কেবল দেশীয় মূল্যস্ফীতি নয়, ডলার রেটের সাথেও বাড়ে।",
    expenseMultiplier: 1.35,
    defaultLightWorkIncome: 0,
  },
  VILLAGE: {
    id: "VILLAGE",
    titleEn: "Move to the village / mofussil",
    titleBn: "গ্রামে বা মফস্বলে বসবাস",
    icon: "🌾",
    descriptionEn:
      "Leaving Dhaka or Chattogram rent and city costs behind. The single biggest lever on the freedom number for most households.",
    descriptionBn:
      "ঢাকা বা চট্টগ্রামের বাসাভাড়া ও শহুরে খরচ বাদ। বেশিরভাগ পরিবারের ক্ষেত্রে এটিই স্বাধীনতার অঙ্ক কমানোর সবচেয়ে বড় উপায়।",
    expenseMultiplier: 0.65,
    defaultLightWorkIncome: 0,
  },
  HOME_CHILL: {
    id: "HOME_CHILL",
    titleEn: "Stay home, live simply",
    titleBn: "ঘরেই আরামে, সাদামাটা জীবন",
    icon: "🏡",
    descriptionEn:
      "Same city, quieter life. No commute, no office wardrobe, fewer eating-out occasions — a modest trim on today's spending.",
    descriptionBn:
      "একই শহরে, শান্ত জীবন। যাতায়াত নেই, অফিসের খরচ নেই, বাইরে খাওয়া কম — আজকের খরচ থেকে মাঝারি সাশ্রয়।",
    expenseMultiplier: 0.85,
    defaultLightWorkIncome: 0,
  },
};

export interface PassiveIncomeSource {
  id: string;
  label: string;
  /** Monthly amount in today's money. */
  monthlyAmount: number;
  /** Annual growth of that income, in percent. Rents are usually raised near inflation. */
  growthPct: number;
}

export interface FreedomInput {
  currentAge: number;
  freedomAge: number;
  /** Age the plan must keep paying until. The corpus is allowed to run out exactly here. */
  planUntilAge: number;
  /** Today's total monthly household spending. */
  monthlyExpenseToday: number;
  lifestyle: FreedomLifestyle;
  /** Monthly light-work income in today's money. Only used by lifestyles that have it. */
  lightWorkIncomeToday: number;
  inflationPct: number;
  /** Net-of-TDS annual return expected while still accumulating. */
  preFreedomReturnPct: number;
  /** Net-of-TDS annual return expected on the corpus during freedom. Usually lower. */
  postFreedomReturnPct: number;
  /** Investable corpus already accumulated (not counting the home lived in). */
  existingCorpus: number;
  /** What they are putting aside every month right now. Drives the "on your current pace" line. */
  currentMonthlySaving: number;
  passiveIncomes: PassiveIncomeSource[];
  /** Share of essential-to-total spending. The income floor is sized against this. */
  essentialSharePct: number;
  /** How much of the corpus they would like to risk on a small business. Capped by the engine. */
  ventureAppetitePct: number;
}

export interface CorpusRequirement {
  /** Nominal monthly spend at the freedom age, after lifestyle and inflation. */
  monthlyExpense: number;
  monthlyPassiveIncome: number;
  monthlyLightWorkIncome: number;
  /** What the portfolio itself has to produce every month. */
  monthlyNetNeed: number;
  annualNetNeed: number;
  /** Corpus that funds the need until planUntilAge and is allowed to hit zero there. */
  drawdownCorpus: number;
  /** Corpus that funds the need forever without touching the principal. Null if the real return is <= 0. */
  perpetualCorpus: number | null;
  /** Post-freedom return minus inflation, in percent. Negative means the corpus loses ground every year. */
  realReturnPct: number;
}

export type AllocationRole = "LIQUID_BUFFER" | "INCOME_FLOOR" | "GROWTH" | "VENTURE";

export interface AllocationSlice {
  role: AllocationRole;
  nameEn: string;
  nameBn: string;
  amount: number;
  pctOfCorpus: number;
  purposeEn: string;
  purposeBn: string;
  /** What a total loss of this slice would mean. The honest part of the split. */
  riskEn: string;
  riskBn: string;
}

export interface RoadmapYear {
  year: number;
  age: number;
  /** On-track balance at the end of this year if the required monthly saving is kept up. */
  onTrackBalance: number;
  /** Balance at the end of this year at the pace they are saving today. */
  currentPaceBalance: number;
  contributedSoFar: number;
  pctOfFreedomNumber: number;
  /** Nominal monthly household spend in that year, for a sense of what the money is chasing. */
  monthlyExpenseThatYear: number;
}

export interface FreedomPlan {
  yearsToFreedom: number;
  yearsInFreedom: number;
  lifestyle: FreedomLifestyle;
  inflationPct: number;
  requirement: CorpusRequirement;
  /** The headline number: the depleting corpus, which is what the roadmap targets. */
  freedomNumber: number;
  futureValueExistingCorpus: number;
  gap: number;
  requiredMonthlySaving: number;
  /** Where the current saving pace lands at freedom age, and by how much it misses. */
  currentPaceBalanceAtFreedom: number;
  currentPaceSurplus: number;
  /** Earliest age the current saving pace actually reaches freedom. Null if it never does by 90. */
  currentPaceFreedomAge: number | null;
  /**
   * Age from which they could stop adding new money at the pace they save *today* and
   * still land on the number. Null when the current pace never gets there — which is the
   * common case, and the honest answer.
   */
  coastAge: number | null;
  allocation: AllocationSlice[];
  roadmap: RoadmapYear[];
}

function clamp(value: number, lo: number, hi: number, fallback: number): number {
  const n = Number.isFinite(value) ? value : fallback;
  return Math.min(hi, Math.max(lo, n));
}

/** Future value of a monthly contribution stream plus a lump sum, at an annual rate. */
function futureValue(lumpSum: number, monthly: number, annualRatePct: number, years: number): number {
  const months = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  if (months <= 0) return lumpSum;
  if (r === 0) return lumpSum + monthly * months;
  const growth = Math.pow(1 + r, months);
  return lumpSum * growth + monthly * ((growth - 1) / r);
}

/** Monthly contribution needed to close `target` over `years` at an annual rate. */
function requiredMonthly(target: number, annualRatePct: number, years: number): number {
  const months = Math.round(years * 12);
  if (target <= 0) return 0;
  if (months <= 0) return target;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return target / months;
  return (target * r) / (Math.pow(1 + r, months) - 1);
}

/**
 * Present value at the freedom date of an inflation-indexed annual withdrawal that runs
 * for `years`. Uses the real rate, so the withdrawal keeps its purchasing power every
 * year rather than staying flat in nominal taka. Withdrawals are taken at the start of
 * each year (annuity-due), which is how a household actually lives off a corpus.
 */
function inflationIndexedDrawdownPV(
  annualNeed: number,
  realRatePct: number,
  years: number
): number {
  if (annualNeed <= 0 || years <= 0) return 0;
  const g = realRatePct / 100;
  if (Math.abs(g) < 1e-9) return annualNeed * years;
  const ordinary = annualNeed * ((1 - Math.pow(1 + g, -years)) / g);
  return ordinary * (1 + g);
}

/**
 * What the corpus has to be if freedom starts at `age`. Factored out because the
 * "can I get there sooner / later" questions re-ask it at every candidate age — the
 * required number moves with the age, so comparing a projected balance against a fixed
 * number would quietly flatter an earlier retirement.
 */
export function requiredCorpusAtAge(input: FreedomInput, age: number): CorpusRequirement {
  const safe = normalise(input);
  const years = Math.max(0, age - safe.currentAge);
  const yearsInFreedom = Math.max(1, safe.planUntilAge - age);
  const inflation = safe.inflationPct / 100;
  const preset = LIFESTYLE_PRESETS[safe.lifestyle];

  const monthlyExpense =
    safe.monthlyExpenseToday * preset.expenseMultiplier * Math.pow(1 + inflation, years);

  const monthlyPassiveIncome = safe.passiveIncomes.reduce(
    (sum, src) =>
      sum +
      Math.max(0, src.monthlyAmount) *
        Math.pow(1 + clamp(src.growthPct, 0, 25, 0) / 100, years),
    0
  );

  // Light work only counts for the lifestyles that actually include it, so switching
  // to "stop entirely" cannot silently keep crediting an income the person just gave up.
  const monthlyLightWorkIncome =
    preset.defaultLightWorkIncome > 0
      ? safe.lightWorkIncomeToday * Math.pow(1 + inflation, years)
      : 0;

  const monthlyNetNeed = Math.max(
    0,
    monthlyExpense - monthlyPassiveIncome - monthlyLightWorkIncome
  );
  const annualNetNeed = monthlyNetNeed * 12;

  const realRate =
    ((1 + safe.postFreedomReturnPct / 100) / (1 + inflation) - 1) * 100;

  const drawdownCorpus = Math.round(
    inflationIndexedDrawdownPV(annualNetNeed, realRate, yearsInFreedom)
  );
  const perpetualCorpus =
    realRate > 0 ? Math.round(annualNetNeed / (realRate / 100)) : null;

  return {
    monthlyExpense: Math.round(monthlyExpense),
    monthlyPassiveIncome: Math.round(monthlyPassiveIncome),
    monthlyLightWorkIncome: Math.round(monthlyLightWorkIncome),
    monthlyNetNeed: Math.round(monthlyNetNeed),
    annualNetNeed: Math.round(annualNetNeed),
    drawdownCorpus,
    perpetualCorpus,
    realReturnPct: Math.round(realRate * 100) / 100,
  };
}

/**
 * Splits the corpus into roles. The order of the carve is the point: the liquid buffer
 * and the income floor are taken out first, so the venture slice can only ever be funded
 * from money that is genuinely surplus to the floor.
 */
function buildAllocation(
  corpus: number,
  requirement: CorpusRequirement,
  essentialSharePct: number,
  ventureAppetitePct: number,
  postFreedomReturnPct: number,
  inflationPct: number,
  yearsInFreedom: number
): AllocationSlice[] {
  if (corpus <= 0) return [];

  let remaining = corpus;

  // 1. Twelve months of net need, kept liquid so a bad year never forces a fixed
  //    deposit to be broken early at a penalty.
  const liquid = Math.min(remaining, Math.round(requirement.monthlyNetNeed * 12));
  remaining -= liquid;

  // 2. Income floor: the part of the corpus that has to carry essential spending for
  //    the whole plan, priced at a deliberately conservative fixed-income real rate.
  const conservativeRealRate =
    ((1 + Math.min(postFreedomReturnPct, 8.5) / 100) / (1 + inflationPct / 100) - 1) * 100;
  const essentialAnnual = requirement.annualNetNeed * (essentialSharePct / 100);
  const floorTarget = Math.round(
    inflationIndexedDrawdownPV(essentialAnnual, conservativeRealRate, yearsInFreedom)
  );
  const floor = Math.min(remaining, Math.max(0, floorTarget));
  remaining -= floor;

  // 3. Venture: capped at a fifth of the corpus *and* at what is left after the floor,
  //    so losing all of it cannot touch essential spending.
  const ventureCap = Math.round(corpus * 0.2);
  const venture = Math.min(remaining, ventureCap, Math.round(corpus * (ventureAppetitePct / 100)));
  remaining -= venture;

  const growth = Math.max(0, remaining);

  const slices: Array<Omit<AllocationSlice, "pctOfCorpus">> = [
    {
      role: "LIQUID_BUFFER",
      nameEn: "Liquid buffer (12 months)",
      nameBn: "নগদ বাফার (১২ মাস)",
      amount: liquid,
      purposeEn:
        "One year of expenses reachable the same day, so a medical bill or a bad market year never forces you to break a deposit early.",
      purposeBn:
        "এক বছরের খরচ, যেকোনো দিন হাতে পাওয়া যাবে — চিকিৎসার খরচ বা খারাপ বছরে যেন মেয়াদপূর্তির আগে সঞ্চয় ভাঙতে না হয়।",
      riskEn: "Lowest return of the four. That is the price of being able to withdraw tomorrow.",
      riskBn: "চারটির মধ্যে সর্বনিম্ন মুনাফা। আগামীকালই তুলতে পারার মূল্য এটাই।",
    },
    {
      role: "INCOME_FLOOR",
      nameEn: "Income floor (fixed income)",
      nameBn: "আয়ের ভিত্তি (নির্দিষ্ট মুনাফা)",
      amount: floor,
      purposeEn: `Sized to carry your essential spending (${Math.round(essentialSharePct)}% of the bill) for the whole plan on a conservative fixed return.`,
      purposeBn: `আপনার অপরিহার্য খরচ (মোট খরচের ${Math.round(essentialSharePct)}%) পুরো মেয়াদজুড়ে নিরাপদ নির্দিষ্ট মুনাফা দিয়ে চালানোর মতো পরিমাণ।`,
      riskEn:
        "The part that must not be gambled. Rates can fall at renewal, so it is re-checked every maturity, not set once.",
      riskBn:
        "এই অংশ নিয়ে ঝুঁকি নেওয়া চলবে না। নবায়নের সময় রেট কমতে পারে, তাই প্রতিবার মেয়াদপূর্তিতে পুনরায় যাচাই করতে হবে।",
    },
    {
      role: "GROWTH",
      nameEn: "Growth / inflation cover",
      nameBn: "প্রবৃদ্ধি / মূল্যস্ফীতি প্রতিরোধ",
      amount: growth,
      purposeEn:
        "The part that has to out-run inflation over a 20-30 year freedom, since a flat fixed return alone loses purchasing power every year.",
      purposeBn:
        "২০-৩০ বছরের স্বাধীনতায় মূল্যস্ফীতিকে হারানোর দায়িত্ব এই অংশের — শুধু নির্দিষ্ট মুনাফায় প্রতি বছর ক্রয়ক্ষমতা কমতে থাকে।",
      riskEn: "Value moves year to year. It is sized so you are never forced to sell in a bad year.",
      riskBn:
        "এর মূল্য বছরে বছরে ওঠানামা করে। এমনভাবে রাখা হয়েছে যাতে খারাপ বছরে বিক্রি করতে বাধ্য না হন।",
    },
    {
      role: "VENTURE",
      nameEn: "Venture slice (losable)",
      nameBn: "ব্যবসার অংশ (ক্ষতি সহনীয়)",
      amount: venture,
      purposeEn:
        "A small business or stake you want to try. Capped at a fifth of the corpus and funded only from what is left after the floor.",
      purposeBn:
        "ছোট ব্যবসা বা অংশীদারিত্ব যা আপনি চেষ্টা করতে চান। মোট মূলধনের এক-পঞ্চমাংশে সীমিত, এবং কেবল ভিত্তি পূরণের পর যা থাকে তা থেকেই।",
      riskEn:
        "Assume it can go to zero. If it does, the floor and the buffer above still pay every essential bill.",
      riskBn:
        "ধরে নিন পুরোটাই হারাতে পারে। তা হলেও উপরের ভিত্তি ও বাফার আপনার সব অপরিহার্য খরচ চালিয়ে যাবে।",
    },
  ];

  return slices
    .filter((s) => s.amount > 0)
    .map((s) => ({ ...s, pctOfCorpus: Math.round((s.amount / corpus) * 1000) / 10 }));
}

function normalise(input: FreedomInput): FreedomInput {
  const currentAge = clamp(input.currentAge, 15, 75, 30);
  const freedomAge = clamp(input.freedomAge, currentAge + 1, 90, currentAge + 10);
  const planUntilAge = clamp(input.planUntilAge, freedomAge + 1, 110, freedomAge + 25);
  return {
    currentAge,
    freedomAge,
    planUntilAge,
    monthlyExpenseToday: Math.max(0, Number.isFinite(input.monthlyExpenseToday) ? input.monthlyExpenseToday : 0),
    lifestyle: LIFESTYLE_PRESETS[input.lifestyle] ? input.lifestyle : "FULL_STOP",
    lightWorkIncomeToday: Math.max(0, Number.isFinite(input.lightWorkIncomeToday) ? input.lightWorkIncomeToday : 0),
    inflationPct: clamp(input.inflationPct, 0, 25, 8.5),
    preFreedomReturnPct: clamp(input.preFreedomReturnPct, 0, 30, 9),
    postFreedomReturnPct: clamp(input.postFreedomReturnPct, 0, 30, 8),
    existingCorpus: Math.max(0, Number.isFinite(input.existingCorpus) ? input.existingCorpus : 0),
    currentMonthlySaving: Math.max(0, Number.isFinite(input.currentMonthlySaving) ? input.currentMonthlySaving : 0),
    passiveIncomes: (input.passiveIncomes ?? []).filter((s) => Number.isFinite(s.monthlyAmount)),
    essentialSharePct: clamp(input.essentialSharePct, 0, 100, 70),
    ventureAppetitePct: clamp(input.ventureAppetitePct, 0, 100, 0),
  };
}

export function calculateFreedomPlan(rawInput: FreedomInput): FreedomPlan {
  const input = normalise(rawInput);
  const yearsToFreedom = input.freedomAge - input.currentAge;
  const yearsInFreedom = input.planUntilAge - input.freedomAge;

  const requirement = requiredCorpusAtAge(input, input.freedomAge);
  const freedomNumber = requirement.drawdownCorpus;

  const futureValueExistingCorpus = Math.round(
    futureValue(input.existingCorpus, 0, input.preFreedomReturnPct, yearsToFreedom)
  );
  const gap = Math.max(0, freedomNumber - futureValueExistingCorpus);
  const requiredMonthlySaving = Math.ceil(
    requiredMonthly(gap, input.preFreedomReturnPct, yearsToFreedom)
  );

  const currentPaceBalanceAtFreedom = Math.round(
    futureValue(input.existingCorpus, input.currentMonthlySaving, input.preFreedomReturnPct, yearsToFreedom)
  );

  // The required number moves with the freedom age, so each candidate age is re-priced
  // rather than compared against the number computed for the age they first asked about.
  let currentPaceFreedomAge: number | null = null;
  if (input.currentMonthlySaving > 0 || input.existingCorpus > 0) {
    for (let age = input.currentAge + 1; age <= 90; age++) {
      if (age >= input.planUntilAge) break;
      const need = requiredCorpusAtAge(input, age).drawdownCorpus;
      const have = futureValue(
        input.existingCorpus,
        input.currentMonthlySaving,
        input.preFreedomReturnPct,
        age - input.currentAge
      );
      if (have >= need) {
        currentPaceFreedomAge = age;
        break;
      }
    }
  }

  // Coast age: the first year after which contributions could stop and compounding alone
  // finishes the job. Measured against what they actually save today, not against the
  // required amount — on the required path the money is needed right up to the last
  // month by construction, so coasting against it would always report the freedom age
  // and tell them nothing.
  let coastAge: number | null = null;
  for (let y = 0; y <= yearsToFreedom; y++) {
    const balance = futureValue(
      input.existingCorpus,
      input.currentMonthlySaving,
      input.preFreedomReturnPct,
      y
    );
    const coasted = futureValue(balance, 0, input.preFreedomReturnPct, yearsToFreedom - y);
    if (coasted >= freedomNumber) {
      coastAge = input.currentAge + y;
      break;
    }
  }

  const allocation = buildAllocation(
    freedomNumber,
    requirement,
    input.essentialSharePct,
    input.ventureAppetitePct,
    input.postFreedomReturnPct,
    input.inflationPct,
    yearsInFreedom
  );

  const preset = LIFESTYLE_PRESETS[input.lifestyle];
  const roadmap: RoadmapYear[] = [];
  for (let y = 1; y <= yearsToFreedom; y++) {
    const onTrackBalance = Math.round(
      futureValue(input.existingCorpus, requiredMonthlySaving, input.preFreedomReturnPct, y)
    );
    roadmap.push({
      year: y,
      age: input.currentAge + y,
      onTrackBalance,
      currentPaceBalance: Math.round(
        futureValue(input.existingCorpus, input.currentMonthlySaving, input.preFreedomReturnPct, y)
      ),
      contributedSoFar: input.existingCorpus + requiredMonthlySaving * y * 12,
      pctOfFreedomNumber:
        freedomNumber > 0 ? Math.round((onTrackBalance / freedomNumber) * 1000) / 10 : 100,
      monthlyExpenseThatYear: Math.round(
        input.monthlyExpenseToday * preset.expenseMultiplier * Math.pow(1 + input.inflationPct / 100, y)
      ),
    });
  }

  return {
    yearsToFreedom,
    yearsInFreedom,
    lifestyle: input.lifestyle,
    inflationPct: input.inflationPct,
    requirement,
    freedomNumber,
    futureValueExistingCorpus,
    gap,
    requiredMonthlySaving,
    currentPaceBalanceAtFreedom,
    currentPaceSurplus: currentPaceBalanceAtFreedom - freedomNumber,
    currentPaceFreedomAge,
    coastAge,
    allocation,
    roadmap,
  };
}
