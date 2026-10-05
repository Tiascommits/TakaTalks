# System One's Jev: Research Report & Architectural Evaluation

Date: 2026-10-05  
Status: Documented research and evaluation for TakaTalks.

---

## 1. Executive Summary

We evaluated whether **TypeSafe AI’s Jev** (released 15 September 2026) has scope within TakaTalks. Jev is the first frontier **"System One" non-autoregressive decision model**, designed specifically for sub-second, typed decision-making (`Choice`, `Score`, `Noul`) rather than conversational text generation.

Our evaluation finds clear, high-ROI scope for Jev in TakaTalks **specifically for automated data ingestion, validation, and triage**, while maintaining our strict founding principles:
1. **The Advice-vs-Math Line** (`docs/product-notes.md`): Jev must never compute a composite bank health score or pick "best banks/investments" (regulated territory under BSEC and Bangladesh Bank).
2. **"Ask for less, not more" / Client-Side Privacy**: Tax calculations remain on-device; user data is not sent over the wire.
3. **Deterministic Tax Math**: Income tax rules (Income Tax Act 2023) remain pure TypeScript arithmetic in `src/config/tax-rules-2025-26.ts`.

---

## 2. Comparison: System One (Jev) vs System Two (LLMs)

| Characteristic | Traditional Generative LLMs | System One's Jev | TakaTalks Application |
|---|---|---|---|
| **Mechanism** | Autoregressive (token-by-token) | Non-autoregressive (parallel pass) | High-speed serverless background jobs |
| **Output Format** | Markdown, prose, chat, unstructured JSON | Typed primitives (`Choice`, `Noul`, `Score`) | Zero schema parsing errors |
| **Hallucination** | Frequent in numeric and factual claims | Zero text hallucination | Crucial for financial disclosures |
| **Calibration** | Uncalibrated or rough confidence | Native, calibrated probabilities | Confidence-gated review queues |
| **Latency / Cost** | 1–5s, expensive per query | 70–500ms, fractional cost | Viable for daily scrapers and monthly crons |

---

## 3. Evaluated Use Cases

### 1. Bank Annual Report Document Triage (`src/lib/bank-health/fetch-reports.ts`)
- **Problem**: Current heuristic regex matching broke on 5 of 7 bank websites (AB Bank selected a 2014 credit rating letter; Standard Chartered selected a reward brochure; EBL selected a standalone directors' report).
- **Jev Fit**: Pass anchor texts and hrefs to Jev to classify document types (`Choice`) with calibrated probability.
- **Section Gate**: Use `Noul` to verify whether a candidate page is the audited Basel III capital adequacy note before running regex.

### 2. Daily Rate Scraper Anomaly Guardian (`src/lib/rates/run-scrape.ts`)
- **Problem**: Scrapers parse HTML tables or PDFs from bank sites. Layout drift can cause lending rates or promotional rates to be misclassified as retail FDR rates.
- **Jev Fit**: Fast post-scrape validation (`Choice` for `rate_type` and `tenure_bracket`; `Noul` for rate plausibility against Bangladesh market norms). Low-confidence results route to admin digest.

### 3. Bank SMS & Transaction Stream Parsing (`src/lib/tracker/` & KhorochPati.ai)
- **Problem**: Parsing non-standard Bangladeshi bank SMS (bKash, Nagad, Brac Bank, City Bank, etc.) for maturity detection and interest deposits.
- **Jev Fit**: High-throughput classification into structured events (`fdr_profit_credit`, `dps_installment_debit`, etc.) with confidence gating (>0.90 auto-records; 0.60–0.90 prompts user to confirm).

### 4. Fast-Track Intent Router & On-Ramp Deep Linking
- **Problem**: Users from YouTube/Facebook landing on the app have diverse intents (salary negotiation, tax rebate optimization, car loan vs cash, matured sanchayapatra).
- **Jev Fit**: Sub-100ms classifier from raw user query directly into appropriate tool deep links.

---

## 4. Where Jev Is Prohibited

- Prohibited from computing "Which bank is safest?" or "best investment" picks.
- Prohibited from executing income tax slab math or statutory exemptions.
- Prohibited from receiving private, un-anonymized personal tax records.

---

## 5. Related Files & Action Plan

- Master plan and tasks: `todo/system-one-jev.md`
- Policy gate & boundaries: `todo/needs-us-both/system-one-jev-policy-and-gates.md`
- Agent implementation checklist: `todo/agent-work/README.md`
- Environment secret tracking: `todo/my-work/formenow.md`
