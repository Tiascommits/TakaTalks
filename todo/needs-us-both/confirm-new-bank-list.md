# Confirm the live-verified rates + bank list decision

Status: findings from live verification done 2026-09-11. Please spot-check the two real
adapters against what you see published, and decide on the three candidate banks below.

## Got real adapters (method: SCRAPED going forward)

- **AB Bank PLC** — `abbl.com/rates-and-charge/fixed-deposit-rates/` has a clean,
  server-rendered rate table. Verified rates at time of writing: 3mo 12.00%, 6mo 12.00%,
  12mo 12.00% (the base "Fixed Deposit (Time Deposits)" product — the page also lists a
  separate "Profit First" variant at slightly lower rates, deliberately not scraped since
  it's a different product).
- **National Bank PLC** — `nblbd.com/interest-rate/deposit-rate` has FDR rates but in a
  deeply nested table with amount-tier sub-tables. Adapter takes the smallest ("Up to 10
  lac") tier as the representative rate: 3mo 7.25%, 6mo 8.00%, 12mo 8.50%. Larger deposits
  get better rates on this bank's own page (up to 8.75% for 12mo above 50 lac) — worth
  knowing since the scorecard only shows the smallest-tier figure.

## Stayed on manual-seed (checked, but not scrapeable today)

- **Midland Bank** — no HTML rate-card page found with actual FDR percentages (schedule-of-
  charges PDFs exist but no clean table); an "Interest Rate Matrix" is referenced but not
  linked publicly. Existing seed values (10.15/10.25/9.9%) left as-is, not refreshed.
- **One Bank** — has a deposit-rate page but it's built from old-style nested `<table>`
  layout with amount-bracket columns rather than clean tenor rows; risk of silent
  misparsing was high enough to skip this pass. Seed values left as-is.
- **City Bank** — the only FDR rate document findable was a PDF that search results suggest
  dates to 2015; not trustworthy enough to refresh from. Seed values left as-is.
- **IFIC Bank** — `ificbank.com.bd/deposit-rate` only has a savings-tier table, not FDR
  tenor rates; actual FDR rates are in a PDF (`.../Latest Deposit Rate_10.06.2026.pdf`),
  which would need PDF parsing (same technique as Module 5) rather than HTML scraping.
  Not built this pass. Seed values left as-is.

## Candidate new banks — not added

**BRAC Bank, Dutch-Bangla Bank, Islami Bank Bangladesh** were checked as candidates (most-
used banks conspicuously missing from the original 9), but none had a scrapeable source:
- BRAC Bank's FDR page (`bracbank.com/en/retail/term-deposit/fixed-deposit-general`) is a
  JS-rendered single-page app with no rates in the server HTML at all.
- Dutch-Bangla Bank's and Islami Bank Bangladesh's current rates live only in PDFs
  (profit-rate circulars), not on a plain HTML page.

Rather than add these three with numbers pulled from search-engine summaries (which I
can't fully vouch for — I didn't verify them against the primary PDF/page myself), I left
them out. If you want them added, the fastest path is: send me the current rate PDF/page
for each (or confirm you're fine with me parsing the PDFs, which reuses the pdf-parse
pipeline already being built for Module 5) and I'll wire them in with a proper citation.
