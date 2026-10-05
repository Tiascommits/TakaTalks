# System One's Jev Integration Roadmap & Use Cases

Status: **Scoped & Planned (2026-10-05)**.  
Reference: TypeSafe AI's Jev frontier model (released 15 Sep 2026).

---

## 1. What Jev Is & Why It Fits TakaTalks

Jev is the first frontier **"System One" non-autoregressive decision model** by TypeSafe AI. It does not produce free-form conversational text, stream tokens, or hallucinate JSON syntax. Instead, it evaluates context (`state`) against strictly typed questions in a single parallel pass (70–500 ms latency) with calibrated probabilities.

Its three primitives:
- **`Choice`**: Picks an option from an enum of strings.
- **`Noul`**: Returns a calibrated probability (`0.0` to `1.0`) for a true/false proposition.
- **`Score`**: Returns an integer on an ordered scale (e.g. 1–5).

### Why this is a natural fit for TakaTalks
- **Zero hallucination risk**: Structured output cannot generate made-up financial numbers or malformed data.
- **Strictly respects the "Advice-vs-Math" line** (`docs/product-notes.md`): It outputs discrete categories and confidence values, never unregulated investment advice or "best bank" verdicts.
- **Ultra-low latency and low cost**: Orders of magnitude faster and cheaper than running heavy LLMs on background cron jobs.
- **Replaces fragile heuristics**: Solves the brittle regex matching currently causing scraping failures and document selection errors.

---

## 2. Core Guardrails (What Jev MUST NOT Do)

1. **NO "Best Bank" verdicts or composite health scores**: Under Bangladesh Bank and BSEC regulations, telling users which bank is safest is regulated advice. TakaTalks displays raw, audited disclosures side-by-side. Jev must never compute a "safety score" or rank institutions.
2. **NO tax arithmetic**: Tax slabs, surcharge formulas, and Sixth Schedule Part I para (21) exemptions are deterministic statutory math. They live in `config/tax-rules-2025-26.ts` and unit tests, never in probabilistic AI.
3. **NO client data exfiltration**: User tax inputs remain client-side by default ("Ask for less, not more"). Jev is strictly deployed on backend ingestion pipelines, public documents, and opt-in routing.

---

## 3. High-Value Use Cases & Scoped Tasks

### Phase 1: Bank Annual Report & PDF Document Triage
- **Location**: `web/src/lib/bank-health/fetch-reports.ts` and `web/src/lib/bank-health/extract-figures.ts`
- **Problem**: `pickAnnualReportLink` uses fragile string matching (`STRONG_REPORT`, `REPORT_NOISE`) that broke on 5 of 7 bank websites (AB Bank selected a 2014 credit-rating letter, Standard Chartered picked a reward leaflet, EBL picked a directors' report).
- **Jev Tasks**:
  - [ ] **Task 1.1**: Add link candidate classification via `Choice`:
    `["audited_annual_report", "quarterly_financials", "credit_rating_report", "basel_iii_disclosure", "directors_report_only", "agm_notice", "marketing_leaflets"]`.
  - [ ] **Task 1.2**: Add `Noul` gate on candidate PDF pages before regex parsing: `is_audited_capital_adequacy_table`.
  - [ ] **Task 1.3**: Shadow-mode comparison against the current heuristic in `fetch-reports.test.ts`.

### Phase 2: Rate Scraper Anomaly Guard & Layout Drift Detection
- **Location**: `web/src/lib/rates/run-scrape.ts` and `web/src/lib/rates/adapters/`
- **Problem**: Bank website layout changes can cause HTML/PDF scrapers to parse lending rates as deposit rates, or pull promo numbers.
- **Jev Tasks**:
  - [ ] **Task 2.1**: Implement post-scrape sanity check on extracted rate candidates:
    - `rate_type` (`Choice`): `["retail_fdr", "dps", "loan_lending", "corporate_deposit", "promo_special"]`.
    - `tenure_bracket` (`Choice`): `["3_months", "6_months", "1_year", "multi_year", "other"]`.
    - `is_plausible_fdr_rate` (`Noul`): Validates against current Bangladesh market context (e.g. 7%–13%).
  - [ ] **Task 2.2**: If confidence < 0.85 or classified as non-deposit, route directly to `src/lib/rates/digest.ts` admin review instead of corrupting the public scorecard.

### Phase 3: Bank SMS & Transaction Stream Parsing (Tracker & KhorochPati Bridge)
- **Location**: `web/src/lib/tracker/` (integrating with planned SMS ingestion / KhorochPati.ai pipe)
- **Problem**: Bangladeshi bank SMS templates (bKash, Nagad, Brac Bank, City Bank, EBL) have non-standard wording and change without notice.
- **Jev Tasks**:
  - [ ] **Task 3.1**: Build SMS event classifier:
    - `event_type` (`Choice`): `["fdr_profit_credit", "dps_installment_debit", "salary_credit", "merchant_expense", "fund_transfer", "atm_cash_out", "promotional_spam"]`.
    - `institution` (`Choice`): Detect issuing bank or MFS provider.
    - `is_investment_event` (`Noul`): Probability of being an investment maturity or interest credit.
  - [ ] **Task 3.2**: Confidence-gated UX flow:
    - > 0.90: Auto-match with tracked investment and record confirmed payout.
    - 0.60 – 0.90: Prompt user with one-tap confirmation ("Did your City Bank FDR profit arrive?").
    - < 0.60: Discard safely.

### Phase 4: Fast-Track User Intent Router (On-Ramp Deep-Linking)
- **Location**: `web/src/app/` (Hero search / on-ramp component)
- **Problem**: Users coming from YouTube or social videos have diverse financial scenarios and struggle to find the right tool.
- **Jev Tasks**:
  - [ ] **Task 4.1**: Build natural-language intent router evaluating queries in <100 ms:
    - `target_route` (`Choice`): `["/salary", "/reinvest", "/calculator", "/goals", "/rates", "/instruments", "/freelance"]`.
    - `primary_intent` (`Choice`): Identifies salary negotiation, matured FDR, car tax, freelance exemption, etc.
  - [ ] **Task 4.2**: Deep-link user directly with pre-selected tabs and preset values.

---

## 4. Integration Details & Dependencies

- **SDK Package**: `@typesafe-ai/sdk` (TypeScript)
- **Environment Variable**: `TYPESAFE_API_KEY` (Vercel Secret)
- **Fallback Policy**: Every Jev call must gracefully fall back to existing deterministic heuristics if the API key is unset or unreachable.
