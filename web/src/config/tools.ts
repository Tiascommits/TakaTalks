/**
 * Single source of truth for the tool catalogue, shared by the site nav's
 * "Tools" menu and the homepage's category tabs. Adding a tool here puts it
 * in both places — the two used to drift because each kept its own list.
 */

export type ToolCategoryId = "tax" | "earn" | "save" | "borrow";

export type ToolCategory = {
  id: ToolCategoryId;
  label: { en: string; bn: string };
  /** One line on what this group of tools is for, shown under the tabs. */
  blurb: { en: string; bn: string };
};

export type Tool = {
  href: string;
  category: ToolCategoryId;
  icon: string;
  tag: { en: string; bn: string };
  title: { en: string; bn: string };
  /** Short label for the nav menu, where the full title is too long. */
  navLabel: { en: string; bn: string };
  desc: { en: string; bn: string };
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "tax",
    label: { en: "Tax", bn: "কর" },
    blurb: {
      en: "What you owe, and every rebate you're legally entitled to.",
      bn: "কত কর দিতে হবে, আর কোন রেয়াত আইনত আপনার প্রাপ্য।",
    },
  },
  {
    id: "earn",
    label: { en: "Earn", bn: "আয়" },
    blurb: {
      en: "What actually lands in your bank account, and where it goes.",
      bn: "ব্যাংকে আসলে কত ঢুকছে, আর কোথায় যাচ্ছে।",
    },
  },
  {
    id: "save",
    label: { en: "Save", bn: "সঞ্চয়" },
    blurb: {
      en: "Real returns after tax and inflation — not the headline rate.",
      bn: "কর ও মূল্যস্ফীতি বাদে প্রকৃত মুনাফা — বিজ্ঞাপনের হার নয়।",
    },
  },
  {
    id: "borrow",
    label: { en: "Borrow & Give", bn: "ঋণ ও যাকাত" },
    blurb: {
      en: "The cost of a loan, and the calculation of what you owe others.",
      bn: "ঋণের প্রকৃত খরচ, আর অন্যের প্রাপ্য হিসাব।",
    },
  },
];

