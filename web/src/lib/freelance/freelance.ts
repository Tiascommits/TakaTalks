/**
 * Freelancer & IT/ITES Export Service Remittance and Tax Calculation Engine for Bangladesh.
 *
 * Grounded in:
 * - Income Tax Act 2023 (Section 124, Section 89, Section 264 for PSR).
 * - NBR IT/ITES statutory income exemption provisions for software & IT-enabled export services.
 * - Bangladesh Bank circulars on foreign inward remittance cash incentives (export subsidy).
 */

import { TAX_RULES, TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "BDT";

export interface ITESCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  isTaxExemptITES: boolean;
  descriptionEn: string;
  descriptionBn: string;
}

export const ITES_CATEGORIES: ITESCategory[] = [
  {
    id: "software_dev",
    nameEn: "Software & Mobile App Development",
    nameBn: "সফটওয়্যার ও মোবাইল অ্যাপ ডেভেলপমেন্ট",
    isTaxExemptITES: true,
    descriptionEn: "Custom software, SaaS, mobile applications, APIs, systems programming.",
    descriptionBn: "কাস্টম সফটওয়্যার, মোবাইল অ্যাপ, এপিআই ও সিস্টেম ডেভেলপমেন্ট।",
  },
  {
    id: "web_ui_dev",
    nameEn: "Web Development & UI/UX Design",
    nameBn: "ওয়েব ডেভেলপমেন্ট ও ইউআই/ইউএক্স ডিজাইন",
    isTaxExemptITES: true,
    descriptionEn: "Full-stack web apps, frontend, backend, product design, Figma workflows.",
    descriptionBn: "ওয়েবসাইট, ওয়েব অ্যাপ্লিকেশন তৈরি ও প্রোডাক্ট ডিজাইন।",
  },
  {
    id: "digital_marketing_seo",
    nameEn: "Digital Marketing, SEO & Content",
    nameBn: "ডিজিটাল মার্কেটিং, এসইও ও কনটেন্ট",
    isTaxExemptITES: true,
    descriptionEn: "Search engine optimization, paid ad management, digital analytics, copy.",
    descriptionBn: "সার্চ ইঞ্জিন অপটিমাইজেশন, অ্যাড ম্যানেজমেন্ট ও ডিজিটাল কনটেন্ট তৈরি।",
  },
  {
    id: "graphics_animation",
    nameEn: "Graphic Design, 3D & Video Editing",
    nameBn: "গ্রাফিক ডিজাইন, থ্রিডি ও ভিডিও এডিটিং",
    isTaxExemptITES: true,
    descriptionEn: "Visual branding, illustration, motion graphics, video post-production.",
    descriptionBn: "ব্র্যান্ডিং, মোশন গ্রাফিক্স, থ্রিডি মডেলিং ও ভিডিও এডিটিং।",
  },
  {
    id: "data_ai_annotation",
    nameEn: "Data Analytics, AI Annotation & BPO",
    nameBn: "ডাটা অ্যানালিটিক্স, এআই অ্যানোটেশন ও বিপিও",
    isTaxExemptITES: true,
    descriptionEn: "Data processing, ML training data annotation, customer support, virtual assistance.",
    descriptionBn: "ডাটা প্রসেসিং, এআই মডেল ট্রেনিং ডাটা ও অনলাইন কাস্টমার সাপোর্ট।",
  },
  {
    id: "general_consulting",
    nameEn: "General Consulting / Non-ITES Services",
    nameBn: "সাধারণ কনসাল্টিং / নন-আইটিইএস সেবা",
    isTaxExemptITES: false,
    descriptionEn: "Management consulting, local domestic clients, non-tech services (taxed per general slabs).",
    descriptionBn: "স্থানীয় দেশীয় ক্লায়েন্টের কাজ বা নন-টেক কনসাল্টিং (সাধারণ স্ল্যাব হারে করযোগ্য)।",
  },
];

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 122.0,
  EUR: 134.0,
  GBP: 158.0,
  BDT: 1.0,
};

export interface FreelanceInput {
  foreignAmount: number;
  currency: CurrencyCode;
  customExchangeRate?: number;
  categoryId: string;
  hasBankingChannelFIRC: boolean; // Bank inward remittance with Form C / FIRC
  cashIncentivePct?: number; // Govt cash incentive on inward remittance (e.g. 2.5%)
  taxpayerCategoryId?: string; // Default "general"
}

export interface FreelanceCalculationResult {
  foreignAmount: number;
  currency: CurrencyCode;
  exchangeRateUsed: number;
  grossBDT: number;
  cashIncentiveBDT: number;
  cashIncentivePct: number;
  isITESExempt: boolean;
  taxableIncomeBDT: number;
  taxFreeLimit: number;
  taxPayableBDT: number;
  netInHandBDT: number;
  effectiveRetentionPct: number;
  complianceChecklist: {
    itemEn: string;
    itemBn: string;
    required: boolean;
    noteEn: string;
    noteBn: string;
  }[];
}

