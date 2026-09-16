import { describe, expect, it } from "vitest";
import { pickAnnualReportLink, type PdfLink } from "./fetch-reports";

/**
 * Every fixture below is a real set of PDF links taken from the bank page
 * recorded as that bank's annualReportPageUrl in src/config/banks.ts,
 * captured while verifying those URLs live on 2026-09-16. They exist
 * because the previous "first PDF, or any href containing 'annual'"
 * heuristic picked the wrong document on 5 of the 9 verified pages.
 */
const link = (text: string, href: string): PdfLink => ({ text, href });

describe("pickAnnualReportLink", () => {
  it("prefers the annual report over a similarly-named credit rating (AB Bank)", () => {
    // abbl.com/investor-relations/ links 167 PDFs; the old heuristic matched
    // "annual" in this 2014 rating letter's filename and stopped there.
    const best = pickAnnualReportLink([
      link("Credit Rating", "https://abbl.com/download/edits/2014-annual-report-credit-rating.pdf"),
      link("Annual Report 2025", "https://abbl.com/wp-content/uploads/2026/05/Annual-Report-2025.pdf"),
    ]);
    expect(best?.href).toContain("Annual-Report-2025.pdf");
  });

  it("matches on the href when the anchor has no text at all (BRAC Bank)", () => {
    // BRAC's S3-hosted report is linked from an image with empty link text,
    // and the filename says "AR_2025" rather than "annual report".
    const best = pickAnnualReportLink([
      link("", "https://brackweb.s3.amazonaws.com/uploads/all/BRAC_Bank_AR_2025_Final_Version.pdf"),
      link("Forex Rates", "https://brackweb.s3.amazonaws.com/uploads/all/Daily_Exchange_Rate_as_on_16_Sep_2026.pdf"),
    ]);
    expect(best?.href).toContain("BRAC_Bank_AR_2025");
  });

  it("ignores an upload timestamp that parses as a future year (Islami Bank)", () => {
    // Filenames are prefixed with a unix-style timestamp: "1761203020_"
    // contains "2030", which beat the newer report on a naive year sort.
    const best = pickAnnualReportLink([
      link("Annual Report 2024", "https://www.islamibankbd.com/assets/1761203020_Annual_Report_2024.pdf"),
      link("Annual Report 2025", "https://www.islamibankbd.com/assets/1780917670_Annual_Report_2025.pdf"),
    ]);
    expect(best?.href).toContain("Annual_Report_2025.pdf");
  });

  it("picks the newest year among several annual reports (EBL)", () => {
    const best = pickAnnualReportLink([
      link("Annual Report 2023", "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2023.pdf"),
      link("Annual Report 2025", "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2025.pdf"),
      link("Annual Report 2024", "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2024.pdf"),
    ]);
    expect(best?.href).toContain("2025");
  });

  it("does not mistake a standalone directors' report for the annual report (EBL)", () => {
    const best = pickAnnualReportLink([
      link("Directors' Report 2025", "https://www.ebl.com.bd/assets/reports/highlights/Directors_Report_2025.pdf"),
      link("Annual Report 2025", "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2025.pdf"),
    ]);
    expect(best?.href).toContain("EBL-ANNUAL-REPORT-2025.pdf");
  });

  it("accepts 'Financial Statements' when no annual report is published (Standard Chartered)", () => {
    // SCB Bangladesh is a branch operation, not a listed company, so it
    // files financial statements and never an "annual report".
    const best = pickAnnualReportLink([
      link("Financial Statements 2024", "https://av.sc.com/bd/content/docs/bd-financial-statements-twenty-four.pdf"),
      link("Financial Statements 2025", "https://av.sc.com/bd/content/docs/bd-financial-statements-twenty-five.pdf"),
    ]);
    expect(best?.href).toContain("twenty-five.pdf");
  });

  it("rejects a page of Basel III disclosures rather than extracting from one", () => {
    // sc.com/bd/financial-statements/ turned out to link only these, which
    // is why SCB's recorded URL is /bd/important-information/ instead.
    const best = pickAnnualReportLink([
      link("2025 – Disclosures on Risk Based Capital (Basel III)", "https://av.sc.com/bd/content/docs/bd-basel-iii-twenty-five.pdf"),
      link("2024 - Disclosures on Risk Based Capital (Basel III)", "https://av.sc.com/bd/content/docs/bd-basel-III-twenty-four.pdf"),
    ]);
    expect(best).toBeNull();
  });

  it("returns null instead of falling back to an unrelated first PDF", () => {
    const best = pickAnnualReportLink([
      link("Reward Point Redemption", "https://av.sc.com/bd/content/docs/bd-reward-point-redemption.pdf"),
      link("Schedule of Charges", "https://example.com/schedule-of-charges.pdf"),
    ]);
    expect(best).toBeNull();
  });

  it("returns null for a page with no PDF links", () => {
    expect(pickAnnualReportLink([])).toBeNull();
  });
});
