/**
 * Zakat Calculator Engine for Bangladesh.
 *
 * Implements classical Islamic jurisprudence (Hanafi & contemporary scholarly consensus)
 * adapted to Bangladesh financial instruments (Sanchayapatra, DSE stocks, FDR, Bhori/Tola gold).
 *
 * Standards:
 * - 1 Tola / Bhori = 11.664 grams (BAJUS standard).
 * - Gold Nisab: 7.5 Tola (87.48 grams).
 * - Silver Nisab: 52.5 Tola (612.36 grams).
 * - Zakat Rate: 2.5% on net zakatable wealth held for a lunar year (Hawl).
 */

export const BHORI_TO_GRAMS = 11.664;
export const GOLD_NISAB_BHORI = 7.5;
export const SILVER_NISAB_BHORI = 52.5;

// Approximate market rates in Bangladesh (BAJUS 2024-2025 benchmarks)
export const DEFAULT_GOLD_PER_BHORI = 138_000;
export const DEFAULT_SILVER_PER_BHORI = 2_100;

export type NisabStandard = "silver" | "gold";

export interface ZakatAssetsInput {
  // Cash & Bank
  cashInHand: number;
  bankSavingsAndCurrent: number;
  bankFDRPrincipal: number;
  bankInterestEarned: number; // Riba to be purified (given to charity without expectation of reward)

  // Precious Metals
  goldBhori: number;
  goldCustomRatePerBhori?: number;
  silverBhori: number;
  silverCustomRatePerBhori?: number;

  // Investments & Business
  sanchayapatraPrincipal: number;
  stocksTradingValue: number; // 100% of market value for short-term trading
  stocksLongTermValue: number; // 30% zakatable proxy for dividend/long term holdings
  businessInventoryWholesale: number; // Goods for sale at wholesale value
  providentFundAccessible: number; // Only voluntarily contributed or currently accessible amount

  // Receivables
  loansGivenCollectable: number;
  flatsOrLandForResale: number; // Only properties purchased for the intention of resale (Tijarah)
}

export interface ZakatLiabilitiesInput {
  immediateDebtsDue: number; // Overdue bills, personal loans due now
  creditCardDues: number; // Current statement balance
  upcomingMonthEMIs: number; // 1 to 12 months allowable debt obligations
  businessPayablesDue: number; // Supplier dues, unpaid wages
}

export interface ZakatCalculationInput {
  nisabStandard: NisabStandard;
  goldPricePerBhori?: number;
  silverPricePerBhori?: number;
  assets: Partial<ZakatAssetsInput>;
  liabilities: Partial<ZakatLiabilitiesInput>;
}

export interface ZakatCalculationResult {
  nisabStandard: NisabStandard;
  goldPricePerBhori: number;
  silverPricePerBhori: number;
  goldNisabBDT: number;
  silverNisabBDT: number;
  activeNisabBDT: number;

  // Breakdown
  cashTotal: number;
  preciousMetalsTotal: number;
  investmentsTotal: number;
  receivablesTotal: number;
  totalGrossAssets: number;
  totalZakatableAssets: number;

  // Liabilities
  totalLiabilities: number;

  // Net & Final Zakat
  netZakatableWealth: number;
  isZakatObligatory: boolean;
  zakatDueBDT: number;

  // Purification (Interest / Riba)
  interestToPurifyBDT: number;
}

export function calculateZakat(input: ZakatCalculationInput): ZakatCalculationResult {
  const goldPrice = input.goldPricePerBhori ?? DEFAULT_GOLD_PER_BHORI;
  const silverPrice = input.silverPricePerBhori ?? DEFAULT_SILVER_PER_BHORI;

  const goldNisabBDT = Math.round(GOLD_NISAB_BHORI * goldPrice);
  const silverNisabBDT = Math.round(SILVER_NISAB_BHORI * silverPrice);

  const activeNisabBDT = input.nisabStandard === "gold" ? goldNisabBDT : silverNisabBDT;

  const a = input.assets;
  const l = input.liabilities;

  // Cash & Bank
  const cashInHand = Math.max(0, a.cashInHand || 0);
  const bankSavings = Math.max(0, a.bankSavingsAndCurrent || 0);
  const fdrPrincipal = Math.max(0, a.bankFDRPrincipal || 0);
  const cashTotal = cashInHand + bankSavings + fdrPrincipal;

  // Precious Metals
  const goldBhori = Math.max(0, a.goldBhori || 0);
  const goldRate = a.goldCustomRatePerBhori ?? goldPrice;
  const goldValue = goldBhori * goldRate;

  const silverBhori = Math.max(0, a.silverBhori || 0);
  const silverRate = a.silverCustomRatePerBhori ?? silverPrice;
  const silverValue = silverBhori * silverRate;

  const preciousMetalsTotal = Math.round(goldValue + silverValue);

  // Investments & Business
  const sanchayapatra = Math.max(0, a.sanchayapatraPrincipal || 0);
  const stocksTrading = Math.max(0, a.stocksTradingValue || 0);
  const stocksLongTerm = Math.max(0, a.stocksLongTermValue || 0);
  const stocksLongTermZakatable = stocksLongTerm * 0.3; // 30% proxy for underlying liquid/current assets
  const inventory = Math.max(0, a.businessInventoryWholesale || 0);
  const pf = Math.max(0, a.providentFundAccessible || 0);

  const investmentsTotal = Math.round(
    sanchayapatra + stocksTrading + stocksLongTermZakatable + inventory + pf
  );

  // Receivables & Resale Land
  const loansCollectable = Math.max(0, a.loansGivenCollectable || 0);
  const landForResale = Math.max(0, a.flatsOrLandForResale || 0);
  const receivablesTotal = loansCollectable + landForResale;

  const totalZakatableAssets =
    cashTotal + preciousMetalsTotal + investmentsTotal + receivablesTotal;
  const totalGrossAssets =
    totalZakatableAssets + Math.max(0, stocksLongTerm * 0.7); // gross wealth including exempt asset portions

  // Liabilities
  const immediateDebts = Math.max(0, l.immediateDebtsDue || 0);
  const creditCards = Math.max(0, l.creditCardDues || 0);
  const emiDues = Math.max(0, l.upcomingMonthEMIs || 0);
  const businessPayables = Math.max(0, l.businessPayablesDue || 0);
  const totalLiabilities = immediateDebts + creditCards + emiDues + businessPayables;

  // Net Wealth & Obligation
  const netZakatableWealth = Math.max(0, totalZakatableAssets - totalLiabilities);
  const isZakatObligatory = netZakatableWealth >= activeNisabBDT;
  const zakatDueBDT = isZakatObligatory ? Math.round(netZakatableWealth * 0.025) : 0;

  const interestToPurifyBDT = Math.max(0, a.bankInterestEarned || 0);

  return {
    nisabStandard: input.nisabStandard,
    goldPricePerBhori: goldPrice,
    silverPricePerBhori: silverPrice,
    goldNisabBDT,
    silverNisabBDT,
    activeNisabBDT,

    cashTotal,
    preciousMetalsTotal,
    investmentsTotal,
    receivablesTotal,
    totalGrossAssets: Math.round(totalGrossAssets),
    totalZakatableAssets: Math.round(totalZakatableAssets),

    totalLiabilities: Math.round(totalLiabilities),

    netZakatableWealth: Math.round(netZakatableWealth),
    isZakatObligatory,
    zakatDueBDT,

    interestToPurifyBDT,
  };
}
