# NBR Tax Policy Watchdog Agent

The **NBR Tax Policy Watchdog Agent** is an automated compliance and code maintenance agent responsible for monitoring changes in Bangladesh tax legislation (Income Tax Act 2023, annual Finance Acts, and NBR SROs) and ensuring that the calculation engine in TakaTalks remains 100% compliant and mathematically accurate.

---

## 1. Architectural Philosophy: The Config Boundary

In TakaTalks, all tax rates, progressive slabs, standard deduction limits, rebate caps, and surcharge tiers are strictly isolated in a single configuration file:
- [`web/src/config/tax-rules-2025-26.ts`](file:///Users/blackbird/INOVACE/TakaTalks/web/src/config/tax-rules-2025-26.ts)

The calculation engine functions in [`web/src/lib/tax/calculate.ts`](file:///Users/blackbird/INOVACE/TakaTalks/web/src/lib/tax/calculate.ts) and [`web/src/lib/tax/optimizer.ts`](file:///Users/blackbird/INOVACE/TakaTalks/web/src/lib/tax/optimizer.ts) contain **zero hardcoded numbers**. They accept the rules config as an immutable parameter.

The Tax Watchdog Agent's responsibility is to:
1. Detect legislative tax changes as soon as the Finance Bill is tabled or gazetted.
2. Draft a new year configuration file (e.g. `src/config/tax-rules-2026-27.ts`).
3. Generate new regression and fuzz tests in Vitest (`src/lib/tax/calculate.test.ts`).
4. Create a clean Pull Request with official gazette references.

---

## 2. Annual Operating Timeline in Bangladesh

| Month | Phase | Action / Event | Watchdog Agent Task |
|---|---|---|---|
| **Early June** | Budget Day | Finance Minister presents National Budget speech & Finance Bill. | Scrape draft Finance Bill PDF; extract proposed slab & exemption shifts. Output preliminary simulation report. |
| **Late June** | Parliamentary Passage | Finance Act officially enacted and gazetted in Bangladesh Gazette. | Parse enacted Act; diff against draft bill. Generate new `tax-rules-YYYY-YY.ts`. |
| **July 1** | New Fiscal Year | New tax rates become legally effective for Assessment Year. | Switch default app config to new year rules; update user-facing banner. |
| **Quarterly** | SRO Watch | NBR issues Statutory Regulatory Orders (SROs) for exemptions or clarifications. | Monitor NBR portal; flag circulars affecting IT freelancers, capital gains, or rebate instruments. |
| **Oct – Nov** | Tax Filing Peak | Peak user traffic on TakaTalks. | Freeze rule updates unless an emergency NBR deadline extension SRO is published. |
