import type { BankType } from "@prisma/client";

/**
 * The scraper-list scope for Module 3/4 (see prompts/02-rate-monitoring-and-scorecard.md).
 * Every bank here needs manual verification of its rate-card page before a
 * real adapter is written for it — until then it either runs on the
 * manual-seed adapter (see src/lib/rates/seed-rates.ts) or has no adapter
 * registered at all and shows "not available" on the scorecard.
 *
 * `websiteUrl` / `rateCardUrl` are left null for all of these: none has
 * been verified against a live bank site yet, so nothing is guessed here.
 *
 * `annualReportPageUrl` / `dseCompanyUrl` feed Module 5 (bank-health
 * disclosure). Both were verified live on 2026-09-16, never derived from a
 * URL pattern, per prompts/03:
 *   - each annualReportPageUrl was fetched and confirmed to serve the
 *     bank's own annual report as a PDF link in its server-rendered HTML,
 *     which is what src/lib/bank-health/fetch-reports.ts needs;
 *   - each dseCompanyUrl was checked against DSE's own listed-company
 *     index and its "Company Name:" field confirmed to be that bank.
 * Anything that could not be verified is null, which Module 5 reports as
 * "not disclosed" rather than guessing.
 */
export type BankConfig = {
  shortCode: string;
  name: string;
  type: BankType;
  annualReportPageUrl?: string;
  dseCompanyUrl?: string;
};

export const BANKS: BankConfig[] = [
  {
    shortCode: "AB",
    name: "AB Bank PLC",
    type: "PRIVATE",
    annualReportPageUrl: "https://abbl.com/investor-relations/",
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=ABBANK",
  },
  {
    shortCode: "MIDLAND",
    name: "Midland Bank PLC",
    type: "PRIVATE",
    annualReportPageUrl: "https://www.midlandbankbd.net/annual-report",
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=MIDLANDBNK",
  },
  {
    shortCode: "ONE",
    name: "One Bank PLC",
    type: "PRIVATE",
    annualReportPageUrl: "https://www.onebank.com.bd/home/financial/annual-reports",
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=ONEBANKPLC",
  },
  {
    shortCode: "NATIONAL",
    name: "National Bank PLC",
    type: "PRIVATE",
    // Page is correct and serves annual reports 2015-2024, but nblbd.com
    // presents an incomplete TLS chain (no intermediate), so Node's fetch
    // rejects it with UNABLE_TO_VERIFY_LEAF_SIGNATURE where browsers and
    // curl succeed. Left set deliberately: the monthly check logs a
    // fetch_error for this bank, which is visible in /admin/bank-health,
    // rather than silently looking like "no source configured".
    annualReportPageUrl: "https://www.nblbd.com/investors-relations/annual-report",
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=NBL",
  },
  {
    shortCode: "CITY",
    name: "The City Bank PLC",
    type: "PRIVATE",
    // citybankplc.com is a client-rendered Next.js app: /reports and
    // /p/investor-relation serve no PDF links (and no report data at all)
    // in their server HTML, so there is no page the current fetch-based
    // pipeline can use. Needs either a headless-browser fetch or the
    // bank's direct report URLs supplied by hand.
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=CITYBANK",
  },
  {
    shortCode: "IFIC",
    name: "IFIC Bank PLC",
    type: "PRIVATE",
    annualReportPageUrl: "https://ificbank.com.bd/annual-report",
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=IFIC",
  },
  {
    shortCode: "SONALI",
    name: "Sonali Bank PLC",
    type: "STATE_OWNED",
    // No annual-report listing page exists on sonalibank.com.bd: the
    // reports are only reachable as direct PDFs under /PDF_file/ (whose
    // directory index is disabled), and the home page links just the
    // current audited financial statement among unrelated PDFs. Wholly
    // state-owned, so not listed on the DSE either.
  },
  {
    shortCode: "EBL",
    name: "Eastern Bank PLC",
    type: "PRIVATE",
    annualReportPageUrl: "https://www.ebl.com.bd/annual-reports",
    dseCompanyUrl: "https://www.dsebd.org/displayCompany.php?name=EBL",
  },
  {
    shortCode: "SCB",
    name: "Standard Chartered Bank",
    type: "FOREIGN",
    // A branch operation rather than a locally-listed company: it files
    // "Financial Statements <year>" and publishes no annual report, and is
    // not on the DSE. /bd/financial-statements/ is misleadingly named —
    // it carries only Basel III disclosures; the statements themselves are
    // linked from /bd/important-information/.
    annualReportPageUrl: "https://www.sc.com/bd/important-information/",
  },
];
