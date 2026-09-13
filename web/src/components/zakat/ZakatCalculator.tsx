"use client";

import { useMemo, useState } from "react";
import {
  calculateZakat,
  DEFAULT_GOLD_PER_BHORI,
  DEFAULT_SILVER_PER_BHORI,
  GOLD_NISAB_BHORI,
  SILVER_NISAB_BHORI,
  type NisabStandard,
} from "@/lib/zakat/zakat";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";

export function ZakatCalculator() {
  const { t } = useLanguage();

  const [nisabStandard, setNisabStandard] = useState<NisabStandard>("silver");
  const [goldPrice, setGoldPrice] = useState<number>(DEFAULT_GOLD_PER_BHORI);
  const [silverPrice, setSilverPrice] = useState<number>(DEFAULT_SILVER_PER_BHORI);
  const [showRateSettings, setShowRateSettings] = useState<boolean>(false);

  // Cash & Bank
  const [cashInHand, setCashInHand] = useState<number>(0);
  const [bankSavings, setBankSavings] = useState<number>(0);
  const [bankFDR, setBankFDR] = useState<number>(0);
  const [bankInterest, setBankInterest] = useState<number>(0);

  // Gold & Silver
  const [goldBhori, setGoldBhori] = useState<number>(0);
  const [silverBhori, setSilverBhori] = useState<number>(0);

  // Investments & Business
  const [sanchayapatra, setSanchayapatra] = useState<number>(0);
  const [stocksTrading, setStocksTrading] = useState<number>(0);
  const [stocksLongTerm, setStocksLongTerm] = useState<number>(0);
  const [inventory, setInventory] = useState<number>(0);
  const [providentFund, setProvidentFund] = useState<number>(0);

  // Receivables
  const [loansGiven, setLoansGiven] = useState<number>(0);
  const [resaleLand, setResaleLand] = useState<number>(0);

  // Liabilities
  const [immediateDebts, setImmediateDebts] = useState<number>(0);
  const [creditCards, setCreditCards] = useState<number>(0);
  const [upcomingEMIs, setUpcomingEMIs] = useState<number>(0);

  const result = useMemo(
    () =>
      calculateZakat({
        nisabStandard,
        goldPricePerBhori: goldPrice,
        silverPricePerBhori: silverPrice,
        assets: {
          cashInHand,
          bankSavingsAndCurrent: bankSavings,
          bankFDRPrincipal: bankFDR,
          bankInterestEarned: bankInterest,
          goldBhori,
          silverBhori,
          sanchayapatraPrincipal: sanchayapatra,
          stocksTradingValue: stocksTrading,
          stocksLongTermValue: stocksLongTerm,
          businessInventoryWholesale: inventory,
          providentFundAccessible: providentFund,
          loansGivenCollectable: loansGiven,
          flatsOrLandForResale: resaleLand,
        },
        liabilities: {
          immediateDebtsDue: immediateDebts,
          creditCardDues: creditCards,
          upcomingMonthEMIs: upcomingEMIs,
        },
      }),
    [
      nisabStandard,
      goldPrice,
      silverPrice,
      cashInHand,
      bankSavings,
      bankFDR,
      bankInterest,
      goldBhori,
      silverBhori,
      sanchayapatra,
      stocksTrading,
      stocksLongTerm,
      inventory,
      providentFund,
      loansGiven,
      resaleLand,
      immediateDebts,
      creditCards,
      upcomingEMIs,
    ]
  );

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Nisab Selector Card */}
      <div className="bg-[#FBFAF6] border border-line p-4.5 rounded-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] text-gold uppercase tracking-wider font-semibold">
            {t("NISAB BENCHMARK (AY 2025-26 / 1446-1447 AH)", "নিসাব মানদণ্ড (২০২৫-২৬ / ১৪৪৬-১৪৪৭ হিজরি)")}
          </span>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-xs text-muted font-medium">{t("Active Nisab Threshold:", "প্রযোজ্য নিসাব সীমা:")}</span>
            <span className="font-mono font-bold text-green-deep text-base">
              {fmtTaka(result.activeNisabBDT)}
            </span>
            <span className="text-xs text-[#666]">
              ({nisabStandard === "silver" ? `${SILVER_NISAB_BHORI} ${t("Bhori Silver", "ভরি রূপা")}` : `${GOLD_NISAB_BHORI} ${t("Bhori Gold", "ভরি সোনা")}`})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xs border border-line overflow-hidden bg-card text-xs">
            <button
              type="button"
              onClick={() => setNisabStandard("silver")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                nisabStandard === "silver"
                  ? "bg-green-deep text-paper font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("Silver Nisab (Recommended)", "রৌপ্য নিসাব (উত্তম)")}
            </button>
            <button
              type="button"
              onClick={() => setNisabStandard("gold")}
              className={`px-3 py-1.5 font-medium transition-colors border-l border-line ${
                nisabStandard === "gold"
                  ? "bg-green-deep text-paper font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("Gold Nisab", "স্বর্ণ নিসাব")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowRateSettings((v) => !v)}
            className="text-xs text-green font-medium hover:underline px-2 py-1"
          >
            {showRateSettings ? t("Close Rates", "বন্ধ") : t("Edit Rates", "রেট পরিবর্তন")}
          </button>
        </div>
      </div>

      {showRateSettings && (
        <div className="bg-[#FAF9F5] border border-line p-4 rounded-sm mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            label={t("Gold Price per Bhori (৳)", "স্বর্ণের ভরি প্রতি মূল্য (৳)")}
            value={goldPrice}
            onChange={setGoldPrice}
          />
          <NumberField
            label={t("Silver Price per Bhori (৳)", "রূপার ভরি প্রতি মূল্য (৳)")}
            value={silverPrice}
            onChange={setSilverPrice}
          />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-start">
        {/* Left Form: Asset Categories */}
        <div className="flex flex-col gap-5">
          {/* 1. Cash & Bank */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
              {t("1. Cash & Bank Accounts", "১. নগদ অর্থ ও ব্যাংক হিসাব")}
            </h3>
            <div className="space-y-3.5">
              <NumberField
                label={t("Cash in Hand (৳)", "হাতে থাকা নগদ টাকা (৳)")}
                value={cashInHand}
                onChange={setCashInHand}
              />
              <NumberField
                label={t("Bank Accounts — Savings & Current (৳)", "ব্যাংক একাউন্ট — সঞ্চয়ী ও চলতি (৳)")}
                value={bankSavings}
                onChange={setBankSavings}
              />
              <NumberField
                label={t("Bank Fixed Deposit / FDR Principal (৳)", "ব্যাংক স্থায়ী আমানত / এফডিআর মূলধন (৳)")}
                value={bankFDR}
                onChange={setBankFDR}
              />
              <div className="pt-1">
                <NumberField
                  label={t("Bank Interest / Profit to be Purified (৳)", "ব্যাংক সুদ / মুনাফা (সাওয়াবের নিয়ত ছাড়া দান করতে হবে) (৳)")}
                  value={bankInterest}
                  onChange={setBankInterest}
                />
                <span className="text-[11px] text-muted block mt-1">
                  {t(
                    "Conventional bank interest is Riba; it must be separated and given to charity without spiritual reward.",
                    "সুদযুক্ত ব্যাংকের অর্জিত সুদ সম্পূর্ণভাবে দরিদ্রদের সাওয়াবের আশা ছাড়া দান করে একাউন্ট হালাল রাখতে হয়।"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Precious Metals */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
              {t("2. Gold & Silver (স্বর্ণ ও রৌপ্য)", "২. সোনা ও রূপা")}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs text-[#555] mb-1 font-medium">
                  {t("Gold Jewelry & Bullion (Bhori / Tola)", "স্বর্ণালঙ্কার ও বার (ভরি / তোলা)")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={goldBhori || ""}
                    onChange={(e) => setGoldBhori(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-line bg-[#FCFBF8] text-sm font-mono focus:outline-none focus:border-green"
                  />
                  <span className="text-xs font-mono text-muted whitespace-nowrap">
                    ≈ {fmtTaka(Math.round(goldBhori * goldPrice))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#555] mb-1 font-medium">
                  {t("Silver Jewelry & Coins (Bhori / Tola)", "রূপার গহনা ও মুদ্রা (ভরি / তোলা)")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={silverBhori || ""}
                    onChange={(e) => setSilverBhori(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-line bg-[#FCFBF8] text-sm font-mono focus:outline-none focus:border-green"
                  />
                  <span className="text-xs font-mono text-muted whitespace-nowrap">
                    ≈ {fmtTaka(Math.round(silverBhori * silverPrice))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Investments & Business */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
              {t("3. Investments & Business Assets", "৩. সঞ্চয়পত্র, শেয়ার ও ব্যবসায়িক পণ্য")}
            </h3>
            <div className="space-y-3.5">
              <NumberField
                label={t("Sanchayapatra Principal (৳)", "সঞ্চয়পত্রে জমাকৃত আসল টাকা (৳)")}
                value={sanchayapatra}
                onChange={setSanchayapatra}
              />
              <NumberField
                label={t("Stock Market — Trading Shares at Market Value (৳)", "শেয়ার বাজার — বিক্রয়ের উদ্দেশ্যে রাখা শেয়ার (১০০%) (৳)")}
                value={stocksTrading}
                onChange={setStocksTrading}
              />
              <NumberField
                label={t("Stock Market — Long-Term Dividend Shares (30% zakatable) (৳)", "শেয়ার বাজার — দীর্ঘমেয়াদী ডিভিডেন্ড শেয়ার (৩০% যাকাতযোগ্য) (৳)")}
                value={stocksLongTerm}
                onChange={setStocksLongTerm}
              />
              <NumberField
                label={t("Business Inventory / Goods for Resale (Wholesale value) (৳)", "ব্যবসায়ের অবিক্রিত পণ্যের পাইকারি মূল্য (৳)")}
                value={inventory}
                onChange={setInventory}
              />
              <NumberField
                label={t("Provident Fund (Voluntary / Accessible amount) (৳)", "প্রভিডেন্ট ফান্ড — উত্তোলনযোগ্য স্বেচ্ছাসেবী সঞ্চয় (৳)")}
                value={providentFund}
                onChange={setProvidentFund}
              />
            </div>
          </div>

          {/* 4. Receivables & Land */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
              {t("4. Receivables & Land for Resale", "৪. পাওনা টাকা ও বিক্রয়ের উদ্দেশ্যে কেনা জমি")}
            </h3>
            <div className="space-y-3.5">
              <NumberField
                label={t("Good Loans Given to Others (Expected to be collected) (৳)", "অন্যকে প্রদত্ত ঋণ (যা ফেরত পাওয়ার নিশ্চয়তা আছে) (৳)")}
                value={loansGiven}
                onChange={setLoansGiven}
              />
              <NumberField
                label={t("Land / Property Bought Solely for Resale (Trading) (৳)", "প্লট/ফ্ল্যাট যা শুধু মুনাফায় বিক্রির নিয়তে কেনা (৳)")}
                value={resaleLand}
                onChange={setResaleLand}
              />
            </div>
          </div>

          {/* 5. Deductible Liabilities */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
              {t("5. Deductible Liabilities (বিয়োগযোগ্য দেনা)", "৫. তাৎক্ষণিক ঋণ ও পরিশোধযোগ্য দেনা")}
            </h3>
            <div className="space-y-3.5">
              <NumberField
                label={t("Immediate Debts Due Now (৳)", "তাৎক্ষণিক অপরিশোধিত পাওনা / ধার (৳)")}
                value={immediateDebts}
                onChange={setImmediateDebts}
              />
              <NumberField
                label={t("Credit Card Statement Dues (৳)", "ক্রেডিট কার্ড বিলের বর্তমান বকেয়া (৳)")}
                value={creditCards}
                onChange={setCreditCards}
              />
              <NumberField
                label={t("Upcoming Monthly Loan EMIs / House Rent Due (৳)", "আসন্ন মাসের কিস্তি বা বাসা ভাড়া (৳)")}
                value={upcomingEMIs}
                onChange={setUpcomingEMIs}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Zakat Due Summary */}
        <div className="flex flex-col gap-5 sticky top-5">
          <div className="bg-card border-2 border-green p-5.5 rounded-sm shadow-xs">
            <span className="text-[10.5px] font-mono text-muted uppercase tracking-wider block mb-1">
              {t("ANNUAL PURIFICATION (2.5%)", "বাৎসরিক সম্পদ পরিশুদ্ধি (২.৫%)")}
            </span>

            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs text-[#555]">{t("Total Zakat Payable:", "ওয়াজিব যাকাতের পরিমাণ:")}</span>
              <span className="font-mono text-3xl font-bold text-green-deep">
                {fmtTaka(result.zakatDueBDT)}
              </span>
            </div>

            {/* Nisab Status Badge */}
            <div className="mb-4">
              {result.isZakatObligatory ? (
                <div className="bg-[#EFF8F1] border border-green/40 p-3 rounded-xs text-xs">
                  <span className="font-bold text-green block mb-0.5">
                    ✓ {t("Zakat is Obligatory (Fard)", "যাকাত প্রদান ফরজ")}
                  </span>
                  <span className="text-[#444] text-[11.5px] block leading-relaxed">
                    {t(
                      `Your net zakatable wealth (${fmtTaka(result.netZakatableWealth)}) exceeds the ${nisabStandard} nisab (${fmtTaka(result.activeNisabBDT)}).`,
                      `আপনার নীট যাকাতযোগ্য সম্পদ (${fmtTaka(result.netZakatableWealth)}) ${nisabStandard === "silver" ? "রৌপ্য" : "স্বর্ণ"} নিসাব (${fmtTaka(result.activeNisabBDT)}) অতিক্রম করেছে।`
                    )}
                  </span>
                </div>
              ) : (
                <div className="bg-[#FFFBEB] border border-gold/40 p-3 rounded-xs text-xs">
                  <span className="font-bold text-gold block mb-0.5">
                    ℹ {t("Below Nisab Threshold", "নিসাব সীমার নিচে")}
                  </span>
                  <span className="text-[#444] text-[11.5px] block leading-relaxed">
                    {t(
                      `Net zakatable wealth is below ${fmtTaka(result.activeNisabBDT)}. Zakat is not obligatory.`,
                      `নীট যাকাতযোগ্য সম্পদ নিসাব সীমার নিচে। আপনার উপর যাকাত ফরজ নয়।`
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Wealth Breakdown */}
            <div className="border-t border-line pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">{t("Cash & Bank:", "নগদ ও ব্যাংক আমানত:")}</span>
                <span className="font-mono">{fmtTaka(result.cashTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("Precious Metals:", "স্বর্ণ ও রৌপ্য:")}</span>
                <span className="font-mono">{fmtTaka(result.preciousMetalsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("Investments & Business:", "বিনিয়োগ ও পণ্য:")}</span>
                <span className="font-mono">{fmtTaka(result.investmentsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("Receivables & Resale Land:", "পাওনা ও ব্যবসায়িক জমি:")}</span>
                <span className="font-mono">{fmtTaka(result.receivablesTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-1.5 font-medium">
                <span>{t("Total Zakatable Assets:", "মোট যাকাতযোগ্য সম্পদ:")}</span>
                <span className="font-mono text-green-deep">{fmtTaka(result.totalZakatableAssets)}</span>
              </div>
              <div className="flex justify-between text-[#B91C1C]">
                <span>{t("Less Allowable Liabilities:", "বাদ পরিশোধযোগ্য দেনা:")}</span>
                <span className="font-mono">-{fmtTaka(result.totalLiabilities)}</span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-1.5 font-semibold text-foreground">
                <span>{t("Net Zakatable Wealth:", "নীট যাকাতযোগ্য সম্পদ:")}</span>
                <span className="font-mono text-sm">{fmtTaka(result.netZakatableWealth)}</span>
              </div>
            </div>
          </div>

          {/* Riba / Bank Interest Purification Box */}
          {result.interestToPurifyBDT > 0 && (
            <div className="bg-[#FEF2F2] border border-red-300 p-4 rounded-sm text-xs">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                <span>⚠️</span>
                <span>{t("Riba Purification Required", "ব্যাংক সুদ পরিশুদ্ধি করণীয়")}</span>
              </div>
              <p className="text-[#555] leading-relaxed mb-2">
                {t(
                  `You recorded ${fmtTaka(result.interestToPurifyBDT)} in bank interest. In Islamic jurisprudence, interest is not considered your property and cannot be used for Zakat or personal expense. It should be given to the needy without seeking reward.`,
                  `আপনি ${fmtTaka(result.interestToPurifyBDT)} টাকা ব্যাংক সুদ উল্লেখ করেছেন। শরিয়তের দৃষ্টিতে সুদ আপনার মালিকানাভুক্ত নয় এবং এটি যাকাত হিসেবে প্রদান করা যায় না। সওয়াবের আশা ছাড়া এটি নিঃস্ব ব্যক্তিদের দান করে দিতে হয়।`
                )}
              </p>
              <div className="flex justify-between items-center font-mono font-bold text-red-700 pt-1 border-t border-red-200">
                <span>{t("Purification Amount:", "দানযোগ্য সুদের অর্থ:")}</span>
                <span>{fmtTaka(result.interestToPurifyBDT)}</span>
              </div>
            </div>
          )}

          {/* Guidance Note */}
          <div className="bg-[#FAF9F5] border border-line p-4 rounded-sm text-xs text-muted leading-relaxed space-y-1.5">
            <p className="font-semibold text-foreground">
              {t("Islamic Jurisprudence Notes:", "শরিয়ত নির্দেশিকা:")}
            </p>
            <p>
              • {t("Personal residence, personal furniture, and vehicle used for personal transport are 100% exempt from Zakat.", "নিজের বসবাসের বাড়ি, ব্যবহার্য আসবাবপত্র ও ব্যক্তিগত গাড়ি যাকাতমুক্ত।")}
            </p>
            <p>
              • {t("Zakat is distributed to the eight categories specified in Surah At-Tawbah (9:60), prioritizing needy relatives and destitute individuals.", "সূরা তাওবার ৬০ নম্বর আয়াতে বর্ণিত ৮টি খাতে যাকাত বণ্টনের নির্দেশ রয়েছে, যেখানে নিঃস্ব আত্মীয়রা অগ্রাধিকার পান।")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
