/**
 * Filing-season search pages (/bn/<slug> and their /en twins). Every tax figure on them is read
 * from TAX_RULES / TAXPAYER_CATEGORIES at build time, never typed here, so a budget update in
 * tax-rules-2025-26.ts updates these pages too (filing-pages.test.ts checks every number).
 */
import { TAX_RULES, TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { fmtTaka } from "@/lib/format";
import { toBnDigits } from "@/lib/viz/math";
import type { TaxCalculatorInput } from "@/lib/tax/types";

export type Lang = "bn" | "en";
type Copy = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  points: string[];
  faq: { q: string; a: string }[];
};
export type FilingPage = {
  id: string;
  bn: Copy;
  en: Copy;
  /** Calculator fields set before the visitor types anything. */
  prefill?: Partial<TaxCalculatorInput>;
  sources: (keyof typeof SOURCES)[];
};

// The primary sources TAX_RULES cites (see the header of tax-rules-2025-26.ts).
export const SOURCES = {
  kpmg: { label: "KPMG Bangladesh, “Bangladesh Tax 2026”, 15 Jul 2026", url: "https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Tax/Bangladesh_Tax_2026.pdf" },
  pwc: { label: "PwC Worldwide Tax Summaries: Bangladesh, individual", url: "https://taxsummaries.pwc.com/bangladesh/individual" },
  nbrFaq: { label: "NBR, “FAQ - e-Return” 2026, Q46", url: "https://nbr.gov.bd/uploads/news-scroller/FAQ_e-Return_-_2026.pdf" },
  nbrPress: { label: "NBR press release on e-Return, 22 Jul 2026", url: "https://nbr.gov.bd/uploads/public-notice/eReturn_Press_Release-2026.pdf" },
  act: { label: "Income Tax Act 2023, Sixth Schedule Part I para 21 (NBR text)", url: "https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf" },
} as const;

