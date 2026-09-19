import { describe, expect, it } from "vitest";
import {
  calculateCarAit,
  calculateTaxAbsorption,
  calculateMultiCarComparison,
  calculateCarTco,
  VEHICLE_SLABS,
} from "./car-tax";

describe("Car AIT & Decision Engine (Income Tax Act 2023)", () => {
  it("calculates base AIT accurately for all CC tiers", () => {
    expect(
      calculateCarAit({ category: "CAR_UP_TO_1500CC", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(25_000);

    expect(
      calculateCarAit({ category: "CAR_1501_TO_2000CC", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(50_000);

    expect(
      calculateCarAit({ category: "CAR_2001_TO_2500CC", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(75_000);

    expect(
      calculateCarAit({ category: "CAR_2501_TO_3000CC", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(125_000);

    expect(
      calculateCarAit({ category: "CAR_3001_TO_3500CC", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(150_000);

    expect(
      calculateCarAit({ category: "CAR_ABOVE_3500CC", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(200_000);

    expect(
      calculateCarAit({ category: "MICROBUS", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(30_000);
  });

  it("calculates EV motor capacity tiers correctly", () => {
    expect(
      calculateCarAit({ category: "EV_UP_TO_75KW", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(20_000);

    expect(
      calculateCarAit({ category: "EV_75_TO_100KW", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(40_000);

    expect(
      calculateCarAit({ category: "EV_100_TO_125KW", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(60_000);

    expect(
      calculateCarAit({ category: "EV_125_TO_150KW", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(80_000);

    expect(
      calculateCarAit({ category: "EV_ABOVE_150KW", isSecondOrMoreCar: false }).totalAitDue
    ).toBe(100_000);
  });

  it("applies 50% extra AIT penalty on second and subsequent vehicles", () => {
    // 1500cc: 25,000 + 50% = 37,500
    const car1500Second = calculateCarAit({
      category: "CAR_UP_TO_1500CC",
      isSecondOrMoreCar: true,
    });
    expect(car1500Second.baseAit).toBe(25_000);
    expect(car1500Second.penaltySurchargeAit).toBe(12_500);
    expect(car1500Second.totalAitDue).toBe(37_500);
    expect(car1500Second.effectiveMultiple).toBe(1.5);

    // 2000cc: 50,000 + 50% = 75,000
    const car2000Second = calculateCarAit({
      category: "CAR_1501_TO_2000CC",
      isSecondOrMoreCar: true,
    });
    expect(car2000Second.baseAit).toBe(50_000);
    expect(car2000Second.penaltySurchargeAit).toBe(25_000);
    expect(car2000Second.totalAitDue).toBe(75_000);
  });

  describe("Tax Absorption & Break-Even", () => {
    it("handles 100% absorption when tax liability >= AIT", () => {
      // High earner paying ৳1,00,000 tax with ৳25,000 AIT
      const res = calculateTaxAbsorption(25_000, 100_000);
      expect(res.status).toBe("FULLY_ABSORBED");
      expect(res.absorbedAit).toBe(25_000);
      expect(res.wastedAit).toBe(0);
      expect(res.netPayableAfterAit).toBe(75_000);
      expect(res.percentageAbsorbed).toBe(100);
    });

    it("handles partial absorption when tax liability < AIT", () => {
      // Moderate taxpayer with ৳15,000 tax buying 1500cc car (৳25,000 AIT)
      const res = calculateTaxAbsorption(25_000, 15_000);
      expect(res.status).toBe("PARTIALLY_ABSORBED");
      expect(res.absorbedAit).toBe(15_000);
      expect(res.wastedAit).toBe(10_000);
      expect(res.netPayableAfterAit).toBe(0);
      expect(res.percentageAbsorbed).toBe(60);
    });

    it("identifies pure sunk cost when taxpayer owes ৳0 tax", () => {
      const res = calculateTaxAbsorption(25_000, 0);
      expect(res.status).toBe("PURE_SUNK_COST");
      expect(res.absorbedAit).toBe(0);
      expect(res.wastedAit).toBe(25_000);
      expect(res.netPayableAfterAit).toBe(0);
      expect(res.percentageAbsorbed).toBe(0);
    });
  });

  describe("Multiple Car Surcharge Comparison", () => {
    it("calculates 10% statutory surcharge floor plus 50% extra AIT", () => {
      // Taxpayer with ৳2,00,000 income tax considering a 2nd 1500cc car
      const comp = calculateMultiCarComparison("CAR_UP_TO_1500CC", 200_000);
      expect(comp.singleCarAit).toBe(25_000);
      expect(comp.secondCarAit).toBe(37_500);
      expect(comp.extraAitFromSecondCar).toBe(12_500);
      expect(comp.statutorySurchargeRate).toBe(0.10);
      expect(comp.annualSurchargeAmount).toBe(20_000); // 10% of 200,000
      expect(comp.totalAnnualPenaltyCost).toBe(32_500); // 12,500 + 20,000
      expect(comp.monthlyEquivalentPenalty).toBe(Math.round(32_500 / 12));
    });
  });

  describe("Total Cost of Ownership (TCO)", () => {
    it("computes loan EMI, fuel, driver, and safe affordability", () => {
      const tco = calculateCarTco({
        vehiclePrice: 2_500_000,
        downPayment: 1_000_000, // 15L loan
        loanTenureYears: 5,
        loanInterestRatePct: 12,
        monthlyKm: 1_000,
        fuelType: "HYBRID",
        hasDriver: true,
        driverSalaryMonthly: 20_000,
        parkingTollMonthly: 4_000,
        monthlyHouseholdIncome: 300_000,
      });

      expect(tco.monthlyLoanEmi).toBeGreaterThan(30_000);
      expect(tco.monthlyFuelCost).toBe(8_300); // 1000 * 8.3
      expect(tco.monthlyDriverCost).toBe(20_000);
      expect(tco.affordabilityStatus).toBe("STRETCHED"); // ~23-24%
    });

    it("recognizes pure cash purchase without loan EMI", () => {
      const tco = calculateCarTco({
        vehiclePrice: 2_000_000,
        downPayment: 2_000_000, // 100% cash
        loanTenureYears: 0,
        loanInterestRatePct: 0,
        monthlyKm: 800,
        fuelType: "EV",
        hasDriver: false,
        driverSalaryMonthly: 0,
        parkingTollMonthly: 2_000,
        monthlyHouseholdIncome: 200_000,
      });

      expect(tco.monthlyLoanEmi).toBe(0);
      expect(tco.monthlyFuelCost).toBe(Math.round(800 * 2.2)); // EV rate
      expect(tco.monthlyDriverCost).toBe(0);
      expect(tco.affordabilityStatus).toBe("SAFE");
    });
  });
});
