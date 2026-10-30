import { describe, expect, it, vi } from "vitest";
import {
  classifyReportLinks,
  pickAnnualReportLink,
  pickDueBanks,
  pickFromClassified,
  type PdfLink,
  type ReportDocType,
} from "./fetch-reports";
import type { JevClient } from "@/lib/jev/client";

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

/** A Jev stand-in that answers each `linkN` question with the given label. */
function stubJev(labels: ReportDocType[], confidence = 0.9): JevClient {
  const answers = Object.fromEntries(labels.map((choice, i) => [`link${i}`, { type: "choice", choice, confidence, probabilities: {} }]));
  return { systemOne: vi.fn(async () => ({ answers })) } as unknown as JevClient;
}

describe("classifyReportLinks (Jev Task 1.1)", () => {
  const links = [
    link("Credit Rating", "https://abbl.com/download/edits/2014-annual-report-credit-rating.pdf"),
    link("Annual Report 2025", "https://abbl.com/wp-content/uploads/2026/05/Annual-Report-2025.pdf"),
  ];

  it("is off without a client, so the heuristic stays in charge", async () => {
    expect(await classifyReportLinks(links, null)).toBeNull();
  });

  it("falls back (null) when the API call fails", async () => {
    const failing = { systemOne: vi.fn(async () => Promise.reject(new Error("503"))) } as unknown as JevClient;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await classifyReportLinks(links, failing)).toBeNull();
  });

  it("labels every link in one call, heuristic's best first", async () => {
    const client = stubJev(["audited_annual_report", "credit_rating_report"]);
    const classified = await classifyReportLinks(links, client);
    expect(client.systemOne).toHaveBeenCalledTimes(1);
    expect(classified?.map((c) => [c.link.text, c.docType])).toEqual([
      ["Annual Report 2025", "audited_annual_report"],
      ["Credit Rating", "credit_rating_report"],
    ]);
  });

  it("picks the newest confident audited report, and nothing below the confidence floor", () => {
    const c = (text: string, docType: ReportDocType, confidence = 0.9) => ({ link: link(text, `https://x.bd/${text}.pdf`), docType, confidence });
    expect(pickFromClassified([c("AR 2024", "audited_annual_report"), c("AR 2025", "audited_annual_report"), c("Q3 2026", "quarterly_financials")])?.text).toBe("AR 2025");
    expect(pickFromClassified([c("AR 2025", "audited_annual_report", 0.3)])).toBeNull();
  });
});

describe("pickDueBanks", () => {
  const now = new Date("2026-10-15T04:00:00Z");
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

  it("takes never-checked banks first, then the longest unchecked, and skips recent ones", () => {
    const banks = [
      { id: "recent", lastCheckedAt: daysAgo(3) },
      { id: "old", lastCheckedAt: daysAgo(40) },
      { id: "never", lastCheckedAt: null },
      { id: "older", lastCheckedAt: daysAgo(90) },
    ];
    expect(pickDueBanks(banks, now, 5).map((b) => b.id)).toEqual(["never", "older", "old"]);
    expect(pickDueBanks(banks, now, 1).map((b) => b.id)).toEqual(["never"]);
  });

  it("checks all 7 report pages within a week of daily one-bank runs, then leaves them for a month", () => {
    const banks = Array.from({ length: 7 }, (_, i) => ({ id: `bank${i}`, lastCheckedAt: null as Date | null }));
    for (let day = 0; day < 7; day++) {
      const today = new Date(now.getTime() + day * 86_400_000);
      for (const b of pickDueBanks(banks, today, 1)) b.lastCheckedAt = today;
    }
    expect(banks.every((b) => b.lastCheckedAt !== null)).toBe(true);
    expect(pickDueBanks(banks, new Date(now.getTime() + 20 * 86_400_000), 1)).toEqual([]);
  });
});

/**
 * Jev Task 1.3: shadow-mode comparison. The same real bank-page links as the
 * pickAnnualReportLink tests above, each with the label a correct classifier
 * gives it. Offline, those labels stand in for Jev; with TYPESAFE_API_KEY set,
 * the live block asks the real API and prints where it and the heuristic differ.
 */
