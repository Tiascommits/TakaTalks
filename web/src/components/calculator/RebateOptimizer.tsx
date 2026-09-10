import { fmtTaka } from "@/lib/format";
import type { OptimizerResult } from "@/lib/tax/types";

export function RebateOptimizer({ opt }: { opt: OptimizerResult }) {
  if (!opt.hasTaxableIncome) return null;

  const pct = opt.maxRebate > 0 ? Math.min(100, Math.round(((opt.maxRebate - opt.rebateGap) / opt.maxRebate) * 100)) : 100;

  return (
    <div className="bg-amber-bg border border-amber-border px-4.5 py-5">
      <span className="inline-block font-mono text-[10.5px] text-amber-border border border-amber-border px-1.5 py-0.5 mb-2">
        OPTIMIZER
      </span>
      <h2 className="font-serif font-semibold text-[17px] mb-3.5 pb-2 border-b-2 border-amber-border text-[#7A5A10]">
        রিবেট অপটিমাইজার
      </h2>

      {opt.alreadyAtMax ? (
        <>
          <p className="text-sm text-green-deep font-semibold py-2.5">
            ✓ তুমি ইতিমধ্যে সর্বোচ্চ rebate পাচ্ছো — আয়ের 3% বা ৳৭.৫ লাখ, যেটা কম। আর invest করলেও
            tax কমবে না।
          </p>
          <ProgressBar pct={100} current={fmtTaka(opt.maxRebate)} max={fmtTaka(opt.maxRebate)} />
        </>
      ) : (
        <>
          <div className="bg-[#FFF9E6] border border-amber-border px-3.5 py-3 mb-3.5">
            <div className="font-mono text-[22px] font-bold text-green-deep">
              {fmtTaka(opt.taxSaving)} বাঁচাতে পারো
            </div>
            <div className="text-xs text-[#7A5A10] mt-0.5">
              মোট {fmtTaka(opt.additionalInvestmentNeeded)} বেশি invest করলে, tax এতটুকু কমবে
            </div>
          </div>

          <ProgressBar
            pct={pct}
            current={`বর্তমান রিবেট: ${fmtTaka(opt.maxRebate - opt.rebateGap)}`}
            max={`সর্বোচ্চ সম্ভব: ${fmtTaka(opt.maxRebate)} (${pct}% পৌঁছেছো)`}
          />

          <div className="text-xs text-[#7A5A10] font-semibold mb-2 mt-3.5">কোথায় invest করবে:</div>
          {opt.suggestions.map((s) => (
            <div
              key={s.instrumentId}
              className="flex justify-between gap-2 py-1.5 border-b border-dashed border-[#D4A83260] last:border-0 text-[12.5px]"
            >
              <div>
                <div className="text-[#5A4008]">{s.label}</div>
                <div className="text-[11px] text-muted mt-0.5">{s.note}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-teal whitespace-nowrap">
                  {fmtTaka(s.investMore)} invest করো
                </div>
                <div className="text-[11px] text-muted">→ tax কমবে {fmtTaka(s.taxSavingFromThis)}</div>
              </div>
            </div>
          ))}
        </>
      )}

      <p className="text-[11px] text-muted mt-3 pt-2.5 border-t border-[#D4A83260]">
        এটা pure arithmetic — বিনিয়োগের 10% হারে rebate হিসাব হয়। Sub-cap rules simplified।
        Investment কোনটা সবচেয়ে ভালো return দেবে সেটা এখানে নেই — সেটা তোমার সিদ্ধান্ত। Rebate
        পাওয়ার সর্বোচ্চ সীমা হলো তোমার taxable income এর 3% বা ৳৭,৫০,০০০, যেটা কম।
      </p>
    </div>
  );
}

function ProgressBar({ pct, current, max }: { pct: number; current: string; max: string }) {
  return (
    <div className="my-2.5">
      <div className="flex justify-between text-[11.5px] font-mono mb-1 text-[#7A5A10]">
        <span>{current}</span>
        <span>{max}</span>
      </div>
      <div className="h-2 bg-[#EFE0A0] rounded-sm overflow-hidden">
        <div className="h-full bg-green rounded-sm transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
