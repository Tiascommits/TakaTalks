"use client";

import { useMemo, useState } from "react";
import {
  VEHICLE_SLABS,
  calculateCarAit,
  calculateTaxAbsorption,
  calculateMultiCarComparison,
  calculateCarTco,
} from "@/lib/cars/car-tax";
import { VehicleCategory, FuelType } from "@/lib/cars/types";
import { fmtTaka } from "@/lib/format";
import { NumberField } from "@/components/ui/fields";
import { useLanguage } from "@/lib/i18n";
import Link from "next/link";

interface CarPreset {
  id: string;
  name: string;
  category: VehicleCategory;
  price: number;
  fuelType: FuelType;
  monthlyKm: number;
  hasDriver: boolean;
}

const CAR_PRESETS: CarPreset[] = [
  {
    id: "axio_1500",
    name: "Toyota Axio / Allion (1.5L)",
    category: "CAR_UP_TO_1500CC",
    price: 2_400_000,
    fuelType: "PETROL_OCTANE",
    monthlyKm: 1_000,
    hasDriver: false,
  },
  {
    id: "noah_premio_2000",
    name: "Toyota Noah / Premio (2.0L)",
    category: "CAR_1501_TO_2000CC",
    price: 4_200_000,
    fuelType: "PETROL_OCTANE",
    monthlyKm: 1_200,
    hasDriver: true,
  },
  {
    id: "byd_ev",
    name: "BYD Atto 3 / Seal (150kW EV)",
    category: "EV_125_TO_150KW",
    price: 5_500_000,
    fuelType: "EV",
    monthlyKm: 1_200,
    hasDriver: false,
  },
  {
    id: "harrier_hybrid",
    name: "Toyota Harrier Hybrid (2.5L)",
    category: "CAR_2001_TO_2500CC",
    price: 7_500_000,
    fuelType: "HYBRID",
    monthlyKm: 1_500,
    hasDriver: true,
  },
  {
    id: "prado_jeep",
    name: "Toyota Prado (2.7L Jeep)",
    category: "CAR_2501_TO_3000CC",
    price: 14_000_000,
    fuelType: "PETROL_OCTANE",
    monthlyKm: 1_500,
    hasDriver: true,
  },
];

