# Prompt 3: Annual audited report extraction pipeline (Phase 3, slower cadence)

Status: not built. Depends on prompts 01 and 02 being in place first.

---

Extend the Takatox app with a fifth module: annual report data extraction for the bank
comparison scorecard. This runs on a completely different cadence than the daily rate
scraper (module 3), annual reports are published once a year with a lag, so treat this as
a batch job, not a live crawl.

MODULE 5: Annual audited report extraction pipeline

Data source
- For each bank in the configured list, store a manually-curated URL to their investor
  relations / annual report page (not a guessed URL pattern, bank sites structure this
  differently, so the actual annual-report-listing page per bank needs to be supplied
  manually, not auto-discovered).
- Also store, where available, the bank's DSE company page URL, since listed banks archive
  filings there too and it's a more consistent format across banks than each bank's own site.

Ingestion
- A scheduled job (monthly check is enough, these don't update often) that visits each
  configured annual-report page, detects if a new report PDF has been added since the last
  known one (compare filename/date/hash), and downloads it if so.
- Extract structured figures from each PDF: Capital to Risk-Weighted Assets Ratio (CAR/CRAR),
  Non-Performing Loan ratio (NPL), Return on Assets (ROA), Return on Equity (ROE), total
  deposits, total loans/advances, net profit, and the auditor's name and report date.
  Use a PDF text extraction library (pdf-parse or similar) plus targeted regex/section-anchor
  matching around known financial-statement note headings, since layout varies bank to bank.
  This will not be 100% reliable across all banks on the first pass, log extraction confidence
  per field and flag low-confidence fields for manual review rather than silently storing a
  guess.
- Store each extracted record as {bankId, fiscalYear, field, value, extractionConfidence,
  sourceReportUrl, sourcePageOrNote, extractedAt}. Keep the raw PDF link attached so any
  figure shown to a user can link back to the original document.

Data model and display rules
- Every figure shown in the scorecard from this module must display its fiscal year
  prominently (e.g. "CAR: 11.2% (FY2024, audited)"), never presented as current-state without
  that label, since it can be a year or more old by the time someone reads it.
- If a bank has no successfully extracted figure for a field, show "not disclosed /
  not extracted" rather than omitting the row silently, so the gap itself is visible
  information.
- Add a field-level note wherever regulatory minimums apply, e.g. next to CAR show
  "regulatory minimum: 12.5%" so the user has context without interpreting it for them.
- Do not compute or display any composite health score, letter grade, or ranking from these
  figures. Show the raw disclosed numbers side by side across banks and let the comparison
  speak for itself.

Admin review flow
- Build a simple internal review screen (not user-facing) where newly extracted figures per
  bank per year can be checked against the source PDF page, and approved or corrected before
  they go live in the public scorecard. Nothing extracted should reach the user-facing
  comparison without this manual approval step, given how much these figures vary in format
  and how much weight they carry.

Integrate with module 4's comparison cards: each bank's card should show its rate data
(from module 3, frequently updated) alongside its latest approved annual-report figures
(from this module, dated by fiscal year), clearly visually separated so a user doesn't
mistake a year-old audited figure for a live one.

Ask before adding any bank's annual-report URL to the config, the correct page per bank
needs to be supplied rather than having the scraper guess a URL pattern.
