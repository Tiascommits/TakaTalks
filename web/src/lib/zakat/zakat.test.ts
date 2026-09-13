import { describe, it, expect } from "vitest";
import {
  calculateZakat,
  GOLD_NISAB_BHORI,
  SILVER_NISAB_BHORI,
  DEFAULT_GOLD_PER_BHORI,
  DEFAULT_SILVER_PER_BHORI,
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
    // Silver Nisab ~110,250 -> Obligatory
    expect(result.isZakatObligatory).toBe(true);
    expect(result.netZakatableWealth).toBe(1_000_000);
    // 2.5% of 1,000,000 = 25,000 BDT
    expect(result.zakatDueBDT).toBe(25_000);
  });

  it("evaluates Gold Nisab threshold correctly", () => {
    const result = calculateZakat({
      nisabStandard: "gold",
      assets: {
        bankSavingsAndCurrent: 500_000, // Below Gold Nisab (~10.35 Lakhs)
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
});
