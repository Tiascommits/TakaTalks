import { describe, it, expect } from "vitest";
import {
  calculateZakat,
  GOLD_NISAB_BHORI,
  SILVER_NISAB_BHORI,
  DEFAULT_GOLD_PER_BHORI,
  DEFAULT_SILVER_PER_BHORI,
  METAL_PRICES_AS_OF,
} from "./zakat";

describe("Zakat Calculator Engine", () => {
  it("calculates accurate Nisab thresholds in Bangladeshi Taka", () => {
    const result = calculateZakat({
      nisabStandard: "silver",
      assets: {},
      liabilities: {},
    });

    expect(result.goldNisabBDT).toBe(
      Math.round(GOLD_NISAB_BHORI * DEFAULT_GOLD_PER_BHORI)
    );
    expect(result.silverNisabBDT).toBe(
      Math.round(SILVER_NISAB_BHORI * DEFAULT_SILVER_PER_BHORI)
    );
    expect(result.activeNisabBDT).toBe(result.silverNisabBDT);
    expect(result.isZakatObligatory).toBe(false);
    expect(result.zakatDueBDT).toBe(0);
  });

  it("calculates 2.5% Zakat when net wealth exceeds Silver Nisab", () => {
    const result = calculateZakat({
      nisabStandard: "silver",
      goldPricePerBhori: 138_000, // fixed price so the arithmetic below holds
      assets: {
        cashInHand: 50_000,
        bankSavingsAndCurrent: 200_000,
        sanchayapatraPrincipal: 500_000,
        goldBhori: 2, // 2 * 138,000 = 276,000
      },
      liabilities: {
        creditCardDues: 26_000,
      },
    });

    // Total assets: 50k + 200k + 500k + 276k = 1,026,000
    // Net wealth: 1,026,000 - 26,000 = 1,000,000
    // Silver Nisab ~2.2 lakh -> Obligatory
    expect(result.isZakatObligatory).toBe(true);
    expect(result.netZakatableWealth).toBe(1_000_000);
    // 2.5% of 1,000,000 = 25,000 BDT
    expect(result.zakatDueBDT).toBe(25_000);
  });

  it("evaluates Gold Nisab threshold correctly", () => {
    const result = calculateZakat({
      nisabStandard: "gold",
      assets: {
        bankSavingsAndCurrent: 500_000, // Below Gold Nisab (~17.1 lakh)
      },
      liabilities: {},
    });

    expect(result.isZakatObligatory).toBe(false);
    expect(result.zakatDueBDT).toBe(0);
  });

  it("applies 30% zakatable proxy to long term dividend shares", () => {
    const result = calculateZakat({
      nisabStandard: "silver",
      assets: {
        stocksLongTermValue: 1_000_000, // 30% = 300,000 zakatable
      },
      liabilities: {},
    });

    expect(result.investmentsTotal).toBe(300_000);
    expect(result.netZakatableWealth).toBe(300_000);
    expect(result.zakatDueBDT).toBe(7_500); // 2.5% of 300,000
  });

  it("tracks bank interest to be purified separately without counting in Zakat", () => {
    const result = calculateZakat({
      nisabStandard: "silver",
      assets: {
        bankSavingsAndCurrent: 200_000,
        bankInterestEarned: 15_000,
      },
      liabilities: {},
    });

    expect(result.interestToPurifyBDT).toBe(15_000);
    // Interest is not added to zakatable assets
    expect(result.cashTotal).toBe(200_000);
  });

  it("defaults to the dated BAJUS 22-carat prices of 13 Oct 2026 (Dhaka Tribune, bdnews24)", () => {
    expect(DEFAULT_GOLD_PER_BHORI).toBe(228_031);
    expect(DEFAULT_SILVER_PER_BHORI).toBe(4_199);
    expect(METAL_PRICES_AS_OF).toBe("2026-10-13");
    // Silver nisab: 52.5 bhori x 4,199 = 2,20,448 (rounded)
    expect(calculateZakat({ nisabStandard: "silver", assets: {}, liabilities: {} }).silverNisabBDT).toBe(220_448);
  });
});

