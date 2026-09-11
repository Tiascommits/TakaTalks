export type BankTypeCode = "STATE_OWNED" | "PRIVATE" | "FOREIGN" | "ISLAMIC";
export type RateSourceMethodCode = "MANUAL" | "SCRAPED";

// Dates arrive as ISO strings once the server component JSON-serializes
// Prisma's Date objects for the client component.
export type CurrentRateRowDTO = {
  bankShortCode: string;
  bankName: string;
  bankType: BankTypeCode;
  creditRating: string | null;
  ratingAgency: string | null;
  ratingDate: string | null;
  statementUrl: string | null;
  termMonths: number;
  ratePct: number | null;
  method: RateSourceMethodCode | null;
  source: string | null;
  lastVerifiedAt: string | null;
  unverified: boolean;
};

export type BBAggregateRateDTO = {
  id: string;
  label: string;
  ratePct: number;
  periodLabel: string;
  source: string;
  enteredAt: string;
};