export const TOOLS: Tool[] = [
  {
    href: "/calculator",
    category: "tax",
    icon: "🧮",
    tag: { en: "ZERO SIGNUP", bn: "সাইনআপ ছাড়া" },
    title: { en: "Tax Calculator & Rebate Optimizer", bn: "আয়কর ও রিবেট অপটিমাইজার" },
    navLabel: { en: "Tax Calculator", bn: "আয়কর" },
    desc: {
      en: "Estimate what you owe under Assessment Year 2025-26 rules. Maximize your legal tax rebate.",
      bn: "করবর্ষ ২০২৫-২৬ অনুযায়ী ট্যাক্স প্রাক্কলন করুন। সর্বোচ্চ আইনসম্মত কর রেয়াত অর্জন করুন।",
    },
  },
  {
    href: "/tax_basic_calculation",
    category: "tax",
    icon: "⚡",
    tag: { en: "1-MINUTE ESTIMATE", bn: "১ মিনিটে হিসাব" },
    title: { en: "Quick Basic Tax Estimate", bn: "দ্রুত বেসিক ট্যাক্স হিসাব" },
    navLabel: { en: "Quick Tax Estimate", bn: "দ্রুত ট্যাক্স হিসাব" },
    desc: {
      en: "Just your yearly income and category — see the basic slab tax in seconds. No rebates or deductions.",
      bn: "শুধু বছরের আয় ও ক্যাটাগরি দিন — কয়েক সেকেন্ডে বেসিক স্ল্যাব ট্যাক্স দেখুন। রিবেট বা বিয়োগ ছাড়া।",
    },
  },
  {
    href: "/freelance",
    category: "tax",
    icon: "🌐",
    tag: { en: "0% TAX + 2.5% CASH", bn: "০% ট্যাক্স + ২.৫% বোনাস" },
    title: { en: "Freelance & IT Remittance Hub", bn: "ফ্রিল্যান্স ও আইটি রেমিট্যান্স হাব" },
    navLabel: { en: "Freelance & IT", bn: "ফ্রিল্যান্স ও IT" },
    desc: {
      en: "Calculate 2.5% inward remittance incentive, verify 0% ITES tax exemption, and track compliance.",
      bn: "২.৫% রেমিট্যান্স প্রণোদনা হিসাব করুন, ০% আইটিইএস কর অব্যাহতি ও আইনি কমপ্লায়েন্স যাচাই করুন।",
    },
  },
  {
    href: "/cars",
    category: "tax",
    icon: "🚗",
    tag: { en: "CC SLABS & MULTI-CAR AIT", bn: "সিসি স্ল্যাব ও এআইটি" },
    title: { en: "Car Buying & Tax Decision Engine", bn: "গাড়ি কেনা ও এআইটি কর বিশ্লেষণ" },
    navLabel: { en: "Car Tax & AIT", bn: "গাড়ি ও এআইটি" },
    desc: {
      en: "Find your CC sweet spot, calculate BRTA annual AIT, avoid the 2nd-car wealth surcharge, and check TCO affordability.",
      bn: "লাভজনক সিসি নির্বাচন করুন, বিআরটিএ এআইটি সমন্বয় হিসাব করুন এবং ২য় গাড়ির সারচার্জ ফাঁদ এড়িয়ে চলুন।",
    },
  },
  {
    href: "/salary",
    category: "earn",
    icon: "💼",
    tag: { en: "OFFER BENCHMARK", bn: "অফার তুলনাকারী" },
    title: { en: "Salary Offer & In-Hand Analyzer", bn: "স্যালারি অফার ও ইন-হ্যান্ড পে" },
    navLabel: { en: "Salary Analyzer", bn: "স্যালারি তুলনাকারী" },
    desc: {
      en: "Compare job offers side-by-side. See exact monthly bank credit after 10% PF and Section 86 monthly TDS.",
      bn: "চাকরির অফার পাশাপাশি তুলনা করুন। ১০% পিএফ ও মাসিক কর কর্তনের পর প্রকৃত ব্যাংক জমা দেখুন।",
    },
  },
  {
    href: "/tracker",
    category: "earn",
    icon: "🔔",
    tag: { en: "MATURITY ALERTS", bn: "মেয়াদ অ্যালার্ট" },
    title: { en: "Income & Investment Tracker", bn: "ইনকাম ও ইনভেস্টমেন্ট ট্র্যাকার" },
    navLabel: { en: "Tracker", bn: "ট্র্যাকার" },
    desc: {
      en: "Track multi-source earnings and deposit maturities with automated email & WhatsApp alerts.",
      bn: "একাধিক আয়ের উৎস ও বিভিন্ন ব্যাংকের সঞ্চয় ট্র্যাক করুন, মেয়াদপূর্তির নোটিফিকেশন পান।",
    },
  },
  {
    href: "/instruments",
    category: "save",
    icon: "📊",
    tag: { en: "REAL YIELDS", bn: "প্রকৃত মুনাফা" },
    title: { en: "Real Yield Matrix (After-Tax)", bn: "সঞ্চয় স্কিম তুলনামূলক ম্যাট্রিক্স" },
    navLabel: { en: "Real Yields", bn: "সঞ্চয় স্কিম" },
    desc: {
      en: "Sanchayapatra vs Bank FDR vs Govt Sukuk. Compare net returns after 5%, 10%, or 15% TDS.",
      bn: "সঞ্চয়পত্র, ব্যাংক এফডিআর ও সরকারি সুকুক। উৎসে কর ও মূল্যস্ফীতি বাদে প্রকৃত ক্রয়ক্ষমতা তুলনা করুন।",
    },
  },
  {
    href: "/rates",
    category: "save",
    icon: "🏦",
    tag: { en: "LIVE RATES + AUDITED DATA", bn: "লাইভ রেট + অডিট ডাটা" },
    title: { en: "Bank Rates & Health Scorecard", bn: "ব্যাংক রেট ও স্বাস্থ্য স্কোরকার্ড" },
    navLabel: { en: "Bank Rates", bn: "ব্যাংক রেট" },
    desc: {
      en: "Commercial bank deposit rates with audited Basel III health disclosures (CAR, NPL, ROA).",
      bn: "বাণিজ্যিক ব্যাংকের আমানত রেট এবং অডিটেড মূলধন পর্যাপ্ততা (CAR) ও খেলাপি ঋণ (NPL) তথ্য।",
    },
  },
  {
    href: "/reinvest",
    category: "save",
    icon: "🔁",
    tag: { en: "CATEGORY, NOT A BANK", bn: "ক্যাটাগরি, ব্যাংক নয়" },
    title: { en: "Reinvestment Suggestion", bn: "পুনঃবিনিয়োগ পরামর্শ" },
    navLabel: { en: "Reinvest", bn: "পুনঃবিনিয়োগ" },
    desc: {
      en: "When an investment matures, see which instrument category fits — by after-tax return, tax-rebate room, and your timeline.",
      bn: "বিনিয়োগের মেয়াদ শেষ হলে কোন ক্যাটাগরি উপযুক্ত দেখুন — ট্যাক্স-পরবর্তী মুনাফা, রেয়াতের সুযোগ ও সময়সীমা অনুযায়ী।",
    },
  },
  {
    href: "/goals",
    category: "save",
    icon: "🎯",
    tag: { en: "BEAT INFLATION", bn: "মূল্যস্ফীতি জয়" },
    title: { en: "Life Goal & Wealth Planner", bn: "ভবিষ্যৎ লক্ষ্য ও অবসর প্ল্যানার" },
    navLabel: { en: "Goal Planner", bn: "লক্ষ্য ও অবসর" },
    desc: {
      en: "Model car, flat, child education, or retirement milestones adjusted for Bangladesh inflation.",
      bn: "গাড়ি, ফ্ল্যাটের ডাউনপেমেন্ট, উচ্চশিক্ষা বা আগাম অবসরের বাস্তবসম্মত সঞ্চয় লক্ষ্য নির্ধারণ করুন।",
    },
  },
  {
    href: "/loans",
    category: "borrow",
    icon: "🏠",
    tag: { en: "PREPAYMENT SAVER", bn: "সুদ সাশ্রয়" },
    title: { en: "Loan & Home EMI Accelerator", bn: "লোন ও গৃহঋণ ইএমআই প্ল্যানার" },
    navLabel: { en: "Loans & EMI", bn: "লোন ও EMI" },
    desc: {
      en: "Calculate reducing balance EMI for DBH home loans, car loans, and see how prepayments save lakhs.",
      bn: "হোম ও কার লোনের কিস্তি হিসাব করুন এবং অতিরিক্ত প্রি-পেমেন্ট করে লাখ লাখ টাকা সুদ বাঁচান।",
    },
  },
  {
    href: "/zakat",
    category: "borrow",
    icon: "🌙",
    tag: { en: "2.5% PURIFICATION", bn: "২.৫% যাকাত" },
    title: { en: "Bangladesh Zakat Calculator", bn: "যাকাত ক্যালকুলেটর বাংলাদেশ" },
    navLabel: { en: "Zakat", bn: "যাকাত" },
    desc: {
      en: "Gold & Silver Nisab, Sanchayapatra, DSE stocks, and bank interest purification under Hanafi fiqh.",
      bn: "স্বর্ণ-রৌপ্য নিসাব, সঞ্চয়পত্র, শেয়ার ও ব্যাংক সুদের পরিশুদ্ধির শরিয়তসম্মত নির্ভুল হিসাব।",
    },
  },
];

export function toolsInCategory(id: ToolCategoryId): Tool[] {
  return TOOLS.filter((tool) => tool.category === id);
}