const R = TAX_RULES;
const num = (lang: Lang, s: string) => (lang === "bn" ? toBnDigits(s) : s);
const tk = (lang: Lang, n: number) => num(lang, fmtTaka(n));
const pct = (lang: Lang, rate: number) => num(lang, `${Math.round(rate * 1000) / 10}%`);
export const fmtDate = (lang: Lang, iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const ay = (lang: Lang) => num(lang, R.assessmentYear);
const iy = (lang: Lang) => num(lang, R.incomeYear);
const general = TAXPAYER_CATEGORIES.find((c) => c.id === "general")!.taxFreeLimit;

const lateLines = (lang: Lang) => {
  let from = R.returnNoExtraTaxBy;
  return R.lateFilingExtraTax.map((w) => {
    const line =
      lang === "bn"
        ? `${fmtDate("bn", from)}-এর পর থেকে ${fmtDate("bn", w.until)} পর্যন্ত: পরিশোধযোগ্য করের ${pct("bn", w.rate)}, অন্তত ${tk("bn", w.min)}`
        : `After ${fmtDate("en", from)} until ${fmtDate("en", w.until)}: ${pct("en", w.rate)} of the payable tax, at least ${tk("en", w.min)}`;
    from = w.until;
    return line;
  });
};
const lastLate = R.lateFilingExtraTax.at(-1)!.until;

const slabLines = (lang: Lang) =>
  R.slabs.map((s) =>
    s.amt === Infinity
      ? lang === "bn" ? `বাকি সব আয়ে ${pct("bn", s.rate)}` : `${pct("en", s.rate)} on the rest`
      : lang === "bn" ? `পরের ${tk("bn", s.amt)}-এ ${pct("bn", s.rate)}` : `${pct("en", s.rate)} on the next ${tk("en", s.amt)}`
  );

export const FILING_PAGES: FilingPage[] = [
  {
    id: "deadline",
    sources: ["nbrFaq", "nbrPress", "kpmg"],
    bn: {
      slug: "return-shesh-tarikh-2026",
      title: `রিটার্ন জমার শেষ তারিখ ২০২৬: ${fmtDate("bn", R.returnNoExtraTaxBy)} — TakaTalks`,
      description: `করবর্ষ ${ay("bn")}-এর আয়কর রিটার্ন ${fmtDate("bn", R.returnNoExtraTaxBy)}-এর মধ্যে দিলে অতিরিক্ত কর নেই। এরপর কত লাগবে, আর নিজের কর হিসাব করুন।`,
      h1: `রিটার্ন জমার শেষ তারিখ: ${fmtDate("bn", R.returnNoExtraTaxBy)}`,
      intro: [
        `আয়বর্ষ ${iy("bn")}-এর (করবর্ষ ${ay("bn")}) রিটার্ন ${fmtDate("bn", R.returnNoExtraTaxBy)}-এর মধ্যে জমা দিলে কোনো অতিরিক্ত কর লাগে না। এবার একটি নির্দিষ্ট "ট্যাক্স ডে"-র বদলে সময়সীমা ভাগ করা হয়েছে।`,
        `এর পরে জমা দিলে পরিশোধযোগ্য করের ওপর অতিরিক্ত কর যোগ হয়:`,
      ],
      points: lateLines("bn"),
      faq: [
        { q: "২০২৬ সালে রিটার্ন জমার শেষ তারিখ কবে?", a: `অতিরিক্ত কর ছাড়া ${fmtDate("bn", R.returnNoExtraTaxBy)} পর্যন্ত। ${fmtDate("bn", lastLate)} পর্যন্ত রিটার্ন নেওয়া হয়, তবে অতিরিক্ত করসহ।` },
        { q: "প্রথমবার রিটার্ন দিলে কি সময় বেশি পাওয়া যায়?", a: `হ্যাঁ। প্রথমবারের রিটার্ন ${fmtDate("bn", R.firstTimeFilerDueBy)} পর্যন্ত দেওয়া যায়।` },
        { q: "দেরিতে দিলে কত বেশি লাগবে?", a: lateLines("bn").join("; ") + "।" },
      ],
    },
    en: {
      slug: "return-deadline-2026",
      title: `Tax return deadline 2026: ${fmtDate("en", R.returnNoExtraTaxBy)} — TakaTalks`,
      description: `File your assessment year ${ay("en")} return by ${fmtDate("en", R.returnNoExtraTaxBy)} with no additional tax. What filing later costs, and a calculator for your own tax.`,
      h1: `Tax return deadline: ${fmtDate("en", R.returnNoExtraTaxBy)}`,
      intro: [
        `Returns for income year ${iy("en")} (assessment year ${ay("en")}) filed by ${fmtDate("en", R.returnNoExtraTaxBy)} carry no additional tax. The single "tax day" has been replaced by filing windows.`,
        "Filing after that adds tax on top of what you owe:",
      ],
      points: lateLines("en"),
      faq: [
        { q: "What is the income tax return deadline in 2026?", a: `${fmtDate("en", R.returnNoExtraTaxBy)} with no additional tax. Returns are accepted until ${fmtDate("en", lastLate)}, with additional tax.` },
        { q: "Do first-time filers get longer?", a: `Yes. A first return can be filed until ${fmtDate("en", R.firstTimeFilerDueBy)}.` },
        { q: "How much more does filing late cost?", a: lateLines("en").join("; ") + "." },
      ],
    },
  },
  {
    id: "tax-free-limit",
    sources: ["kpmg", "pwc"],
    bn: {
      slug: "tax-free-limit-2026-27",
      title: `করমুক্ত আয়সীমা ${ay("bn")}: ${tk("bn", general)} — TakaTalks`,
      description: `করবর্ষ ${ay("bn")}-এ সাধারণ করদাতার করমুক্ত আয়সীমা ${tk("bn", general)}। নারী, প্রবীণ, প্রতিবন্ধী ও অন্যদের সীমা, করের ধাপ, আর নিজের কর হিসাব।`,
      h1: `করমুক্ত আয়সীমা, করবর্ষ ${ay("bn")}`,
      intro: [
        `আয়বর্ষ ${iy("bn")}-এর আয়ে প্রথম অংশে কোনো কর নেই। কত টাকা পর্যন্ত করমুক্ত, তা আপনার শ্রেণির ওপর নির্ভর করে:`,
      ],
      points: [
        ...TAXPAYER_CATEGORIES.map((c) => `${c.label}: ${tk("bn", c.taxFreeLimit)}`),
        `প্রতিবন্ধী সন্তানের বাবা-মা বা আইনগত অভিভাবক (একজন): প্রতি সন্তানের জন্য আরও ${tk("bn", R.disabledChildTaxFreeAddOn)}`,
        `করমুক্ত সীমার পরে: ${slabLines("bn").join(", ")}`,
      ],
      faq: [
        { q: `${ay("bn")} করবর্ষে করমুক্ত আয়সীমা কত?`, a: `সাধারণ করদাতার ${tk("bn", general)}। অন্য শ্রেণির সীমা: ${TAXPAYER_CATEGORIES.filter((c) => c.id !== "general").map((c) => `${c.label} ${tk("bn", c.taxFreeLimit)}`).join(", ")}।` },
        { q: "করমুক্ত সীমার পরে কর কীভাবে বাড়ে?", a: slabLines("bn").join(", ") + "।" },
      ],
    },
    en: {
      slug: "tax-free-limit-2026-27",
      title: `Tax-free income limit ${ay("en")}: ${tk("en", general)} — TakaTalks`,
      description: `The tax-free income limit for assessment year ${ay("en")} is ${tk("en", general)} for a general taxpayer. Limits for women, seniors and others, the tax bands, a calculator.`,
      h1: `Tax-free income limit, assessment year ${ay("en")}`,
      intro: [`The first slice of your income year ${iy("en")} income is tax-free. How large it is depends on your category:`],
      points: [
        ...TAXPAYER_CATEGORIES.map((c) => `${c.labelEn}: ${tk("en", c.taxFreeLimit)}`),
        `Parent or legal guardian (one) of a child with a disability: a further ${tk("en", R.disabledChildTaxFreeAddOn)} per child`,
        `Above the limit: ${slabLines("en").join(", ")}`,
      ],
      faq: [
        { q: `What is the tax-free income limit for assessment year ${ay("en")}?`, a: `${tk("en", general)} for a general taxpayer. Other categories: ${TAXPAYER_CATEGORIES.filter((c) => c.id !== "general").map((c) => `${c.labelEn} ${tk("en", c.taxFreeLimit)}`).join(", ")}.` },
        { q: "How is income above the limit taxed?", a: slabLines("en").join(", ") + "." },
      ],
    },
  },
  {
    id: "late-filing",
    sources: ["nbrFaq", "kpmg"],
    bn: {
      slug: "late-filing-jorimana",
      title: "দেরিতে রিটার্ন জমার জরিমানা (অতিরিক্ত কর) — TakaTalks",
      description: `${fmtDate("bn", R.returnNoExtraTaxBy)}-এর পরে রিটার্ন দিলে কত অতিরিক্ত কর লাগে, ধাপে ধাপে। নিজের করে হিসাব দেখুন।`,
      h1: "দেরিতে রিটার্ন দিলে কত বেশি লাগে",
      intro: [
        `${fmtDate("bn", R.returnNoExtraTaxBy)}-এর মধ্যে রিটার্ন দিলে অতিরিক্ত কর নেই। এরপর পরিশোধযোগ্য করের একটি অংশ, অথবা একটি ন্যূনতম অঙ্ক, যেটি বেশি, যোগ হয়:`,
      ],
      points: [...lateLines("bn"), `${fmtDate("bn", lastLate)}-এর পরে স্বনির্ধারণী রিটার্ন আর নেওয়া হয় না।`],
      faq: [
        { q: "দেরিতে রিটার্ন দিলে জরিমানা কত?", a: lateLines("bn").join("; ") + "।" },
        { q: "কর শূন্য হলেও কি ন্যূনতম অতিরিক্ত কর লাগবে?", a: "NBR-এর FAQ এটি স্পষ্ট করে বলেনি। এই ক্যালকুলেটর পরিশোধযোগ্য কর থাকলে তবেই অতিরিক্ত কর দেখায়; নিশ্চিত হতে একজন কর আইনজীবীর পরামর্শ নিন।" },
      ],
    },
    en: {
      slug: "late-filing-penalty",
      title: "Late tax return penalty (additional tax) — TakaTalks",
      description: `What filing your return after ${fmtDate("en", R.returnNoExtraTaxBy)} costs, window by window, and a calculator that shows it on your own tax.`,
      h1: "What filing your return late costs",
      intro: [
        `Filing by ${fmtDate("en", R.returnNoExtraTaxBy)} carries no additional tax. After that, a share of the payable tax or a minimum amount, whichever is higher, is added:`,
      ],
      points: [...lateLines("en"), `Self-assessed returns are not accepted after ${fmtDate("en", lastLate)}.`],
      faq: [
        { q: "What is the penalty for filing a tax return late?", a: lateLines("en").join("; ") + "." },
        { q: "Does the minimum apply if I owe no tax?", a: "NBR's FAQ does not say. This calculator shows additional tax only when tax is payable; ask a tax practitioner to be sure." },
      ],
    },
  },
  {
    id: "first-time",
    prefill: { firstTimeFiler: true },
    sources: ["kpmg"],
    bn: {
      slug: "first-time-return",
      title: "প্রথমবার আয়কর রিটার্ন: সময়সীমা ও ন্যূনতম কর — TakaTalks",
      description: `প্রথমবার রিটার্ন দিচ্ছেন? শেষ তারিখ ${fmtDate("bn", R.firstTimeFilerDueBy)}, ন্যূনতম কর ${tk("bn", R.minTaxNewTaxpayer)}। নিজের কর হিসাব করুন।`,
      h1: "প্রথমবার আয়কর রিটার্ন",
      intro: [
        `আয়বর্ষ ${iy("bn")}-এ প্রথমবার রিটার্ন দিলে দুটি সুবিধা আছে: বেশি সময়, আর কম ন্যূনতম কর। নিচের ক্যালকুলেটরে "প্রথমবার" আগে থেকেই বেছে রাখা আছে।`,
      ],
      points: [
        `প্রথমবারের রিটার্ন জমার শেষ তারিখ: ${fmtDate("bn", R.firstTimeFilerDueBy)}`,
        `ন্যূনতম কর: নতুন করদাতা ${tk("bn", R.minTaxNewTaxpayer)}, অন্যরা ${tk("bn", R.minTax)} (আয় করমুক্ত সীমার বেশি হলে)`,
        `সাধারণ করদাতার করমুক্ত আয়সীমা: ${tk("bn", general)}`,
      ],
      faq: [
        { q: "প্রথমবার রিটার্ন দেওয়ার শেষ তারিখ কবে?", a: `${fmtDate("bn", R.firstTimeFilerDueBy)}।` },
        { q: "প্রথমবার রিটার্নে ন্যূনতম কর কত?", a: `আয় করমুক্ত সীমার বেশি হলে ${tk("bn", R.minTaxNewTaxpayer)}; অন্যদের জন্য ${tk("bn", R.minTax)}।` },
      ],
    },
    en: {
      slug: "first-time-return",
      title: "Filing your first tax return: deadline and minimum tax — TakaTalks",
      description: `Filing for the first time? Your deadline is ${fmtDate("en", R.firstTimeFilerDueBy)} and the minimum tax is ${tk("en", R.minTaxNewTaxpayer)}. Estimate your tax.`,
      h1: "Filing your first income tax return",
      intro: [
        `A first return for income year ${iy("en")} gets two breaks: more time and a lower minimum tax. The calculator below starts with "first-time filer" ticked.`,
      ],
      points: [
        `First-return deadline: ${fmtDate("en", R.firstTimeFilerDueBy)}`,
        `Minimum tax: ${tk("en", R.minTaxNewTaxpayer)} for a new taxpayer, ${tk("en", R.minTax)} for others (when income is above the tax-free limit)`,
        `Tax-free limit for a general taxpayer: ${tk("en", general)}`,
      ],
      faq: [
        { q: "What is the deadline for a first tax return?", a: `${fmtDate("en", R.firstTimeFilerDueBy)}.` },
        { q: "What is the minimum tax on a first return?", a: `${tk("en", R.minTaxNewTaxpayer)} when income is above the tax-free limit; ${tk("en", R.minTax)} for other taxpayers.` },
      ],
    },
  },
  {
    id: "freelancer",
    sources: ["act", "kpmg"],
    bn: {
      slug: "freelancer-tax-2026",
      title: "ফ্রিল্যান্সারের আয়কর ২০২৬: আইটি ফ্রিল্যান্সিং আয় করমুক্ত কি না — TakaTalks",
      description: `আইটি ফ্রিল্যান্সিং আয় ${fmtDate("bn", R.freelanceExemptionEnds)} পর্যন্ত করমুক্ত, শর্ত: সব লেনদেন ব্যাংকের মাধ্যমে। নিজের কর হিসাব করুন।`,
      h1: "ফ্রিল্যান্সারের আয়কর, করবর্ষ " + ay("bn"),
      intro: [
        `আয়কর আইনের ষষ্ঠ তফসিল অনুযায়ী আইটি ফ্রিল্যান্সিং আয়ের ${pct("bn", R.freelanceExemptionFraction)} মোট আয় থেকে বাদ যায়, ${fmtDate("bn", R.freelanceExemptionEnds)} পর্যন্ত।`,
      ],
      points: [
        "শর্ত: ব্যবসার সব আয়, ব্যয় ও বিনিয়োগ ব্যাংক ট্রান্সফারের মাধ্যমে হতে হবে।",
        "শর্ত পূরণ না হলে এই আয় অন্য আয়ের মতো করযোগ্য।",
        `বেতন বা অন্য আয় থাকলে তার ওপর স্বাভাবিক নিয়মে কর; সাধারণ করমুক্ত সীমা ${tk("bn", general)}।`,
      ],
      faq: [
        { q: "ফ্রিল্যান্সিং আয়ে কি কর দিতে হয়?", a: `আইটি ফ্রিল্যান্সিং আয় ${fmtDate("bn", R.freelanceExemptionEnds)} পর্যন্ত করমুক্ত, যদি সব আয়, ব্যয় ও বিনিয়োগ ব্যাংকের মাধ্যমে হয়।` },
        { q: "এই ছাড় কতদিন থাকবে?", a: `${fmtDate("bn", R.freelanceExemptionEnds)} পর্যন্ত অর্জিত আয়ের জন্য, যদি না আবার বাড়ানো হয়।` },
      ],
    },
    en: {
      slug: "freelancer-tax-2026",
      title: "Freelancer income tax 2026: is IT freelancing income tax-free? — TakaTalks",
      description: `IT freelancing income is exempt until ${fmtDate("en", R.freelanceExemptionEnds)} if everything goes through the bank. Estimate your own tax.`,
      h1: "Freelancer income tax, assessment year " + ay("en"),
      intro: [
        `Under the Sixth Schedule of the Income Tax Act, ${pct("en", R.freelanceExemptionFraction)} of IT freelancing income is excluded from total income until ${fmtDate("en", R.freelanceExemptionEnds)}.`,
      ],
      points: [
        "Condition: all income, expenditure and investment of the business go through bank transfer.",
        "Without that, the income is taxed like any other income.",
        `Salary or other income is taxed as usual; the general tax-free limit is ${tk("en", general)}.`,
      ],
      faq: [
        { q: "Do freelancers in Bangladesh pay income tax?", a: `IT freelancing income is exempt until ${fmtDate("en", R.freelanceExemptionEnds)}, provided all income, expenditure and investment go through the bank.` },
        { q: "How long does the exemption last?", a: `For income earned until ${fmtDate("en", R.freelanceExemptionEnds)}, unless it is extended again.` },
      ],
    },
  },
  {
    id: "rebate",
    sources: ["kpmg", "pwc"],
    bn: {
      slug: "rebate-hisab",
      title: "বিনিয়োগ রিবেট হিসাব: কত বিনিয়োগে কত কর কমে — TakaTalks",
      description: `রিবেট = করযোগ্য আয়ের ${pct("bn", R.rebateRateOfIncome)}, বিনিয়োগের ${pct("bn", R.rebateRateOfInvestment)} আর ${tk("bn", R.rebateCap)}-এর মধ্যে যেটি কম। নিজের রিবেট হিসাব করুন।`,
      h1: "বিনিয়োগ রিবেট কীভাবে হিসাব হয়",
      intro: [`করবর্ষ ${ay("bn")}-এ বিনিয়োগ রিবেট হলো নিচের তিনটির মধ্যে সবচেয়ে কমটি:`],
      points: [
        `করযোগ্য আয়ের ${pct("bn", R.rebateRateOfIncome)}`,
        `যোগ্য বিনিয়োগের ${pct("bn", R.rebateRateOfInvestment)}`,
        `সর্বোচ্চ ${tk("bn", R.rebateCap)}`,
        `সঞ্চয়পত্র ও সরকারি বন্ড মিলিয়ে সর্বোচ্চ ${tk("bn", R.sharedGroupCap)}, DPS বছরে সর্বোচ্চ ${tk("bn", R.dpsCap)} বিনিয়োগ গণনায় আসে।`,
      ],
      faq: [
        { q: "রিবেট কীভাবে হিসাব করে?", a: `করযোগ্য আয়ের ${pct("bn", R.rebateRateOfIncome)}, যোগ্য বিনিয়োগের ${pct("bn", R.rebateRateOfInvestment)} এবং ${tk("bn", R.rebateCap)}: এই তিনটির মধ্যে যেটি সবচেয়ে কম।` },
        { q: "সঞ্চয়পত্রে কত পর্যন্ত বিনিয়োগ রিবেটে ধরা হয়?", a: `সঞ্চয়পত্র ও সরকারি বন্ড মিলিয়ে ${tk("bn", R.sharedGroupCap)} পর্যন্ত।` },
      ],
    },
    en: {
      slug: "rebate-calculation",
      title: "Investment rebate calculation: how much investing cuts your tax — TakaTalks",
      description: `The rebate is the lowest of ${pct("en", R.rebateRateOfIncome)} of taxable income, ${pct("en", R.rebateRateOfInvestment)} of eligible investment and ${tk("en", R.rebateCap)}. Work out yours.`,
      h1: "How the investment rebate is calculated",
      intro: [`For assessment year ${ay("en")}, the investment rebate is the lowest of:`],
      points: [
        `${pct("en", R.rebateRateOfIncome)} of taxable income`,
        `${pct("en", R.rebateRateOfInvestment)} of eligible investment`,
        `${tk("en", R.rebateCap)}`,
        `Sanchayapatra and government bonds count up to ${tk("en", R.sharedGroupCap)} together, DPS up to ${tk("en", R.dpsCap)} a year.`,
      ],
      faq: [
        { q: "How is the tax rebate calculated?", a: `It is the lowest of ${pct("en", R.rebateRateOfIncome)} of taxable income, ${pct("en", R.rebateRateOfInvestment)} of eligible investment and ${tk("en", R.rebateCap)}.` },
        { q: "How much Sanchayapatra counts for the rebate?", a: `Up to ${tk("en", R.sharedGroupCap)}, shared with government bonds.` },
      ],
    },
  },
];

export const pagePath = (lang: Lang, page: FilingPage) => `/${lang}/${page[lang].slug}`;
export const findPage = (lang: Lang, slug: string) => FILING_PAGES.find((p) => p[lang].slug === slug);
