import { PDFParse } from "pdf-parse";
import type { AnnualReportField } from "@prisma/client";

export type ExtractedFigureCandidate = {
  field: AnnualReportField;
  rawValue: string;
  numericValue: number | null;
  extractionConfidence: number;
  sourcePageOrNote: string | null;
};

type FieldPattern = {
  field: AnnualReportField;
  // Matches "label ... number %" with the number in the first capture group.
  // Tried in order; the first match found in the document wins.
  patterns: { re: RegExp; confidence: number }[];
};

const PERCENT_FIELD_PATTERNS: FieldPattern[] = [
  {
    field: "CAR",
    patterns: [
      { re: /\b(?:CRAR|CAR)\b[^%\n]{0,30}?(\d{1,2}(?:\.\d+)?)\s*%/i, confidence: 0.85 },
      {
        re: /capital\s+to\s+risk[- ]weighted\s+assets?\s+ratio[^%\n]{0,60}?(\d{1,2}(?:\.\d+)?)\s*%/i,
        confidence: 0.7,
      },
    ],
  },
  {
    field: "NPL",
    patterns: [
      { re: /\bNPL\b[^%\n]{0,30}?(\d{1,2}(?:\.\d+)?)\s*%/i, confidence: 0.85 },
      {
        re: /non[- ]performing\s+loans?\s+ratio[^%\n]{0,60}?(\d{1,2}(?:\.\d+)?)\s*%/i,
        confidence: 0.7,
      },
    ],
  },
  {
    field: "ROA",
    patterns: [
      {
        re: /return\s+on\s+assets?\s*\(?ROA\)?[^%\n]{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i,
        confidence: 0.75,
      },
      { re: /\bROA\b[^%\n]{0,20}?(\d{1,2}(?:\.\d+)?)\s*%/i, confidence: 0.6 },
    ],
  },
  {
    field: "ROE",
    patterns: [
      {
        re: /return\s+on\s+equity\s*\(?ROE\)?[^%\n]{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i,
        confidence: 0.75,
      },
      { re: /\bROE\b[^%\n]{0,20}?(\d{1,2}(?:\.\d+)?)\s*%/i, confidence: 0.6 },
    ],
  },
];

const MONEY_FIELD_PATTERNS: FieldPattern[] = [
  {
    field: "TOTAL_DEPOSITS",
    patterns: [
      {
        re: /total\s+deposits?[^\n\d]{0,20}?([\d][\d,]*(?:\.\d+)?)/i,
        confidence: 0.5,
      },
    ],
  },
  {
    field: "TOTAL_LOANS",
    patterns: [
      {
        re: /total\s+loans?\s+(?:and|&)\s+advances?[^\n\d]{0,20}?([\d][\d,]*(?:\.\d+)?)/i,
        confidence: 0.5,
      },
    ],
  },
  {
    field: "NET_PROFIT",
    patterns: [
      {
        re: /net\s+profit(?:\s+after\s+tax)?[^\n\d]{0,20}?([\d][\d,]*(?:\.\d+)?)/i,
        confidence: 0.45,
      },
    ],
  },
];

const AUDITOR_NAME_RE = /((?:[A-Z][A-Za-z.&' -]+)\s+Chartered Accountants)/;
const AUDIT_DATE_RE =
  /(?:Dated|Date)\s*:?\s*((?:\d{1,2}\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i;
const FISCAL_YEAR_RE = /(?:for the year ended|annual report)[^\d]{0,20}(20\d{2})/i;

/**
 * Regex/section-anchor extraction — a first pass, never fully reliable
 * across bank report layouts (see prompts/03-annual-report-extraction.md).
 * Every candidate carries a confidence score and gets stored unapproved;
 * nothing here reaches the public scorecard without a human checking it
 * against the source PDF page (see /admin/bank-health).
 */
export async function extractFiguresFromPdf(
  pdfBuffer: Buffer
): Promise<{ fiscalYear: number; candidates: ExtractedFigureCandidate[] }> {
  const parser = new PDFParse({ data: pdfBuffer });
  let text: string;
  try {
    const result = await parser.getText();
    text = result.text;
  } finally {
    await parser.destroy();
  }

  const candidates: ExtractedFigureCandidate[] = [];

  for (const { field, patterns } of PERCENT_FIELD_PATTERNS) {
    const found = firstMatch(text, patterns);
    if (found) {
      candidates.push({
        field,
        rawValue: found.raw,
        numericValue: parseFloat(found.value),
        extractionConfidence: found.confidence,
        sourcePageOrNote: null,
      });
    }
  }

  for (const { field, patterns } of MONEY_FIELD_PATTERNS) {
    const found = firstMatch(text, patterns);
    if (found) {
      candidates.push({
        field,
        rawValue: found.raw,
        numericValue: parseFloat(found.value.replace(/,/g, "")),
        extractionConfidence: found.confidence,
        sourcePageOrNote: null,
      });
    }
  }

  const auditorMatch = text.match(AUDITOR_NAME_RE);
  if (auditorMatch) {
    candidates.push({
      field: "AUDITOR_NAME",
      rawValue: auditorMatch[1].trim(),
      numericValue: null,
      extractionConfidence: 0.5,
      sourcePageOrNote: null,
    });
  }

  const auditDateMatch = text.match(AUDIT_DATE_RE);
  if (auditDateMatch) {
    candidates.push({
      field: "AUDIT_REPORT_DATE",
      rawValue: auditDateMatch[1].trim(),
      numericValue: null,
      extractionConfidence: 0.4,
      sourcePageOrNote: null,
    });
  }

  const fiscalYearMatch = text.match(FISCAL_YEAR_RE);
  const fiscalYear = fiscalYearMatch ? parseInt(fiscalYearMatch[1], 10) : new Date().getFullYear() - 1;

  return { fiscalYear, candidates };
}

function firstMatch(
  text: string,
  patterns: { re: RegExp; confidence: number }[]
): { raw: string; value: string; confidence: number } | null {
  for (const { re, confidence } of patterns) {
    const m = text.match(re);
    if (m) return { raw: m[0].replace(/\s+/g, " ").trim(), value: m[1], confidence };
  }
  return null;
}
