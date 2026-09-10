# TakaTalks

Personal finance tools for a Bangladesh audience, built alongside the **Takatox** money
management video content. The idea: someone watches a video about tax rebates or FDR
returns, then immediately runs their own numbers in a tool that sits right next to it.

Everything here is early-stage. The `tools/` folder has working, testable demos. The
`prompts/` folder has the scoped build instructions for turning these into a real app,
written for handoff to Claude Code. The `docs/` folder has the reasoning behind the
decisions, so context survives past any one chat.

## Guiding principle

**Ask for less, not more.** No signup to try a calculator. Calculate on-device by default.
Only ask for an account at the one moment persistence is actually needed (e.g. a maturity
reminder), and say exactly why at that moment. See `docs/feature-spec-tax-calculator.md`
for the full reasoning.

## What's in `tools/`

### `tools/tax-calculator/`
Three versions, kept in order to show how the tool evolved. **Use v3 as the reference
version**, v1 and v2 are earlier iterations kept for history.

- `v1-simple-slab-calculator.html` — first pass, income + slab tax only.
- `v2-full-return-calculator.html` — added all income heads (salary, business, house
  property, capital gains), investment rebate, net wealth surcharge, minimum tax.
- `v3-trust-first-estimator.html` — same logic as v2, rebuilt with the no-signup /
  client-side-only / opt-in-wealth-fields principles applied. **This is the current base
  for Prompt 1.**

All three are self-contained HTML files, open directly in a browser, no build step, no
server, no dependencies beyond a Google Fonts CDN link.

### `tools/fdr-comparison/`
- `fdr-dps-comparison.html` — compares published FDR rates across a handful of banks,
  computes after-tax return based on a selected tax bracket, sorted by net return. Uses a
  **manually curated sample dataset** (dated 31 Dec 2025, sourced from a public rate
  roundup), not a live feed. See Prompt 2 for what turns this into a live, maintained
  version.

## What's in `web/`

The real app scaffolded from **Prompt 1**: Next.js + TypeScript + Tailwind +
Prisma/Postgres, covering the tax calculator + rebate optimizer and the
income/investment tracker. Deployed on Vercel. See `web/README.md` for setup
and deployment. The `tools/` HTML demos above remain as the reference logic
and design history; `web/` is where ongoing development happens.

## What's in `prompts/`

Scoped instructions for Claude Code, written so each one is a shippable chunk rather than
the whole vision at once.

1. **`01-tax-calculator-and-tracker.md`** — Phase 1-2. Turns `v3-trust-first-estimator.html`
   into a real app with a rebate optimizer and a multi-source income/investment tracker.
2. **`02-rate-monitoring-and-scorecard.md`** — Phase 3. Turns the static FDR comparison into
   a daily-monitored live pipeline, plus a bank comparison scorecard that shows sourced data
   without issuing a "best bank" verdict.
3. **`03-annual-report-extraction.md`** — Phase 3, slower cadence. Pulls audited figures
   (CAR, NPL, ROA) out of banks' annual report PDFs, on a monthly batch job, with a manual
   admin-approval step before anything reaches users.

Hand these to Claude Code **in order**. Each one assumes the previous module exists.

## What's in `docs/`

- **`feature-spec-tax-calculator.md`** — the trust-first principles applied to the
  calculator: zero signup, client-side only, opt-in wealth fields, estimate framing.
- **`product-notes.md`** — the fuller planning history: why the original all-in-one vision
  got split into phases, the advice-vs-math line (rebate math is safe to automate, "which
  bank/instrument is better" is advice and stays out of scope), the banking-sector context
  that shaped the scorecard design, and a running list of feature ideas not yet scheduled.

## Roadmap at a glance

| Phase | What | Status |
|---|---|---|
| 1 | Tax calculator + rebate optimizer | Built in `web/` (Next.js), from Prompt 1 |
| 2 | Income/investment tracker, maturity reminders | Built in `web/` (Next.js), from Prompt 1 |
| 3 | Bank rate comparison + scorecard (live) | Demo done (`fdr-dps-comparison.html`), not live |
| 3 | Annual report extraction pipeline | Not started |
| 4 | Goal planner (car, retirement) | Not started |
| 5 | AI reinvestment suggestions | Deliberately deferred, needs real usage data first |

## A few things to keep true as this grows

- Never let a scraper or extraction job silently show stale data as if it's current, always
  show a source and a last-verified date next to any number pulled from outside the app.
- Never compute or display a composite "health score" or "best bank" ranking. Show sourced
  figures side by side and let the person decide.
- Keep the trust mechanism (client-side calculation, no-signup-by-default, honest framing at
  the moment an account is actually needed) consistent with whatever KhorochPati.ai ends up
  using, don't solve the same trust problem twice under two brands.
- Tax rules change every national budget. Rate/rule constants belong in a dedicated config
  file, reviewed once a year, never hardcoded into calculation logic.