export function CarCalculator() {
  const { t, lang } = useLanguage();

  // Tab State
  const [activeTab, setActiveTab] = useState<"absorption" | "multicar" | "tco">("absorption");

  // Core Inputs
  const [category, setCategory] = useState<VehicleCategory>("CAR_UP_TO_1500CC");
  const [isSecondOrMoreCar, setIsSecondOrMoreCar] = useState<boolean>(false);
  const [annualTaxLiability, setAnnualTaxLiability] = useState<number>(60_000);

  // TCO Specific Inputs
  const [vehiclePrice, setVehiclePrice] = useState<number>(2_500_000);
  const [downPayment, setDownPayment] = useState<number>(1_000_000);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(5);
  const [loanInterestRatePct] = useState<number>(12);
  const [monthlyKm, setMonthlyKm] = useState<number>(1_000);
  const [fuelType, setFuelType] = useState<FuelType>("PETROL_OCTANE");
  const [hasDriver, setHasDriver] = useState<boolean>(false);
  const [driverSalaryMonthly, setDriverSalaryMonthly] = useState<number>(20_000);
  const [monthlyHouseholdIncome, setMonthlyHouseholdIncome] = useState<number>(150_000);

  function handleApplyPreset(preset: CarPreset) {
    setCategory(preset.category);
    setVehiclePrice(preset.price);
    setDownPayment(Math.round(preset.price * 0.4));
    setFuelType(preset.fuelType);
    setMonthlyKm(preset.monthlyKm);
    setHasDriver(preset.hasDriver);
  }

  // Calculated Results
  const aitResult = useMemo(
    () => calculateCarAit({ category, isSecondOrMoreCar }),
    [category, isSecondOrMoreCar]
  );

  const absorptionResult = useMemo(
    () => calculateTaxAbsorption(aitResult.totalAitDue, annualTaxLiability),
    [aitResult.totalAitDue, annualTaxLiability]
  );

  const multiCarResult = useMemo(
    () => calculateMultiCarComparison(category, annualTaxLiability),
    [category, annualTaxLiability]
  );

  const tcoResult = useMemo(
    () =>
      calculateCarTco({
        vehiclePrice,
        downPayment,
        loanTenureYears,
        loanInterestRatePct,
        monthlyKm,
        fuelType,
        hasDriver,
        driverSalaryMonthly,
        parkingTollMonthly: 3_500,
        monthlyHouseholdIncome,
      }),
    [
      vehiclePrice,
      downPayment,
      loanTenureYears,
      loanInterestRatePct,
      monthlyKm,
      fuelType,
      hasDriver,
      driverSalaryMonthly,
      monthlyHouseholdIncome,
    ]
  );

  const activeSlab = VEHICLE_SLABS[category];

  return (
    <div className="max-w-[1160px] mx-auto px-5 py-6">
      {/* Preset Pill Bar */}
      <div className="mb-6">
        <label className="block text-xs font-mono text-muted uppercase mb-2 font-semibold">
          {t("Popular Bangladesh Car Presets:", "জনপ্রিয় গাড়ির মডেল প্রিসেট:")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CAR_PRESETS.map((p) => {
            const isSelected = category === p.category && vehiclePrice === p.price;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2.5 text-left border rounded-xs transition-all text-xs ${
                  isSelected
                    ? "bg-green-deep text-paper border-green-deep shadow-xs"
                    : "bg-card border-line hover:border-green text-ink"
                }`}
              >
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{fmtTaka(p.price)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex border-b border-line mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("absorption")}
          className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "absorption"
              ? "border-green-deep text-green-deep"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <span>⚖️</span>
          {t("1. CC Slabs & Tax Absorption", "১. সিসি স্ল্যাব ও কর সমন্বয়")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("multicar")}
          className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "multicar"
              ? "border-green-deep text-green-deep"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <span>🚗🚗</span>
          {t("2. Multiple Cars Surcharge Trap", "২. একাধিক গাড়ির সারচার্জ ঝুঁকি")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tco")}
          className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "tco"
              ? "border-green-deep text-green-deep"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <span>💰</span>
          {t("3. Affordability & Monthly TCO", "৩. মাসিক প্রকৃত খরচ ও সামর্থ্য")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form / Inputs Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Vehicle Category Selector */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b border-line">
              {t("Vehicle & Engine Selection", "গাড়ির ধরন ও ইঞ্জিন নির্বাচন")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                  {t("Engine Capacity / Vehicle Type", "ইঞ্জিনের সিসি / গাড়ির শ্রেণি")}
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as VehicleCategory;
                    setCategory(cat);
                    const cfg = VEHICLE_SLABS[cat];
                    if (cfg) setFuelType(cfg.fuelType);
                  }}
                  className="w-full text-sm bg-paper border border-line p-2.5 rounded-xs focus:outline-none focus:border-green font-sans"
                >
                  <optgroup label={t("Petrol / Octane / Hybrid Cars", "পেট্রোল / অকটেন / হাইব্রিড গাড়ি")}>
                    <option value="CAR_UP_TO_1500CC">
                      {lang === "bn" ? "১৫০০ সিসি পর্যন্ত (৳২৫,০০০ AIT)" : "Up to 1500cc (৳25,000 AIT)"}
                    </option>
                    <option value="CAR_1501_TO_2000CC">
                      {lang === "bn" ? "১৫০১ - ২০০০ সিসি (৳৫০,০০০ AIT)" : "1501cc – 2000cc (৳50,000 AIT)"}
                    </option>
                    <option value="CAR_2001_TO_2500CC">
                      {lang === "bn" ? "২০০১ - ২৫০০ সিসি (৳৭৫,০০০ AIT)" : "2001cc – 2500cc (৳75,000 AIT)"}
                    </option>
                    <option value="CAR_2501_TO_3000CC">
                      {lang === "bn" ? "২৫০১ - ৩০০০ সিসি (৳১,২৫,০০০ AIT)" : "2501cc – 3000cc (৳1,25,000 AIT)"}
                    </option>
                    <option value="CAR_3001_TO_3500CC">
                      {lang === "bn" ? "৩০০১ - ৩৫০০ সিসি (৳১,৫০,০০০ AIT)" : "3001cc – 3500cc (৳1,50,000 AIT)"}
                    </option>
                    <option value="CAR_ABOVE_3500CC">
                      {lang === "bn" ? "৩৫০০ সিসির উপরে (৳২,০০,০০০ AIT)" : "Above 3500cc (৳2,00,000 AIT)"}
                    </option>
                    <option value="MICROBUS">
                      {lang === "bn" ? "মাইক্রোবাস (৳৩০,০০০ AIT)" : "Microbus (৳30,000 AIT)"}
                    </option>
                  </optgroup>
                  <optgroup label={t("Electric Vehicles (EV)", "বৈদ্যুতিক গাড়ি (EV)")}>
                    <option value="EV_UP_TO_75KW">
                      {lang === "bn" ? "ইভি: ৭৫ kW পর্যন্ত (৳২০,০০০ AIT)" : "EV: Up to 75 kW (৳20,000 AIT)"}
                    </option>
                    <option value="EV_75_TO_100KW">
                      {lang === "bn" ? "ইভি: ৭৫ - ১০০ kW (৳৪০,০০০ AIT)" : "EV: 75 kW – 100 kW (৳40,000 AIT)"}
                    </option>
                    <option value="EV_100_TO_125KW">
                      {lang === "bn" ? "ইভি: ১০০ - ১২৫ kW (৳৬০,০০০ AIT)" : "EV: 100 kW – 125 kW (৳60,000 AIT)"}
                    </option>
                    <option value="EV_125_TO_150KW">
                      {lang === "bn" ? "ইভি: ১২৫ - ১৫০ kW (৳৮০,০০০ AIT)" : "EV: 125 kW – 150 kW (৳80,000 AIT)"}
                    </option>
                    <option value="EV_ABOVE_150KW">
                      {lang === "bn" ? "ইভি: ১৫০ kW এর উপরে (৳১,০০,০০০ AIT)" : "EV: Above 150 kW (৳1,00,000 AIT)"}
                    </option>
                  </optgroup>
                </select>
                <p className="text-[11px] text-muted mt-1.5">
                  <span className="font-semibold text-ink">{t("Typical models: ", "উদাহরণ: ")}</span>
                  {lang === "bn" ? activeSlab.typicalCarsBn : activeSlab.typicalCarsEn}
                </p>
              </div>

              {/* Second Car Toggle */}
              <div className="pt-2 border-t border-line">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSecondOrMoreCar}
                    onChange={(e) => setIsSecondOrMoreCar(e.target.checked)}
                    className="mt-0.5 rounded-xs text-green focus:ring-green"
                  />
                  <div>
                    <span className="text-xs font-semibold text-ink block">
                      {t("This is a 2nd or additional car under same TIN", "এটি আমার টিআইএন-এ ২য় বা অতিরিক্ত গাড়ি")}
                    </span>
                    <span className="text-[11px] text-muted block mt-0.5">
                      {t(
                        "Section 153 imposes a 50% extra AIT penalty on multiple vehicles.",
                        "আয়কর আইন ২০২৩ অনুযায়ী দ্বিতীয় বা অতিরিক্ত গাড়ির জন্য ৫০% বাড়তি এআইটি প্রযোজ্য।"
                      )}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Tax Liability & Context */}
          <div className="bg-card border border-line p-5 rounded-sm">
            <h2 className="font-serif font-semibold text-lg text-green-deep mb-3 pb-2 border-b border-line flex justify-between items-center">
              <span>{t("Your Annual Tax Situation", "আপনার বাৎসরিক কর পরিস্থিতি")}</span>
              <Link
                href="/calculator"
                className="text-[11px] font-sans font-normal text-gold hover:underline"
              >
                {t("Calculate tax first →", "আগে ট্যাক্স হিসাব করুন →")}
              </Link>
            </h2>

            <div className="space-y-3">
              <NumberField
                label={t("Estimated Annual Income Tax Liability", "বাৎসরিক প্রদেয় আয়কর (আনুমানিক)")}
                value={annualTaxLiability}
                onChange={setAnnualTaxLiability}
              />
              <p className="text-[11px] text-muted leading-relaxed">
                {t(
                  "Enter what you usually owe NBR on your salary or business. Car AIT is deducted in advance, so if your tax liability is higher than the AIT, you pay zero extra net tax!",
                  "স্যালারি বা ব্যবসার ওপর বছরে আপনার আনুমানিক কত কর আসে তা দিন। গাড়ির এআইটি অগ্রিম কর হিসেবে অ্যাডজাস্ট হয়, তাই আপনার মোট ট্যাক্স এআইটির চেয়ে বেশি হলে বাড়তি কোনো ট্যাক্স খরচ হয় না!"
                )}
              </p>
            </div>
          </div>

          {/* TCO Specific Inputs (Visible in TCO tab or when customizing) */}
          {activeTab === "tco" && (
            <div className="bg-card border border-line p-5 rounded-sm space-y-4">
              <h2 className="font-serif font-semibold text-lg text-green-deep mb-2 pb-2 border-b border-line">
                {t("Purchase & Running Cost Details", "গাড়ির দাম ও মাসিক ব্যবহারের তথ্য")}
              </h2>

              <NumberField
                label={t("Car Purchase Price (Total)", "গাড়ির ক্রয়মূল্য")}
                value={vehiclePrice}
                onChange={setVehiclePrice}
              />

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label={t("Down Payment (Cash)", "ডাউনপেমেন্ট (নগদ)")}
                  value={downPayment}
                  onChange={setDownPayment}
                />
                <div>
                  <label className="block text-xs text-[#555] mb-1">
                    {t("Loan Tenure (Years)", "লোন সময়কাল (বছর)")}
                  </label>
                  <select
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="w-full text-sm bg-paper border border-line p-2.5 rounded-xs"
                  >
                    <option value={0}>{t("0 (Full Cash / No Loan)", "০ (সম্পূর্ণ নগদ / নো লোন)")}</option>
                    <option value={3}>{t("3 Years (36 mos)", "৩ বছর")}</option>
                    <option value={5}>{t("5 Years (60 mos)", "৫ বছর")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label={t("Monthly Distance (km)", "মাসে কত কিমি চলবেন")}
                  value={monthlyKm}
                  onChange={setMonthlyKm}
                  currency={false}
                />
                <NumberField
                  label={t("Monthly Net Household Income", "পারিবারিক মাসিক মোট আয়")}
                  value={monthlyHouseholdIncome}
                  onChange={setMonthlyHouseholdIncome}
                />
              </div>

              <div className="pt-2 border-t border-line">
                <label className="flex items-center gap-2 cursor-pointer mb-2.5">
                  <input
                    type="checkbox"
                    checked={hasDriver}
                    onChange={(e) => setHasDriver(e.target.checked)}
                    className="rounded-xs text-green focus:ring-green"
                  />
                  <span className="text-xs font-semibold text-ink">
                    {t("Keep a full-time chauffeur / driver", "ফুল-টাইম ড্রাইভার রাখবেন")}
                  </span>
                </label>
                {hasDriver && (
                  <NumberField
                    label={t("Driver Monthly Salary + Food", "ড্রাইভারের মাসিক বেতন + খোরাকি")}
                    value={driverSalaryMonthly}
                    onChange={setDriverSalaryMonthly}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Output & Analysis Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: Absorption & CC Slabs */}
          {activeTab === "absorption" && (
            <div className="space-y-6">
              {/* Highlight Card */}
              <div className="bg-card border border-line p-5 rounded-sm">
                <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
                  <div>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold font-semibold">
                      {t("BRTA ANNUAL ADVANCE TAX", "বিআরটিএ বাৎসরিক অগ্রিম আয়কর")}
                    </span>
                    <h2 className="font-serif font-semibold text-xl text-green-deep">
                      {fmtTaka(aitResult.totalAitDue)}
                      <span className="text-xs font-sans font-normal text-muted ml-1.5">
                        {isSecondOrMoreCar
                          ? t("(/yr, includes 50% 2nd-car penalty)", "(/বছর, ৫০% ২য় গাড়ির পেনাল্টিসহ)")
                          : t("(/year)", "(/বছর)")}
                      </span>
                    </h2>
                  </div>
                  <div
                    className={`px-3 py-1 text-xs font-semibold rounded-xs border ${
                      absorptionResult.status === "FULLY_ABSORBED"
                        ? "bg-green/10 text-green-deep border-green/30"
                        : absorptionResult.status === "PARTIALLY_ABSORBED"
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                        : "bg-red-500/10 text-red-700 border-red-500/30"
                    }`}
                  >
                    {absorptionResult.status === "FULLY_ABSORBED"
                      ? t("100% Tax-Absorbed (Free)", "১০০% কর সমন্বয় (ফ্রি)")
                      : absorptionResult.status === "PARTIALLY_ABSORBED"
                      ? `${absorptionResult.percentageAbsorbed}% ` + t("Absorbed", "সমন্বিত")
                      : t("100% Sunk Cost (Lost)", "১০০% অপচয় (নন-রিফান্ডেবল)")}
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted mb-1.5 font-mono">
                    <span>{t("Tax Absorption Gauge:", "কর সমন্বয়ের মাত্রা:")}</span>
                    <span className="font-semibold text-ink">
                      {fmtTaka(absorptionResult.absorbedAit)} / {fmtTaka(aitResult.totalAitDue)}
                    </span>
                  </div>
                  <div className="w-full bg-paper border border-line rounded-full h-3 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        absorptionResult.status === "FULLY_ABSORBED"
                          ? "bg-green-deep"
                          : "bg-amber-600"
                      }`}
                      style={{ width: `${absorptionResult.percentageAbsorbed}%` }}
                    />
                    {absorptionResult.wastedAit > 0 && (
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${100 - absorptionResult.percentageAbsorbed}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Mathematical Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("Total Annual Tax", "মোট বাৎসরিক আয়কর")}
                    </span>
                    <span className="font-semibold text-sm text-ink">{fmtTaka(annualTaxLiability)}</span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("AIT Offset on Return", "রিটার্নে সমন্বিত AIT")}
                    </span>
                    <span className="font-semibold text-sm text-green-deep">
                      −{fmtTaka(absorptionResult.absorbedAit)}
                    </span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {absorptionResult.wastedAit > 0
                        ? t("Wasted / Sunk AIT", "অপচয় হওয়া AIT")
                        : t("Net Tax Left to Pay", "অবশিষ্ট প্রদেয় কর")}
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        absorptionResult.wastedAit > 0 ? "text-red-600" : "text-ink"
                      }`}
                    >
                      {absorptionResult.wastedAit > 0
                        ? fmtTaka(absorptionResult.wastedAit)
                        : fmtTaka(absorptionResult.netPayableAfterAit)}
                    </span>
                  </div>
                </div>

                {/* Insight Box */}
                <div className="p-3.5 bg-[#FAF7F0] border-l-4 border-gold text-xs leading-relaxed text-ink">
                  <p>{lang === "bn" ? absorptionResult.insightBn : absorptionResult.insightEn}</p>
                </div>
              </div>

              {/* Full CC Comparison Table */}
              <div className="bg-card border border-line p-5 rounded-sm">
                <h3 className="font-serif font-semibold text-base text-green-deep mb-3">
                  {t(
                    "All Engine CC Slabs vs. Your Tax Breakdown",
                    "সব সিসি স্ল্যাব বনাম আপনার কর সমন্বয় তালিকা"
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-line text-muted font-mono">
                        <th className="pb-2 font-normal">{t("Capacity / Type", "ইঞ্জিন ক্ষমতা")}</th>
                        <th className="pb-2 font-normal">{t("Annual AIT", "বাৎসরিক AIT")}</th>
                        <th className="pb-2 font-normal">{t("Absorption on Your Tax", "আপনার ট্যাক্সে সমন্বয়")}</th>
                        <th className="pb-2 font-normal text-right">{t("Verdict", "সিদ্ধান্ত")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {Object.values(VEHICLE_SLABS).map((s) => {
                        const slabAit = isSecondOrMoreCar ? s.baseAnnualAit * 1.5 : s.baseAnnualAit;
                        const isAbsorbed = annualTaxLiability >= slabAit;
                        const isCurrent = s.id === category;
                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-paper/40 ${isCurrent ? "bg-green/5 font-semibold" : ""}`}
                          >
                            <td className="py-2.5 pr-2">
                              <div>{lang === "bn" ? s.engineDescBn : s.engineDescEn}</div>
                              <div className="text-[10px] text-muted truncate max-w-[200px]">
                                {lang === "bn" ? s.typicalCarsBn : s.typicalCarsEn}
                              </div>
                            </td>
                            <td className="py-2.5 font-mono">{fmtTaka(slabAit)}</td>
                            <td className="py-2.5 font-mono">
                              {annualTaxLiability >= slabAit ? (
                                <span className="text-green-deep font-semibold">
                                  {fmtTaka(slabAit)} (100%)
                                </span>
                              ) : (
                                <span className="text-amber-700">
                                  {fmtTaka(Math.min(slabAit, annualTaxLiability))} ({Math.round((annualTaxLiability / slabAit) * 100)}%)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right font-mono">
                              {isAbsorbed ? (
                                <span className="text-green-deep">✓ {t("Free", "ফ্রি")}</span>
                              ) : (
                                <span className="text-red-600">
                                  +{fmtTaka(slabAit - annualTaxLiability)} {t("Loss", "অপচয়")}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Multiple Cars & Surcharge Trap */}
          {activeTab === "multicar" && (
            <div className="space-y-6">
              <div className="bg-card border border-line p-5 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold font-semibold">
                    {t("THE DUAL FINANCIAL TRAP", "দ্বৈত সরকারি কর ফাঁদ")}
                  </span>
                </div>
                <h2 className="font-serif font-semibold text-xl text-green-deep mb-2">
                  {t(
                    "What happens when you buy a 2nd car in Bangladesh?",
                    "বাংলাদেশে নিজের নামে ২য় গাড়ি কিনলে কী ঘটে?"
                  )}
                </h2>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  {t(
                    "Under Section 153 and the Wealth Surcharge Schedule of the Income Tax Act 2023, owning more than one motor car triggers two simultaneous financial hits.",
                    "আয়কর আইন ২০২৩ অনুযায়ী একজনের নামে একাধিক গাড়ি থাকলে একই সাথে দুটি বড় করের বোঝা চাপানো হয়।"
                  )}
                </p>

                {/* The 2 hits cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-paper border border-line rounded-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-ink">
                        {t("1. 50% Extra BRTA AIT", "১. ৫০% অতিরিক্ত এআইটি")}
                      </span>
                      <span className="text-xs font-mono font-bold text-red-600">
                        +{fmtTaka(multiCarResult.extraAitFromSecondCar)}/yr
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {t(
                        `Base AIT jumps from ${fmtTaka(multiCarResult.singleCarAit)} to ${fmtTaka(multiCarResult.secondCarAit)} for the 2nd vehicle.`,
                        `২য় গাড়ির জন্য বেসিক এআইটি ${fmtTaka(multiCarResult.singleCarAit)} টাকা থেকে বেড়ে ${fmtTaka(multiCarResult.secondCarAit)} টাকা হয়।`
                      )}
                    </p>
                  </div>

                  <div className="p-4 bg-paper border border-line rounded-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-ink">
                        {t("2. 10% Wealth Surcharge Floor", "২. ১০% ওয়েলথ সারচার্জ")}
                      </span>
                      <span className="text-xs font-mono font-bold text-red-600">
                        +{fmtTaka(multiCarResult.annualSurchargeAmount)}/yr
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {t(
                        `A flat 10% surcharge is levied on your entire tax bill (even if total net wealth is below ৳4 crore).`,
                        `আপনার মোট করের ওপর ফ্ল্যাট ১০% সারচার্জ ধার্য হয় (এমনকি নেট সম্পদ ৪ কোটির নিচে হলেও)।`
                      )}
                    </p>
                  </div>
                </div>

                {/* Total Annual Penalty Summary */}
                <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-xs mb-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-xs font-semibold text-red-700 block">
                        {t("Total Annual Government Penalty:", "মোট বাৎসরিক সরকারি জরিমানা ফি:")}
                      </span>
                      <span className="text-[11px] text-muted">
                        {t(
                          `Equivalent to ${fmtTaka(multiCarResult.monthlyEquivalentPenalty)} / month in pure tax overhead.`,
                          `প্রতি মাসে যা ${fmtTaka(multiCarResult.monthlyEquivalentPenalty)} টাকা বাড়তি কর খরচের সমান।`
                        )}
                      </span>
                    </div>
                    <div className="font-mono text-xl font-bold text-red-700">
                      {fmtTaka(multiCarResult.totalAnnualPenaltyCost)} / yr
                    </div>
                  </div>
                </div>

                {/* Ride-Sharing / Uber Alternative Analysis */}
                <div className="p-4 bg-paper border border-line rounded-xs space-y-2 mb-4">
                  <h3 className="font-semibold text-xs text-green-deep flex items-center gap-1.5">
                    <span>🚕</span>
                    {t("The 'Uber Premier' Economic Comparison", "উবার / রেন্ট-এ-কার বিকল্পের অর্থনৈতিক তুলনা")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t(
                      `In Dhaka, an active daily Uber/ride-sharing budget averages ~৳20,000 to ৳25,000/month. Maintaining a second car costs at least ৳35,000 - ৳50,000/mo (when accounting for driver, fuel, maintenance, depreciation, and the ৳${multiCarResult.monthlyEquivalentPenalty}/mo tax penalty).`,
                      `ঢাকায় প্রতিদিন উবার প্রিমিয়ার ব্যবহার করলেও মাসে গড়ে ২০,০০০ থেকে ২৫,০০০ টাকার বেশি খরচ হয় না। অথচ ২য় নিজস্ব গাড়ি মেইনটেইন করতে ড্রাইভার, তেল, ক্ষয়ক্ষতি এবং মাসিক ৳${multiCarResult.monthlyEquivalentPenalty} সরকারি ট্যাক্স মিলিয়ে মাসে কমপক্ষে ৩৫,০০০ - ৫০,০০০ টাকা চলে যায়।`
                    )}
                  </p>
                </div>

                {/* Legal Tax Planning / Spouse TIN Recommendation */}
                <div className="p-4 bg-[#FAF7F0] border-l-4 border-gold rounded-xs">
                  <h4 className="text-xs font-semibold text-green-deep mb-1">
                    {t("💡 Legal Tax Optimization Strategy", "💡 আইনি ট্যাক্স অপটিমাইজেশন কৌশল")}
                  </h4>
                  <p className="text-xs text-ink leading-relaxed">
                    {lang === "bn"
                      ? multiCarResult.breakEvenRecommendationBn
                      : multiCarResult.breakEvenRecommendationEn}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Total Cost of Ownership (TCO) & Affordability */}
          {activeTab === "tco" && (
            <div className="space-y-6">
              <div className="bg-card border border-line p-5 rounded-sm">
                <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
                  <div>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold font-semibold">
                      {t("MONTHLY TOTAL COMMITMENT", "মাসিক মোট আর্থিক দায়বদ্ধতা")}
                    </span>
                    <h2 className="font-serif font-semibold text-2xl text-green-deep">
                      {fmtTaka(tcoResult.totalMonthlyCommitment)}
                      <span className="text-xs font-sans font-normal text-muted ml-1.5">
                        {t("/ month", "/ মাস")}
                      </span>
                    </h2>
                  </div>
                  <div
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xs border ${
                      tcoResult.affordabilityStatus === "SAFE"
                        ? "bg-green/10 text-green-deep border-green/30"
                        : tcoResult.affordabilityStatus === "STRETCHED"
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                        : "bg-red-500/10 text-red-700 border-red-500/30"
                    }`}
                  >
                    {tcoResult.affordabilityRatio}% {t("of Net Income", "আয়ের অংশ")} —{" "}
                    {tcoResult.affordabilityStatus === "SAFE"
                      ? t("Safe (<=15%)", "নিরাপদ (<=১৫%)")
                      : tcoResult.affordabilityStatus === "STRETCHED"
                      ? t("Stretched (15-25%)", "টাইট (১৫-২৫%)")
                      : t("High Risk (>25%)", "উচ্চ ঝুঁকি (>২৫%)")}
                  </div>
                </div>

                {/* Progress bar gauge */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-muted mb-1.5 font-mono">
                    <span>{t("Affordability Benchmark (Safe ceiling: 15-20%):", "আয়ের ওপর খরচের চাপ (নিরাপদ সীমা: ১৫-২০%):")}</span>
                    <span className="font-semibold text-ink">{tcoResult.affordabilityRatio}%</span>
                  </div>
                  <div className="w-full bg-paper border border-line rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        tcoResult.affordabilityStatus === "SAFE"
                          ? "bg-green-deep"
                          : tcoResult.affordabilityStatus === "STRETCHED"
                          ? "bg-amber-500"
                          : "bg-red-600"
                      }`}
                      style={{ width: `${Math.min(100, tcoResult.affordabilityRatio * 2.5)}%` }}
                    />
                  </div>
                </div>

                {/* Monthly Cost Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("Loan EMI", "ব্যাংক লোন কিস্তি")}
                    </span>
                    <span className="font-semibold text-sm text-ink">{fmtTaka(tcoResult.monthlyLoanEmi)}</span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("Fuel / Charging", "জ্বালানি / চার্জিং")}
                    </span>
                    <span className="font-semibold text-sm text-ink">{fmtTaka(tcoResult.monthlyFuelCost)}</span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("Chauffeur / Driver", "ড্রাইভার বেতন")}
                    </span>
                    <span className="font-semibold text-sm text-ink">{fmtTaka(tcoResult.monthlyDriverCost)}</span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("Maintenance & Repair", "রক্ষণাবেক্ষণ ও পার্টস")}
                    </span>
                    <span className="font-semibold text-sm text-ink">
                      {fmtTaka(tcoResult.monthlyMaintenanceRepair)}
                    </span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("BRTA / Insurance / Toll", "বিআরটিএ / টোল / পার্কিং")}
                    </span>
                    <span className="font-semibold text-sm text-ink">
                      {fmtTaka(tcoResult.monthlyBrtaFeesAndInsurance)}
                    </span>
                  </div>

                  <div className="p-3 bg-paper border border-line rounded-xs">
                    <span className="text-[11px] text-muted block mb-0.5 font-mono">
                      {t("Depreciation (Loss)", "ডিপ্রিসিয়েশন (ক্ষতি)")}
                    </span>
                    <span className="font-semibold text-sm text-muted">
                      {fmtTaka(tcoResult.monthlyDepreciationCost)}
                    </span>
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="p-4 bg-[#FAF7F0] border-l-4 border-gold text-xs leading-relaxed text-ink">
                  <p>{lang === "bn" ? tcoResult.recommendationBn : tcoResult.recommendationEn}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