export function calculateFreelanceEarnings(
  input: FreelanceInput
): FreelanceCalculationResult {
  const safeAmount = Math.max(0, Number.isFinite(input.foreignAmount) ? input.foreignAmount : 0);
  const currency = input.currency || "USD";
  const defaultRate = DEFAULT_EXCHANGE_RATES[currency] ?? 122.0;
  const exchangeRateUsed =
    input.customExchangeRate && input.customExchangeRate > 0
      ? input.customExchangeRate
      : defaultRate;

  const grossBDT = Math.round(safeAmount * exchangeRateUsed);

  // Cash incentive on foreign remittance through banking channel
  const incentivePct =
    input.hasBankingChannelFIRC
      ? Math.max(0, Math.min(10, input.cashIncentivePct ?? 2.5))
      : 0;
  const cashIncentiveBDT = Math.round(grossBDT * (incentivePct / 100));

  // Determine ITES exemption
  const category =
    ITES_CATEGORIES.find((c) => c.id === input.categoryId) ?? ITES_CATEGORIES[0];
  const isITESExempt = category.isTaxExemptITES && input.hasBankingChannelFIRC;

  const cat =
    TAXPAYER_CATEGORIES.find(
      (c) => c.id.toLowerCase() === (input.taxpayerCategoryId ?? "general").toLowerCase()
    ) ?? TAXPAYER_CATEGORIES[0];
  const taxFreeLimit = cat.taxFreeLimit;

  let taxableIncomeBDT = 0;
  let taxPayableBDT = 0;

  if (isITESExempt) {
    // 100% statutory exemption on export ITES inward remittance
    taxableIncomeBDT = 0;
    taxPayableBDT = 0;
  } else {
    // Non-exempt or domestic remittance: taxed under regular slabs
    taxableIncomeBDT = grossBDT;
    const taxableAboveTaxFree = Math.max(0, taxableIncomeBDT - taxFreeLimit);
    let remaining = taxableAboveTaxFree;
    let slabTotal = 0;
    for (const s of TAX_RULES.slabs) {
      if (remaining <= 0) break;
      const chunk = Math.min(remaining, s.amt);
      slabTotal += chunk * s.rate;
      remaining -= chunk;
    }
    taxPayableBDT = Math.round(slabTotal);
  }

  const netInHandBDT = grossBDT + cashIncentiveBDT - taxPayableBDT;
  const effectiveRetentionPct =
    grossBDT > 0
      ? Math.round((netInHandBDT / grossBDT) * 1000) / 10
      : 100;

  const complianceChecklist = [
    {
      itemEn: "Proof of Submission of Return (PSR)",
      itemBn: "রিটার্ন দাখিলের প্রমাণ (PSR)",
      required: true,
      noteEn: "Mandatory under Section 264 even with ৳0 tax payable to keep bank accounts and credit cards active.",
      noteBn: "কর শূন্য হলেও ধারা ২৬৪ অনুযায়ী ব্যাংক একাউন্ট ও ক্রেডিট কার্ড সচল রাখতে রিটার্ন দাখিল বাধ্যতামূলক।",
    },
    {
      itemEn: "Foreign Inward Remittance Certificate (FIRC)",
      itemBn: "বৈদেশিক রেমিট্যান্স প্রত্যয়নপত্র (FIRC)",
      required: input.hasBankingChannelFIRC,
      noteEn: "Issued by your receiving commercial bank as proof of export service earnings.",
      noteBn: "আপনার তফসিলি ব্যাংক হতে সংগৃহীত রেমিট্যান্স সার্টিফিকেট যা কর অব্যাহতির মূল প্রমাণ।",
    },
    {
      itemEn: "Bangladesh Bank Form C Declaration",
      itemBn: "বাংলাদেশ ব্যাংক ফরম 'সি' ঘোষণা",
      required: input.hasBankingChannelFIRC,
      noteEn: "Submitted to the bank for inward remittances exceeding statutory reporting thresholds.",
      noteBn: "ব্যাংক চ্যানেলে রেমিট্যান্স জমার সময় সেবা খাতের বিবরণ নিশ্চিতকরণ ফরম।",
    },
    {
      itemEn: "Individual Tax Return (Form IT-11GA)",
      itemBn: "আয়কর রিটার্ন ফরম (IT-11GA)",
      required: true,
      noteEn: "File exempt income in Part 3 of Schedule 2 to maintain legal white money status.",
      noteBn: "অব্যাহতিপ্রাপ্ত রেমিট্যান্সের অর্থ বৈধ সাদা টাকা হিসেবে প্রদর্শনের জন্য রিটার্নে উল্লেখ আবশ্যক।",
    },
  ];

  return {
    foreignAmount: safeAmount,
    currency,
    exchangeRateUsed,
    grossBDT,
    cashIncentiveBDT,
    cashIncentivePct: incentivePct,
    isITESExempt,
    taxableIncomeBDT,
    taxFreeLimit,
    taxPayableBDT,
    netInHandBDT,
    effectiveRetentionPct,
    complianceChecklist,
  };
}
