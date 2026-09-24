"use client";

import { useState } from "react";
import type { TaxCalculationResult } from "@/lib/tax/types";
import { fmtTaka } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";

export function TaxSlipModal({
  result,
  ait,
  onClose,
  shareUrl,
}: {
  result: TaxCalculationResult;
  ait: number;
  onClose: () => void;
  shareUrl: string;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-line rounded-sm max-w-xl w-full shadow-xl overflow-hidden my-8">
        {/* Modal Controls Bar */}
        <div className="bg-[#FAF9F5] border-b border-line px-5 py-3 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-green-deep">
              {t("TAX ESTIMATE SLIP", "আয়কর প্রাক্কলন স্লিপ")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="px-2.5 py-1 text-xs border border-line bg-card hover:border-gold rounded-xs text-foreground font-medium transition-colors"
            >
              {copied ? t("✓ Copied!", "✓ লিংক কপি হয়েছে!") : t("📋 Copy Link", "📋 লিংক কপি করুন")}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs bg-green-deep text-paper rounded-xs font-medium hover:bg-green-deep/90 transition-colors"
            >
              {t("🖨️ Print / PDF", "🖨️ প্রিন্ট / পিডিএফ")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground text-lg leading-none px-1"
            >
              ×
            </button>
          </div>
        </div>

        {/* Printable Formal Slip Content */}
        <div id="printable-tax-slip" className="p-6 text-foreground bg-card space-y-4">
          <div className="text-center pb-3 border-b-2 border-green-deep">
            <h2 className="font-serif font-bold text-xl text-green-deep">
              TakaTalks — {t("Income Tax Estimation Slip", "আয়কর হিসাব বিবরণী")}
            </h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              {t("Assessment Year 2025–2026", "করবর্ষ ২০২৫–২০২৬")} • {t("Client-Side Calculation", "ডিভাইসে প্রস্তুতকৃত")}
            </p>
          </div>

          {/* Income Breakdown Table */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-green-deep text-xs uppercase tracking-wider font-mono">
              {t("1. Income Summary", "১. মোট আয়ের বিবরণী")}
            </div>
            <div className="space-y-1 divide-y divide-line/60">
              <div className="flex justify-between py-1">
                <span className="text-muted">{t("Total Gross Income", "মোট অর্জিত আয়")}:</span>
                <span className="font-mono font-medium">
                  {fmtTaka(
                    result.grossSalary +
                      result.business +
                      result.houseProperty +
                      result.otherIncome +
                      result.freelanceIncome +
                      result.sharesFundGain +
                      result.cgWithin5 +
                      result.cgLand
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">{t("Total Taxable Income", "করযোগ্য মোট আয়")}:</span>
                <span className="font-mono font-semibold text-green-deep">{fmtTaka(result.slabBase)}</span>
              </div>
            </div>
          </div>

          {/* Tax Slabs Applied */}
          <div className="space-y-2 text-xs pt-2 border-t border-line/60">
            <div className="font-semibold text-green-deep text-xs uppercase tracking-wider font-mono">
              {t("2. Slab Tax on Income", "২. স্ল্যাব অনুযায়ী কর নির্ধারণ")}
            </div>
            <div className="space-y-1">
              {result.slabRows.map((row, idx) => (
                <div key={idx} className="flex justify-between text-[11.5px] py-0.5">
                  <span className="text-muted font-mono">
                    {row.rate === 0
                      ? t("Tax-free slab", "করমুক্ত স্ল্যাব")
                      : `${row.rate * 100}% on ${fmtTaka(row.chunk)}`}
                  </span>
                  <span className="font-mono">{fmtTaka(row.tax)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-1 border-t border-line/40">
                <span>{t("Gross Slab Tax", "স্ল্যাব ভিত্তিক কর")}:</span>
                <span className="font-mono">{fmtTaka(result.baseSlabTax)}</span>
              </div>
            </div>
          </div>

          {/* Rebates & Deductions */}
          <div className="space-y-2 text-xs pt-2 border-t border-line/60">
            <div className="font-semibold text-green-deep text-xs uppercase tracking-wider font-mono">
              {t("3. Rebates & Final Payable", "৩. কর রেয়াত ও চূড়ান্ত প্রদেয়")}
            </div>
            <div className="space-y-1.5 divide-y divide-line/40">
              <div className="flex justify-between py-1">
                <span className="text-muted">{t("Eligible Investment Rebate", "বিনিয়োগজনিত কর রেয়াত")}:</span>
                <span className="font-mono font-semibold text-green">−{fmtTaka(result.rebate)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">{t("Net Tax (after rebate)", "রেয়াত বাদে নীট কর")}:</span>
                <span className="font-mono">{fmtTaka(result.taxAfterRebate)}</span>
              </div>
              {result.surchargeAmt > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-muted">{t("Net Wealth Surcharge", "সম্পদ সারচার্জ")}:</span>
                  <span className="font-mono">+{fmtTaka(result.surchargeAmt)}</span>
                </div>
              )}
              {ait > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-muted">{t("AIT / TDS Already Deducted", "অগ্রিম কর্তিত কর (AIT)")}:</span>
                  <span className="font-mono text-muted">−{fmtTaka(ait)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Final Result Highlight Box */}
          {(() => {
            const finalPayable = result.netPayable - ait;
            return (
              <div
                className={`p-4 rounded-sm border ${
                  finalPayable > 0
                    ? "bg-[#FCF7F7] border-red/30"
                    : "bg-[#F7FBF8] border-green/30"
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-green-deep">
                    {finalPayable >= 0
                      ? t("Final Net Tax Payable:", "সর্বমোট পরিশোধযোগ্য কর:")
                      : t("Estimated Tax Refund Due:", "সম্ভাব্য কর ফেরত (Refund):")}
                  </span>
                  <span
                    className={`font-mono font-bold text-2xl ${
                      finalPayable > 0 ? "text-red" : "text-green"
                    }`}
                  >
                    {fmtTaka(Math.abs(finalPayable))}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="text-[10.5px] text-muted leading-relaxed pt-2 border-t border-line/60">
            {t(
              "Note: This document is an estimate generated on-device by TakaTalks (takatalks.com) and does not replace the official NBR Return Submission Acknowledgement (PSR).",
              "বিশেষ দ্রষ্টব্য: এটি TakaTalks এর মাধ্যমে ব্যবহারকারীর ডিভাইসে প্রস্তুতকৃত একটি আনঅফিসিয়াল হিসাব, যা জাতীয় রাজস্ব বোর্ডের (NBR) আনুষ্ঠানিক প্রত্যয়নপত্রের বিকল্প নয়।"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
