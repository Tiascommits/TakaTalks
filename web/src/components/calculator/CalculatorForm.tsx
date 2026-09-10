"use client";

import { useMemo, useState } from "react";
import { TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { calculateTax } from "@/lib/tax/calculate";
import { calculateOptimizer } from "@/lib/tax/optimizer";
import { EMPTY_TAX_INPUT, type TaxCalculatorInput } from "@/lib/tax/types";
import { CheckField, Fieldset, NumberField, SelectField } from "@/components/ui/fields";
import { TaxBreakdown } from "./TaxBreakdown";
import { RebateOptimizer } from "./RebateOptimizer";

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

export function CalculatorForm({ initial }: { initial?: Partial<TaxCalculatorInput> }) {
  const [input, setInput] = useState<TaxCalculatorInput>({ ...EMPTY_TAX_INPUT, ...initial });
  const [wealthOpen, setWealthOpen] = useState(false);

  const result = useMemo(() => calculateTax(input), [input]);
  const optimizer = useMemo(() => calculateOptimizer(result), [result]);

  const n = (key: keyof TaxCalculatorInput) => field(input, setInput, key);

  return (
    <div className="max-w-[1160px] mx-auto px-5 mt-6 mb-16 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-5 items-start">
      <div className="flex flex-col gap-4">
        <Fieldset legend="১. প্রোফাইল" note="Taxpayer category অনুযায়ী tax-free limit ঠিক হয়।">
          <SelectField
            label="Taxpayer category"
            value={input.categoryId}
            onChange={(v) => setInput({ ...input, categoryId: v })}
            options={TAXPAYER_CATEGORIES.map((c) => ({
              value: c.id,
              label: `${c.label} — Tax-free ৳${c.taxFreeLimit.toLocaleString("en-IN")}`,
            }))}
          />
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            <NumberField label="প্রতিবন্ধী সন্তান সংখ্যা (each +৳50,000 tax-free)" {...n("disabledChildren")} />
            <div className="pt-5">
              <CheckField
                label="প্রথমবার করদাতা (first-time, min tax ৳1,000)"
                checked={input.firstTimeFiler}
                onChange={(b) => setInput({ ...input, firstTimeFiler: b })}
              />
            </div>
          </div>
        </Fieldset>

        <Fieldset
          legend="২. বেতন আয় (Salary income)"
          note="Standard exemption = ⅓ of gross salary income বা ৳5,00,000, যেটা কম।"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField label="মূল বেতন (Basic, monthly)" {...n("basicMonthly")} />
            <NumberField label="ভাতা (Allowances, monthly)" {...n("allowanceMonthly")} />
            <NumberField label="বোনাস (Bonus, annual total)" {...n("bonusAnnual")} />
            <NumberField label="Employer PF contribution (monthly)" {...n("employerPFMonthly")} />
          </div>
        </Fieldset>

        <Fieldset legend="৩. ব্যবসা / পেশা ও অন্যান্য আয়">
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField label="ব্যবসা / পেশার নেট মুনাফা (annual)" {...n("businessAnnual")} />
            <NumberField label="বাড়ি ভাড়ার নেট আয় (annual)" {...n("housePropertyAnnual")} />
            <NumberField label="সুদ / ডিভিডেন্ড ইত্যাদি (annual)" {...n("otherIncomeAnnual")} />
          </div>
        </Fieldset>

        <Fieldset
          legend="৪. মূলধনী মুনাফা (Capital gains)"
          note="Listed shares + fund units মিলে বছরে ৫০ লাখ পর্যন্ত exempt, বাকিটা flat 15%।"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField label="Listed shares/fund units gain (annual)" {...n("cgSharesFund")} />
            <NumberField label="অন্য সম্পদ, ৫ বছরের মধ্যে বিক্রি (slab rate)" {...n("cgWithin5Years")} />
            <NumberField label="অন্য সম্পদ, ৫ বছর পর বিক্রি (flat 15%)" {...n("cgAfter5Years")} />
            <NumberField label="জমি — দলিল মূল্যের চেয়ে বেশি অংশ (slab rate)" {...n("cgLand")} />
            <NumberField label="স্বর্ণ / গহনা / মূল্যবান জিনিস (flat 5%)" {...n("cgGold")} />
          </div>
        </Fieldset>

        <Fieldset
          legend="৫. বিনিয়োগ (Investment — rebate eligible)"
          note="Sanchaypatra + Govt securities + Mutual fund মিলে বছরে ৫ লাখ শেয়ার্ড cap। DPS বছরে ৳1,20,000 পর্যন্ত।"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <NumberField label="সঞ্চয়পত্র (annual)" {...n("invSanchayAnnual")} />
            <NumberField label="Govt securities/bonds (annual)" {...n("invBondAnnual")} />
            <NumberField label="Mutual fund/ETF (annual)" {...n("invMFAnnual")} />
            <NumberField label="DSE listed stock, নতুন বিনিয়োগ (annual)" {...n("invStockAnnual")} />
            <NumberField label="জীবন বীমা প্রিমিয়াম (annual)" {...n("invLifeAnnual")} />
            <NumberField label="PF, নিজের contribution (monthly)" {...n("invPFMonthly")} />
            <NumberField label="DPS (monthly)" {...n("invDPSMonthly")} />
            <NumberField label="অনুমোদিত দাতব্য প্রতিষ্ঠানে দান (annual)" {...n("invDonationAnnual")} />
          </div>
        </Fieldset>

        <Fieldset legend="৬. AIT">
          <NumberField label="আগেই কর্তিত AIT (advance tax / TDS)" {...n("aitPaid")} />

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
            তোমার significant সম্পদ / সম্পত্তি আছে? (বেশিরভাগ মানুষের জন্য এটা প্রযোজ্য না)
          </button>

          {wealthOpen && (
            <div className="pt-3">
              <p className="text-xs text-muted mb-2.5">
                Net wealth ৪ কোটির নিচে হলে, ba multiple car/8000+ sqft property na thakle, এই
                section তোমার জন্য না।
              </p>
              <NumberField label="মোট নেট সম্পদ (statement of assets, if known)" {...n("netWealth")} />
              <CheckField
                label="একাধিক গাড়ি আছে"
                checked={input.multiCar}
                onChange={(b) => setInput({ ...input, multiCar: b })}
              />
              <CheckField
                label="সিটি কর্পোরেশনে ৮,০০০ বর্গফুটের বেশি বাড়ি/জমি আছে"
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
            তোমার এস্টিমেট, ধাপে ধাপে
          </h2>
          <TaxBreakdown r={result} ait={input.aitPaid} />
          <p className="text-[11px] text-muted mt-3.5 pt-2.5 border-t border-line">
            Ei ekটা rough estimate, official record na, ar kothao save hoy na। Per-instrument
            sub-caps simplified। Real filing er age sob officially verify koro।
          </p>
        </div>

        <RebateOptimizer opt={optimizer} />
      </div>
    </div>
  );
}
