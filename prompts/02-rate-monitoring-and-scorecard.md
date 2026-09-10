# Prompt 2: Rate monitoring pipeline + bank comparison scorecard (Phase 3)

Status: not built. `tools/fdr-comparison/fdr-dps-comparison.html` is a standalone demo
using a manually curated sample dataset (dated 31 Dec 2025), showing the after-tax
comparison logic this prompt is meant to make live and data-driven.

Important context this prompt assumes (see docs/product-notes.md for the full reasoning):
Bangladesh's banking sector had a negative aggregate CRAR and ~32% NPL ratio as of the
latest Financial Stability Report referenced during planning. This is why the scorecard
below deliberately avoids issuing a "best bank" verdict.

---

Extend the Takatox app with two new modules: (1) an automated rate-monitoring pipeline for
bank FDR/DPS rates, (2) a bank comparison scorecard. Do NOT build a single "best bank" or
"invest here" verdict. This must present sourced data transparently and let the user decide,
never issue a definitive recommendation.

MODULE 3: Rate monitoring pipeline
- Build a scheduled scraper (node-cron or a queue worker, running daily) that visits a
  configured list of bank websites/rate-card pages and extracts current FDR/DPS/Sanchayapatra
  rates. Store each scrape as {bankId, instrument, term, rate, scrapedAt, sourceUrl}.
- Each bank's scraper needs its own small adapter (selector/parsing logic per site, since
  formats differ), not one generic scraper. Structure this as a plugin per bank so broken
  adapters can be fixed independently without touching the rest.
- Every scrape attempt must be logged with success/failure. On failure, keep serving the
  last successfully scraped value but mark it "unverified since [date]" in the UI, never
  silently show stale data as if it's current.
- Send an admin daily digest: which adapters failed, which rates changed significantly since
  last successful scrape, so a human can manually verify and fix broken scrapers rather than
  assuming it's self-healing.
- Also pull Bangladesh Bank's official published weighted-average deposit rate data
  (bb.org.bd) as a secondary, lower-frequency cross-check, clearly labeled as "official
  aggregate, not the specific product rate."
- Every rate shown to a user must display its source and last-verified date next to it.

MODULE 4: Bank comparison scorecard (NOT a recommendation engine)
- For each bank, show a side-by-side card with whatever of these are actually sourced and
  dated: current rate by instrument/term, credit rating letter grade if publicly disclosed
  (cite the agency and date), bank type (state-owned/private/foreign/Islamic), and a link to
  their latest published financial statement if available.
- For any parameter that cannot be reliably sourced for a given bank, show "not available"
  rather than estimating or inferring it. Never synthesize a placeholder number.
- Add a permanent, non-dismissible info panel above the comparison: current deposit
  insurance coverage (BDT 200,000 per depositor per bank, only triggered on formal
  liquidation), and a note that amounts above that are not protected. Suggest spreading
  large deposits across institutions rather than concentrating them.
- After-tax return calculator: combine each rate with the existing NBR tax rules module
  (interest taxation, rebate eligibility) to show real after-tax return per option, this is
  the one place an automated calculation is appropriate, because it's deterministic math, not
  a judgment call about which bank is safer.
- Explicitly do not add a "top pick" badge, ranking by "best," or auto-generated verdict text.
  Sort by whichever column the user selects (rate, term, bank type), don't pre-rank by
  "goodness."
- Add a persistent disclaimer: rates and disclosed figures are self-reported by banks and may
  lag real conditions; users should independently verify before committing funds, especially
  for larger deposits.

Wire this into the existing Takatox data model from modules 1-2. Ask before adding any bank
to the scraper list, each one needs manual verification of its rate-card page structure
before an adapter is built for it.
