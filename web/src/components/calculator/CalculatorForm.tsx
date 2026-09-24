"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TAXPAYER_CATEGORIES, type TaxLocation } from "@/config/tax-rules-2025-26";
import { calculateTax } from "@/lib/tax/calculate";
import { calculateOptimizer } from "@/lib/tax/optimizer";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "@/lib/tax/types";
import { CheckField, Fieldset, NumberField, SelectField } from "@/components/ui/fields";
import { TaxBreakdown } from "./TaxBreakdown";
import { RebateOptimizer } from "./RebateOptimizer";
import { TaxSlipModal } from "./TaxSlipModal";
import { useLanguage } from "@/lib/i18n";

function field<K extends keyof TaxCalculatorInput>(
  input: TaxCalculatorInput,
  setInput: (v: TaxCalculatorInput) => void,
  key: K
) {
  return {
    value: input[key] as number,
    onChange: (n: number) => setInput({ ...input, [key]: n }),
  };
}

// Pure so it can run during render (via useSearchParams) instead of in a
// mount effect — avoids the extra post-mount re-render and the
// react-hooks/set-state-in-effect lint error that came with it.
function parseSharedLinkPatch(params: URLSearchParams): Partial<TaxCalculatorInput> {
  if (!params.toString()) return {};

  const patch: Partial<TaxCalculatorInput> = {};
  const parseNum = (k: string) => {
    const v = params.get(k);
    if (v) {
      const n = parseFloat(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return undefined;
  };

  const b = parseNum("basic"); if (b !== undefined) patch.basicMonthly = b;
  const a = parseNum("allowance"); if (a !== undefined) patch.allowanceMonthly = a;
  const bn = parseNum("bonus"); if (bn !== undefined) patch.bonusAnnual = bn;
  const bz = parseNum("biz"); if (bz !== undefined) patch.businessAnnual = bz;
  const hp = parseNum("houseProperty"); if (hp !== undefined) patch.housePropertyAnnual = hp;
  const ot = parseNum("other"); if (ot !== undefined) patch.otherIncomeAnnual = ot;
  const fl = parseNum("freelance"); if (fl !== undefined) patch.freelanceAnnual = fl;
  // Shared alongside the amount: without it a shared link would show
  // exempt freelance income as fully taxed.
  if (params.get("freelanceBank") === "1") patch.freelanceBankTransferCompliant = true;
  const ait = parseNum("ait"); if (ait !== undefined) patch.aitPaid = ait;
  const cat = params.get("cat"); if (cat) patch.categoryId = cat;

  return patch;
}

export function CalculatorForm({ initial }: { initial?: Partial<TaxCalculatorInput> }) {
  return (
    <Suspense fallback={null}>
      <CalculatorFormInner initial={initial} />
    </Suspense>
  );
}

function CalculatorFormInner({ initial }: { initial?: Partial<TaxCalculatorInput> }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  // Lazy initializer: runs once, so the URL patch is folded into the very
  // first render instead of arriving a tick later via setState-in-effect.
  const [input, setInput] = useState<TaxCalculatorInput>(() => ({
    ...EMPTY_TAX_INPUT,
    ...initial,
    ...parseSharedLinkPatch(searchParams),
  }));
  const [wealthOpen, setWealthOpen] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams();
    if (input.basicMonthly) params.set("basic", String(input.basicMonthly));
    if (input.allowanceMonthly) params.set("allowance", String(input.allowanceMonthly));
    if (input.bonusAnnual) params.set("bonus", String(input.bonusAnnual));
    if (input.businessAnnual) params.set("biz", String(input.businessAnnual));
    if (input.housePropertyAnnual) params.set("houseProperty", String(input.housePropertyAnnual));
    if (input.otherIncomeAnnual) params.set("other", String(input.otherIncomeAnnual));
    if (input.freelanceAnnual) params.set("freelance", String(input.freelanceAnnual));
    if (input.freelanceAnnual && input.freelanceBankTransferCompliant) params.set("freelanceBank", "1");
    if (input.aitPaid) params.set("ait", String(input.aitPaid));
    if (input.categoryId && input.categoryId !== "general") params.set("cat", input.categoryId);
    const qs = params.toString();
    return `${window.location.origin}/calculator${qs ? `?${qs}` : ""}`;
  }, [input]);

  const result = useMemo(() => calculateTax(input), [input]);
  const optimizer = useMemo(() => calculateOptimizer(result), [result]);

  const n = (key: keyof TaxCalculatorInput) => field(input, setInput, key);

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-5 items-start">
      <div className="flex flex-col gap-4">
        <Fieldset
          legend={t("1. Profile", "১. প্রোফাইল")}
          note={t("The taxpayer category sets your tax-free limit.", "করদাতার ক্যাটাগরি অনুযায়ী tax-free limit ঠিক হয়।")}
        >
          <SelectField
            label={t("Taxpayer category", "করদাতার ক্যাটাগরি")}
            value={input.categoryId}
            onChange={(v) => setInput({ ...input, categoryId: v })}
            options={TAXPAYER_CATEGORIES.map((c) => ({
              value: c.id,
              label: `${t(c.labelEn, c.label)} — Tax-free ৳${c.taxFreeLimit.toLocaleString("en-IN")}`,
            }))}
          />
          <div className="mt-2.5">
            <SelectField
              label={t("Tax Location / Jurisdiction", "কর অঞ্চল / ভৌগোলিক অবস্থান")}
              value={input.location ?? "dhaka_ctg"}
              onChange={(v) => setInput({ ...input, location: v as TaxLocation })}
              options={[
                {
                  value: "dhaka_ctg",
                  label: `${t("Dhaka & Chattogram City Corporation", "ঢাকা ও চট্টগ্রাম সিটি কর্পোরেশন")} — ${t("Min Tax ৳5,000", "ন্যূনতম কর ৳৫,০০০")}`,
                },
                {
                  value: "other_city",
                  label: `${t("Other City Corporations", "অন্যান্য সিটি কর্পোরেশন")} — ${t("Min Tax ৳4,000", "ন্যূনতম কর ৳৪,০০০")}`,
                },
                {
                  value: "non_city",
                  label: `${t("Non-City / District / Upazila areas", "সিটি কর্পোরেশন বহির্ভূত এলাকা / জেলা")} — ${t("Min Tax ৳3,000", "ন্যূনতম কর ৳৩,০০০")}`,
                },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            <NumberField
              label={t("Number of disabled children (each +৳50,000 tax-free)", "প্রতিবন্ধী সন্তান সংখ্যা (each +৳50,000 tax-free)")}
              currency={false}
              {...n("disabledChildren")}
            />
            <div className="pt-5">
              <CheckField
                label={t(
                  "First-time filer (min tax ৳1,000 — common convention; statutory is ৳3k-৳5k)",
                  "প্রথমবার করদাতা (min tax ৳১,০০০ — প্রচলিত চর্চা; আইনে এলাকাভেদে ৳৩,০০০-৳৫,০০০)"
                )}
                checked={input.firstTimeFiler}
                onChange={(b) => setInput({ ...input, firstTimeFiler: b })}
              />
            </div>
          </div>
        </Fieldset>

        <Fieldset
          legend={t("2. Salary income", "২. বেতন আয় (Salary income)")}
          note={t(
            "Standard exemption = ⅓ of gross salary income or ৳4,50,000, whichever is lower.",
            "Standard exemption = ⅓ of gross salary income বা ৳৪,৫০,০০০, যেটা কম।"
          )}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField label={t("Basic (monthly)", "মূল বেতন (Basic, monthly)")} {...n("basicMonthly")} />
            <NumberField label={t("Allowances (monthly)", "ভাতা (Allowances, monthly)")} {...n("allowanceMonthly")} />
            <NumberField label={t("Bonus (annual total)", "বোনাস (Bonus, annual total)")} {...n("bonusAnnual")} />
            <NumberField
              label={t("Employer PF contribution (monthly)", "নিয়োগকর্তার PF contribution (monthly)")}
              {...n("employerPFMonthly")}
            />
          </div>
        </Fieldset>

        <Fieldset legend={t("3. Business / profession & other income", "৩. ব্যবসা / পেশা ও অন্যান্য আয়")}>
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField
              label={t("Net profit from business/profession (annual)", "ব্যবসা / পেশার নেট মুনাফা (annual)")}
              {...n("businessAnnual")}
            />
            <NumberField
              label={t("Net house rent income (annual)", "বাড়ি ভাড়ার নেট আয় (annual)")}
              {...n("housePropertyAnnual")}
            />
            <NumberField
              label={t("Interest / dividend etc. (annual)", "সুদ / ডিভিডেন্ড ইত্যাদি (annual)")}
              {...n("otherIncomeAnnual")}
            />
            <NumberField
              label={t(
                "Freelance / IT-enabled export service income (annual)",
                "ফ্রিল্যান্স / IT export service income (annual)"
              )}
              {...n("freelanceAnnual")}
            />
          </div>
          <div className="mt-1.5">
            <CheckField
              label={t(
                "All of this business's income, expenses and investments go through bank transfer",
                "এই ব্যবসার সব আয়, খরচ ও বিনিয়োগ bank transfer এ হয়"
              )}
              checked={input.freelanceBankTransferCompliant}
              onChange={(b) => setInput({ ...input, freelanceBankTransferCompliant: b })}
            />
          </div>
          <p className="text-[11px] text-muted mt-1.5">
            {t(
              "IT freelancing and software/ITES income is fully exempt from income tax until 30 June 2027 (Income Tax Act 2023, Sixth Schedule, Part I, para 21) — but only if the box above is true, which is the condition the law itself attaches. Leave it unchecked and this income is taxed like any other.",
              "IT freelancing ও software/ITES আয় ৩০ জুন ২০২৭ পর্যন্ত সম্পূর্ণ করমুক্ত (Income Tax Act 2023, Sixth Schedule, Part I, para 21) — তবে শুধু উপরের box টি সত্য হলে, কারণ আইনেই এই শর্ত দেওয়া আছে। Check না করলে এই আয় অন্য আয়ের মতোই tax হবে।"
            )}
          </p>
        </Fieldset>

        <Fieldset
          legend={t("4. Capital gains", "৪. মূলধনী মুনাফা (Capital gains)")}
          note={t(
            "Listed shares + fund units combined are exempt up to ৳50 lakh/year, the rest is a flat 15%.",
            "Listed shares + fund units মিলে বছরে ৫০ লাখ পর্যন্ত exempt, বাকিটা flat 15%।"
          )}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField
              label={t("Listed shares/fund units gain (annual)", "Listed shares/fund units থেকে মুনাফা (annual)")}
              {...n("cgSharesFund")}
            />
            <NumberField
              label={t("Other assets, sold within 5 years (slab rate)", "অন্য সম্পদ, ৫ বছরের মধ্যে বিক্রি (slab rate)")}
              {...n("cgWithin5Years")}
            />
            <NumberField
              label={t("Other assets, sold after 5 years (flat 15%)", "অন্য সম্পদ, ৫ বছর পর বিক্রি (flat 15%)")}
              {...n("cgAfter5Years")}
            />
            <NumberField
              label={t("Land — portion above deed value (slab rate)", "জমি — দলিল মূল্যের চেয়ে বেশি অংশ (slab rate)")}
              {...n("cgLand")}
            />
            <NumberField
              label={t("Gold / jewellery / valuables (flat 5%)", "স্বর্ণ / গহনা / মূল্যবান জিনিস (flat 5%)")}
              {...n("cgGold")}
            />
          </div>
        </Fieldset>

        <Fieldset
          legend={t("5. Investment (rebate eligible)", "৫. বিনিয়োগ (Investment — rebate eligible)")}
          note={t(
            "Sanchaypatra + Govt securities + Mutual fund share a ৳5 lakh/year cap. DPS is capped at ৳1,20,000/year.",
            "Sanchaypatra + Govt securities + Mutual fund মিলে বছরে ৫ লাখ শেয়ার্ড cap। DPS বছরে ৳1,20,000 পর্যন্ত।"
          )}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <NumberField label={t("Sanchaypatra (annual)", "সঞ্চয়পত্র (annual)")} {...n("invSanchayAnnual")} />
            <NumberField
              label={t("Govt securities/bonds (annual)", "সরকারি সিকিউরিটিজ/বন্ড (annual)")}
              {...n("invBondAnnual")}
            />
            <NumberField
              label={t("Mutual fund/ETF (annual)", "মিউচুয়াল ফান্ড/ETF (annual)")}
              {...n("invMFAnnual")}
            />
            <NumberField
              label={t("DSE listed stock, new investment (annual)", "DSE listed stock, নতুন বিনিয়োগ (annual)")}
              {...n("invStockAnnual")}
            />
            <NumberField
              label={t("Life insurance premium (annual)", "জীবন বীমা প্রিমিয়াম (annual)")}
              {...n("invLifeAnnual")}
            />
            <NumberField label={t("PF, own contribution (monthly)", "PF, নিজের contribution (monthly)")} {...n("invPFMonthly")} />
            <NumberField label={t("DPS (monthly)", "DPS (মাসিক)")} {...n("invDPSMonthly")} />
            <NumberField
              label={t("Donation to approved charities (annual)", "অনুমোদিত দাতব্য প্রতিষ্ঠানে দান (annual)")}
              {...n("invDonationAnnual")}
            />
          </div>
        </Fieldset>

        <Fieldset legend={t("6. AIT", "৬. AIT")}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] text-muted">
              {t("BRTA car advance tax or bank TDS?", "বিআরটিএ গাড়ির অগ্রিম কর বা ব্যাংক টিডিএস?")}
            </span>
            <Link
              href="/cars"
              className="text-[11px] text-gold hover:underline font-medium"
            >
              {t("Calculate Car AIT →", "গাড়ির AIT হিসাব →")}
            </Link>
          </div>
          <NumberField
            label={t("AIT already deducted (advance tax / TDS)", "আগেই কর্তিত AIT (advance tax / TDS)")}
            {...n("aitPaid")}
          />

          <button
            type="button"
            onClick={() => {
              const next = !wealthOpen;
              setWealthOpen(next);
              if (!next) setInput({ ...input, netWealth: 0, multiCar: false, bigHouse: false });
            }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 mt-3.5 bg-[#FBFAF6] border border-dashed border-line text-[13.5px] text-green-deep"
          >
            <input type="checkbox" checked={wealthOpen} readOnly className="w-auto" />
            {t(
              "Do you have significant assets / property? (doesn't apply to most people)",
              "তোমার significant সম্পদ / সম্পত্তি আছে? (বেশিরভাগ মানুষের জন্য এটা প্রযোজ্য না)"
            )}
          </button>

          {wealthOpen && (
            <div className="pt-3">
              <p className="text-xs text-muted mb-2.5">
                {t(
                  "If your net wealth is under ৳4 crore, and you don't have multiple cars or 8,000+ sqft of property, this section isn't for you.",
                  "Net wealth ৪ কোটির নিচে হলে, ba multiple car/8000+ sqft property na thakle, এই section তোমার জন্য না।"
                )}
              </p>
              <NumberField
                label={t("Total net wealth (statement of assets, if known)", "মোট নেট সম্পদ (statement of assets, if known)")}
                {...n("netWealth")}
              />
              <CheckField
                label={t("Have multiple cars", "একাধিক গাড়ি আছে")}
                checked={input.multiCar}
                onChange={(b) => setInput({ ...input, multiCar: b })}
              />
              <CheckField
                label={t(
                  "Have 8,000+ sqft of house/land in a city corporation",
                  "সিটি কর্পোরেশনে ৮,০০০ বর্গফুটের বেশি বাড়ি/জমি আছে"
                )}
                checked={input.bigHouse}
                onChange={(b) => setInput({ ...input, bigHouse: b })}
              />
            </div>
          )}
        </Fieldset>
      </div>

      <div className="flex flex-col gap-4 md:sticky md:top-4">
        <div className="bg-card border border-line px-4.5 py-5">
          <span className="inline-block font-mono text-[10.5px] text-gold border border-gold px-1.5 py-0.5 mb-2">
            ESTIMATE
          </span>
          <h2 className="font-serif font-semibold text-[17px] mb-3.5 pb-2 border-b-2 border-green text-green-deep">
            {t("Your estimate, step by step", "তোমার এস্টিমেট, ধাপে ধাপে")}
          </h2>
          <TaxBreakdown r={result} ait={input.aitPaid} />

          <button
            type="button"
            onClick={() => setShowSlipModal(true)}
            className="w-full mt-3.5 py-2.5 px-3 bg-green-deep text-paper text-xs font-semibold rounded-xs hover:bg-green-deep/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>📄</span> {t("Generate & Print Tax Slip", "আয়কর স্লিপ তৈরি ও প্রিন্ট")}
          </button>

          <p className="text-[11px] text-muted mt-3.5 pt-2.5 border-t border-line">
            {t(
              "This is a rough estimate, not an official record, and nothing is saved anywhere. Per-instrument sub-caps are simplified. Verify everything officially before actually filing.",
              "এটি একটি প্রাথমিক আনুমানিক হিসাব, কোনো প্রাতিষ্ঠানিক নথি নয় এবং কোনো তথ্য সংরক্ষণ করা হয় না। প্রতিটি খাতের অভ্যন্তরীণ সীমা এখানে সরলীকৃত করা হয়েছে। চূড়ান্ত রিটার্ন দাখিলের আগে আনুষ্ঠানিকভাবে যাচাই করে নিন।"
            )}
          </p>
        </div>

        <RebateOptimizer opt={optimizer} />
      </div>

      {showSlipModal && (
        <TaxSlipModal
          result={result}
          ait={input.aitPaid}
          onClose={() => setShowSlipModal(false)}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}
