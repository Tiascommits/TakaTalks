# Prompt 1: Tax calculator + income/investment tracker (Phase 1-2 MVP)

Status: not yet built as a full app. `tools/tax-calculator/v3-trust-first-estimator.html`
is the standalone calculator logic this prompt is meant to absorb into a real app.

Hand this to Claude Code when ready to scaffold the actual Next.js app.

---

I'm building "Takatox," a personal finance web app for a Bangladesh audience, paired with
educational YouTube/Facebook content about money management. Build the MVP covering two
modules only: (1) a tax calculator + rebate optimizer, (2) a multi-source income and
investment tracker. Do not build the AI advisor, wishlist/goal planner, or retirement
calculator yet, those come later.

STACK: Next.js (App Router) + TypeScript + Tailwind, SQLite via Prisma for now (swappable
later), deployed as a single web app, mobile-first responsive design.

MODULE 1: Tax calculator + rebate optimizer
- Reuse the logic in tools/tax-calculator/v3-trust-first-estimator.html: taxpayer category
  tax-free limits, progressive slabs (10/15/20/25/30%), salary standard exemption (1/3 of
  gross salary or 500,000, whichever is lower), business and house property and other income
  heads, capital gains handling (listed shares/fund units annual exemption then 15% flat,
  assets sold within/after 5 years, land above deed value, gold/jewellery flat 5%),
  investment rebate (lowest of 3% of taxable income, 10% of eligible investment, 750,000
  cap), minimum tax (5,000 or 1,000 for first-time), net wealth surcharge tiers
  (0/10/20/30/35%).
- Store all these thresholds and rates in a single config file (e.g. config/tax-rules-2025-26.ts)
  so they can be updated yearly without touching calculation code. Add a comment noting the
  source year and that it needs manual review each national budget.
- Rebate optimizer: given the user's current investment allocation and total taxable income,
  calculate how much more they'd need to invest (and in which eligible instrument, respecting
  each instrument's individual cap) to reach the maximum legal rebate. Show this as "invest
  X more in Y to save Z more in tax." This is pure arithmetic, no AI needed.
- Output a clear line-item breakdown (income heads, slab tax, capital gains tax, rebate,
  minimum tax, surcharge, net payable), similar to a return summary.
- Preserve the trust-first behavior from v3: fully client-side calculation by default, no
  signup required to use the calculator, net wealth/surcharge fields opt-in and hidden by
  default, "calculated on your device" messaging kept visible.

MODULE 2: Income and investment tracker
- Users can add multiple income sources (salary, freelance, business, rental, other), each
  with a label, amount, and frequency (monthly/annual/one-time).
- Users can add multiple investments, each with: instrument type (matching the tax rebate
  categories), principal amount, start date, term length, expected interest/return rate,
  and maturity date (calculated from term).
- A dashboard shows upcoming maturities within the next 30/60/90 days.
- A simple cron/scheduled job (or client-side check on load, for MVP) flags investments
  whose maturity date has passed, and lets the user confirm the payout amount received,
  which then becomes trackable "reinvestable cash" (a number shown to the user, no AI
  suggestion logic yet, just visibility).
- Both modules should read from the same user profile (category, income entries, investment
  entries) so tax calculations automatically use tracker data instead of requiring re-entry.
- Account creation should only be prompted at the point where persistence is actually needed
  (saving entries, setting a maturity reminder), not before.

DATA MODEL: User has many IncomeEntries, many InvestmentEntries, one TaxProfile (category,
disabled dependents, first-time filer flag, net wealth, car/property surcharge flags).

UI: Clean, mobile-first, Bengali/English bilingual labels where natural (this is a Bangladesh
audience). Avoid dense financial-app dashboard clichés, this should feel approachable to
someone learning money management for the first time, not intimidating.

Start by scaffolding the project structure and the tax config file, then the calculator UI,
then the tracker module. Ask me before wiring up any external AI API calls, since those come
in a later phase.
