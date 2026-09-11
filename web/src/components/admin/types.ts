export type AdminBankDTO = {
  id: string;
  shortCode: string;
  name: string;
  type: string;
  active: boolean;
  hasAdapter: boolean;
  creditRating: string | null;
  ratingAgency: string | null;
  ratingDate: string | null;
  statementUrl: string | null;
  websiteUrl: string | null;
  rateCardUrl: string | null;
  annualReportPageUrl: string | null;
  dseCompanyUrl: string | null;
  lastLog: { success: boolean; attemptedAt: string } | null;
  lastSnapshotAt: string | null;
};

export type AdminExtractedFigureDTO = {
  id: string;
  bankId: string;
  bankName: string;
  fiscalYear: number;
  field: string;
  rawValue: string;
  numericValue: number | null;
  extractionConfidence: number;
  sourceReportUrl: string;
  sourcePageOrNote: string | null;
  extractedAt: string;
};

export type AdminDigestDTO = {
  failedAdapters: { shortCode: string; name: string; errorMessage: string | null; attemptedAt: string }[];
  unconfiguredBanks: { shortCode: string; name: string }[];
  changedRates: {
    shortCode: string;
    name: string;
    instrument: string;
    termMonths: number;
    previousPct: number;
    currentPct: number;
    deltaPct: number;
  }[];
};

export type AdminBBAggregateDTO = {
  id: string;
  label: string;
  ratePct: number;
  periodLabel: string;
  source: string;
  enteredAt: string;
};
