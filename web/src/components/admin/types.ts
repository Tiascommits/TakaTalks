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
  lastLog: { success: boolean; attemptedAt: string } | null;
  lastSnapshotAt: string | null;
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