const SHADOW_FIXTURES: { bank: string; links: [string, string, ReportDocType][]; expected: string | null }[] = [
  {
    bank: "AB Bank",
    links: [
      ["Credit Rating", "https://abbl.com/download/edits/2014-annual-report-credit-rating.pdf", "credit_rating_report"],
      ["Annual Report 2025", "https://abbl.com/wp-content/uploads/2026/05/Annual-Report-2025.pdf", "audited_annual_report"],
    ],
    expected: "https://abbl.com/wp-content/uploads/2026/05/Annual-Report-2025.pdf",
  },
  {
    bank: "BRAC Bank",
    links: [
      ["", "https://brackweb.s3.amazonaws.com/uploads/all/BRAC_Bank_AR_2025_Final_Version.pdf", "audited_annual_report"],
      ["Forex Rates", "https://brackweb.s3.amazonaws.com/uploads/all/Daily_Exchange_Rate_as_on_16_Sep_2026.pdf", "marketing_leaflets"],
    ],
    expected: "https://brackweb.s3.amazonaws.com/uploads/all/BRAC_Bank_AR_2025_Final_Version.pdf",
  },
  {
    bank: "Islami Bank",
    links: [
      ["Annual Report 2024", "https://www.islamibankbd.com/assets/1761203020_Annual_Report_2024.pdf", "audited_annual_report"],
      ["Annual Report 2025", "https://www.islamibankbd.com/assets/1780917670_Annual_Report_2025.pdf", "audited_annual_report"],
    ],
    expected: "https://www.islamibankbd.com/assets/1780917670_Annual_Report_2025.pdf",
  },
  {
    bank: "EBL",
    links: [
      ["Directors' Report 2025", "https://www.ebl.com.bd/assets/reports/highlights/Directors_Report_2025.pdf", "directors_report_only"],
      ["Annual Report 2024", "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2024.pdf", "audited_annual_report"],
      ["Annual Report 2025", "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2025.pdf", "audited_annual_report"],
    ],
    expected: "https://www.ebl.com.bd/assets/reports/annual/EBL-ANNUAL-REPORT-2025.pdf",
  },
  {
    bank: "Standard Chartered (financial statements)",
    links: [
      ["Financial Statements 2024", "https://av.sc.com/bd/content/docs/bd-financial-statements-twenty-four.pdf", "audited_annual_report"],
      ["Financial Statements 2025", "https://av.sc.com/bd/content/docs/bd-financial-statements-twenty-five.pdf", "audited_annual_report"],
    ],
    expected: "https://av.sc.com/bd/content/docs/bd-financial-statements-twenty-five.pdf",
  },
  {
    bank: "Standard Chartered (Basel III page)",
    links: [
      ["2025 – Disclosures on Risk Based Capital (Basel III)", "https://av.sc.com/bd/content/docs/bd-basel-iii-twenty-five.pdf", "basel_iii_disclosure"],
      ["2024 - Disclosures on Risk Based Capital (Basel III)", "https://av.sc.com/bd/content/docs/bd-basel-III-twenty-four.pdf", "basel_iii_disclosure"],
    ],
    expected: null,
  },
  {
    bank: "Standard Chartered (leaflets)",
    links: [
      ["Reward Point Redemption", "https://av.sc.com/bd/content/docs/bd-reward-point-redemption.pdf", "marketing_leaflets"],
      ["Schedule of Charges", "https://example.com/schedule-of-charges.pdf", "marketing_leaflets"],
    ],
    expected: null,
  },
];

describe("Jev shadow mode vs the heuristic (Jev Task 1.3)", () => {
  it.each(SHADOW_FIXTURES)("$bank: Jev with correct labels and the heuristic pick the same document", async ({ links, expected }) => {
    const pdfLinks = links.map(([text, href]) => link(text, href));
    const labels = new Map(links.map(([, href, label]) => [href, label]));
    // The stub answers in the order classifyReportLinks asks, which is the heuristic's ranking.
    const client: JevClient = {
      systemOne: vi.fn(async ({ questions }: { questions: Record<string, { instructions: { link: PdfLink } }> }) => ({
        answers: Object.fromEntries(
          Object.entries(questions).map(([k, q]) => [k, { type: "choice", choice: labels.get(q.instructions.link.href), confidence: 0.9 }])
        ),
      })),
    } as unknown as JevClient;
    const classified = await classifyReportLinks(pdfLinks, client);
    expect(pickAnnualReportLink(pdfLinks)?.href ?? null).toBe(expected);
    expect(pickFromClassified(classified!)?.href ?? null).toBe(expected);
  });

  describe.skipIf(!process.env.TYPESAFE_API_KEY)("live API (runs only with TYPESAFE_API_KEY)", () => {
    it("reports agreement with the heuristic on every fixture", { timeout: 60_000 }, async () => {
      const rows = [];
      for (const { bank, links, expected } of SHADOW_FIXTURES) {
        const pdfLinks = links.map(([text, href]) => link(text, href));
        const classified = await classifyReportLinks(pdfLinks);
        const jev = classified ? (pickFromClassified(classified)?.href ?? null) : "unavailable";
        rows.push({ bank, heuristic: pickAnnualReportLink(pdfLinks)?.href ?? null, jev, expected });
      }
      console.table(rows);
      expect(rows.filter((r) => r.jev !== r.expected)).toEqual([]);
    });
  });
});
