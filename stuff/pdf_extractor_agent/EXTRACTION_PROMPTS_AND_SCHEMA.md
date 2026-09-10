# PDF Extractor: Extraction Prompts & JSON Schema

This document defines the prompt templates, chunk selection strategies, and output JSON schemas used by the **Bank Annual Report Extraction Agent**.

---

## 1. Chunk Selection Strategy

Annual reports are typically 250–500 pages long. Feeding the entire PDF into a prompt is wasteful and prone to hallucination. The agent uses targeted regex heuristics to extract relevant page clusters:

1. **Capital Adequacy / Basel III Section**:
   - Matches: `/(?:Risk[- ]Weighted Assets|Basel III|Capital Adequacy|CRAR|Pillar 3)/i`
   - Window: Extract matching page and the subsequent 2 pages.
2. **Loans, Advances & NPL Schedule (Note 7 / Note 8)**:
   - Matches: `/(?:Classification of Loans and Advances|Non-Performing Loans|Sub-standard|Doubtful|Bad\/Loss)/i`
   - Window: Extract matching page and subsequent 3 pages.
3. **Auditor's Report & Statement of Financial Position**:
   - Matches: `/(?:Independent Auditor's Report|Opinion|Basis for Opinion)/i`
   - Window: Extract first 3 pages of auditor report.

---

## 2. LLM Extraction Prompt Specification

```markdown
SYSTEM PROMPT:
You are an expert financial auditor specializing in Bangladesh Banking Sector disclosures, Basel III guidelines from Bangladesh Bank, and International Financial Reporting Standards (IFRS).

Your job is to read the attached excerpt from a commercial bank's annual report and extract precise, audited figures into a structured JSON object.

RULES:
1. ONLY extract numbers that are explicitly stated in the text or tables. DO NOT infer, calculate, or guess missing figures.
2. Distinguish clearly between "Consolidated" (group) and "Solo" (bank only) numbers. Prefer Solo unless only Consolidated is reported.
3. If a value is reported in BDT Millions or BDT Crores, normalize it to BDT Crores (1 Crore = 10,000,000 BDT) and specify the unit.
4. Record the exact Page Number where each number was found.
5. If a metric is not disclosed or cannot be found, output null.
6. Check for Auditor Qualifications or Emphasis of Matter (e.g. regarding unprovided bad loans or court stay orders).

INPUT DOCUMENT:
Bank Name: {bank_name}
Fiscal Year: {fiscal_year}
Extracted Text / Tables:
{pdf_text_chunks}
```

---

## 3. Strict JSON Schema Output

The extraction model must return an object validating against the following JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "bankCode",
    "fiscalYear",
    "crarPercentage",
    "grossNplPercentage",
    "auditorName",
    "confidenceScore"
  ],
  "properties": {
    "bankCode": { "type": "string", "example": "BRAC" },
    "fiscalYear": { "type": "integer", "example": 2025 },
    "reportingBasis": { "type": "string", "enum": ["Solo", "Consolidated"] },
    "crarPercentage": {
      "type": ["number", "null"],
      "description": "Total Capital to Risk-Weighted Assets Ratio in %",
      "example": 14.82
    },
    "tier1CapitalPercentage": {
      "type": ["number", "null"],
      "description": "Tier 1 Core Capital Ratio in %",
      "example": 11.20
    },
    "grossNplPercentage": {
      "type": ["number", "null"],
      "description": "Gross Non-Performing Loan ratio in %",
      "example": 3.65
    },
    "netNplPercentage": {
      "type": ["number", "null"],
      "description": "Net NPL after provision deduction in %",
      "example": -0.45
    },
    "totalLoansAdvancesBDT": {
      "type": ["number", "null"],
      "description": "Total outstanding loans in BDT Crore",
      "example": 52400.5
    },
    "provisionShortfallBDT": {
      "type": ["number", "null"],
      "description": "Shortfall against required provision in BDT Crore. 0 if no shortfall.",
      "example": 0
    },
    "returnOnAssetsROA": {
      "type": ["number", "null"],
      "description": "ROA in %",
      "example": 1.15
    },
    "auditorName": { "type": "string", "example": "A. Qasem & Co. Chartered Accountants" },
    "auditorOpinion": {
      "type": "string",
      "enum": ["Unqualified", "Qualified", "Disclaimer", "Adverse"],
      "example": "Unqualified"
    },
    "auditorEmphasisNotes": {
      "type": ["string", "null"],
      "description": "Summary of any emphasis of matter paragraph regarding liquidity, bad loans, or regulatory forbearance."
    },
    "sourcePages": {
      "type": "object",
      "properties": {
        "crarPage": { "type": ["integer", "null"] },
        "nplPage": { "type": ["integer", "null"] },
        "auditorReportPage": { "type": ["integer", "null"] }
      }
    },
    "confidenceScore": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0,
      "description": "Self-evaluated confidence in extracted numbers"
    }
  }
}
```
