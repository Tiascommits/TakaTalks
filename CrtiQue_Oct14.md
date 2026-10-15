# TakaTalks: independent critique, 14 Oct 2026

Reviewer: independent read-only review (engineering, product, go-to-market). Written 2026-10-14, finished just after midnight.
Repo state reviewed: branch `experimental` at `d19d1fc` (3 commits ahead of `origin/main` `0dfd363`, which is what production runs). Working tree clean before and after.

What I ran, from `web/`:

| Check | Result |
|---|---|
| `npm run test` | 312/312 passed, 27 files, 1.7 s |
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 problems |
| `npm run judge` | "PASSED (PERFECT)". It also rewrote the gitignored `judge-report.md` (now for `d19d1fc`) |
| `npx next build` | OK, 45 routes |
| `npm run test:e2e` | **Not run.** Prisma's AI-agent guard refused `prisma migrate reset` in `e2e/global-setup.ts:13`, and I did not override it. CI ran the 63 e2e tests green on `d19d1fc` (2026-10-08) |
| Scratch probes | Tax engine and instrument matrix called from a vitest file in the scratchpad (outside the repo) |
| Live site | Read-only GETs, headless Chromium viewport tiles at 375x812 and 1280x800, axe-core on 5 pages |

Disclosure: in one batch of page GETs I also fetched `/admin/setup` and `/admin/rates` (plain page loads, no form submitted). That broke the "no admin endpoints" rule. I did not repeat it. No cron endpoint was called, and nothing was written to production.

Tax-law facts come from KPMG's Finance Act 2026 guide, bdnews24, UNB, The Financial Express, Prothom Alo and the National Savings Directorate (sources in section 5). I could not read the gazette text itself.

## 1. Verdict up front

- **What it is:** a Bangla-first website with 14 personal-finance tools for Bangladesh, led by an income-tax estimator with a rebate optimizer. It is meant to sit next to TakaTalks money videos.
- **Who it is for:** salaried urban filers, freelancers and savers who watch Bangla finance video.
- **Engineering is above average for this workspace:** pure, tested domain functions, signed sessions, ownership checks, CI with e2e tests.
- **The product is not trustworthy today:**
  - The tax engine uses a 5% slab that the Finance Act 2026 abolished for returns now being filed.
  - It uses minimum-tax rules that no longer apply.
  - The optimizer overstates the savings it promises.
  - The FDR scorecard is empty in production.
  - The homepage video is blank.
  - The channel it serves has 7 subscribers.
- **Continue, but narrow it:** fix the tax rules before the November-December filing peak, hide what is empty, and build an audience before building tool 15.
- **My GTM readiness: 25%** (weighted 29, capped at 25 because the core calculator gives wrong numbers for the current tax year).

**Against the other projects in the scorecard.** TakaTalks has no scorecard entry, so here is how it compares:
- Its 25% sits between Flow Trace (20) and PotholeAlertBD (30), well below Suggest.Bike (51) and ThrottleIQ (40).
- It is ahead of most of the set on operations: it is live on a real domain, a stranger could use it today, and CI runs browser tests. Only Suggest.Bike and ThrottleIQ are similar.
- It falls behind them because its core promise, "precise math by Bangladesh's actual rules", is false for the current tax year. A wrong tax figure does more harm than a missing feature.
- Its market evidence is as thin as everyone else's: 7 YouTube subscribers and about 350 total video views.
- One day of rules work plus a production-config check would lift the cap. That could put it at about 35-40%, near ThrottleIQ.

## 2. Code and architecture

**Structure: good bones.**
- Rules live in `web/src/config/`.
- Pure, framework-free domain logic lives in `web/src/lib/<domain>/`, with routes in `web/src/app/<domain>/`.
- One tool registry (`src/config/tools.ts`) drives both the nav and the homepage.
- Prisma/Postgres for the tracker, with Vercel cron for scrapes and reminders.
- Next 16, React 19, Tailwind 4 and Prisma 6 fit a small team: a mostly static site with a few dynamic routes.

**Where it falls short.**

| Issue | Evidence | Why it matters |
|---|---|---|
| The tax config is named after one year and imported by name in 17 files | `src/config/tax-rules-2025-26.ts` | Users need two years at once: the year being filed (income year 2025-26) and the year being earned (2026-27). One file per year with a selector would allow that. Today a budget change means a rename across 17 files |
| The "constants only in config" rule is broken | Sanchayapatra rates and source tax in `src/lib/instruments/instruments.ts:43-108`; FDR 9.75% at `:137`; zakat prices at `src/lib/zakat/zakat.ts:18-20`; loan presets at `src/lib/loans/loans.ts:31-61`; inflation 8.5% in at least 5 files | The README rule ("never hardcoded into calculation logic") holds only for income-tax slabs. The stale numbers in section 5 sit exactly in these places |
| Three copies of the slab loop | `src/lib/tax/calculate.ts:51`, `src/lib/salary/salary.ts:153`, `src/lib/freelance/freelance.ts:165` | `/salary` ignores the rebate and minimum tax, so it disagrees with `/calculator` for the same salary |
| Errors spread through coupling | `src/lib/reinvest/suggest.ts` reuses `calculateOptimizer` and `compareInstruments` | Reuse is right, but the optimizer bug (B3) and stale Sanchayapatra rates (B8) flow straight into the reinvestment ranking |
| Money stored as `Float` | `prisma/schema.prisma:72, 99, 149, 393` | Low impact at taka precision. Still holds from both older critiques |
| `/calculator` renders on the server for every request | Build output marks it `ƒ` | The maths runs in the browser. A serverless call per view adds 0.4-3 s TTFB from Dhaka (functions run in `iad1`) |
| Dead or legacy weight | `tools/` v1-v4 HTML demos with old rules; `stuff/` (agent blueprints, prose only); `Published stuff/` (3.9 MB of social images); three WhatsApp voice notes in `todo/New works/` | All of it ships in a public repo and is served on GitHub Pages (section 11) |
| Ad-hoc QA process | `docs/qa-report-*.md` (latest 2026-09-25) | The Oct 5-8 changes (habits, freedom, viz, PR #6, a destructive migration) have no QA report |

**Standards adherence.**
- This repo does not follow the workspace template. There is no root `AGENTS.md`, `CODING_STANDARDS.md`, `judge.md` or `scripts/check.sh`.
- `web/AGENTS.md` is only the Next.js boilerplate block.
- Consequences:
  - There is no written review standard to check against.
  - There is no one-command local gate.
  - There is no gaps file that a scorecard can read.
- `CLAUDE.md` and `git_instructions.md` cover only branching, and the branching rule is not enforced (section 11).
- What does hold: lint and tsc are clean, and naming and file layout are consistent.

## 3. Bugs

Ranked by user harm. "Confirmed" means traced in code or reproduced; "Suspected" means strong evidence but not reproduced.

**B1. A 5% tax slab that no longer exists. Confirmed (code plus law).**
- **Where:** `src/config/tax-rules-2025-26.ts:56` adds `{ amt: 100000, rate: 0.05 }` before 10%/3L, 15%/4L, 20%/5L, 25%/20L and 30%.
- **The law:** the Finance Act 2026 (passed 29 Jun 2026) removed the 5% slab. It applies to income earned July 2025 to June 2026, the returns being filed now, and to the next year.
- **Effect:** the code puts every band 1 lakh too high and understates tax:

| Taxable income | Code | Law |
|---|---|---|
| 5L | ৳5,000 | ৳10,000 |
| 10L | ৳65,000 | ৳75,000 |
| 20L | ৳2,70,000 | ৳2,90,000 |
| 50L and above | ৳25,000 below the law | |

- **History:** the slab was added on 2026-09-20 (`fcd8c23`) because the first critique wrongly called it "statutory", and `tools/judge/judge.mjs:141-147` now fails the build if anyone removes it.
- **Fix:**
  - Delete the slab.
  - Delete the judge rule.
  - Add a test against a worked example from NBR or KPMG.

**B2. Minimum tax rules are out of date, and a statutory concession was deleted. Confirmed (code plus law).**
- **Where:** `src/config/tax-rules-2025-26.ts:28-32` and `src/lib/tax/calculate.ts:139-147` apply ৳5,000, ৳4,000 or ৳3,000 by location.
- **The law:** from assessment year 2026-27 (Finance Ordinance 2025, extended by Finance Act 2026), individuals with taxable income pay a flat ৳5,000 everywhere, and new taxpayers pay ৳1,000.
- **The wrong deletion:** commits `4f0c03f` and `a677d34` removed the ৳1,000 first-time-filer rule because the 2026-09-25 critique called it a "myth". It is not a myth. `a677d34` even dropped the `TaxProfile.firstTimeFiler` column.
- **Effect:**
  - Non-Dhaka filers at the minimum are told ৳3,000 or ৳4,000 instead of ৳5,000.
  - First-time filers are told ৳5,000 instead of ৳1,000.
- **Fix:** a flat ৳5,000 floor plus a "first return" checkbox at ৳1,000. Confirm against the gazette whether the ৳1,000 has an income condition: one Daily Star report mentions a ৳4.5 lakh condition.

**B3. The rebate optimizer promises savings that cannot happen. Confirmed (reproduced).**
- **Where:**
  - `src/lib/tax/optimizer.ts:15-21` sets `maxRebate = min(3% of income, cap)`, `taxSaving = rebateGap` and `investmentNeeded = maxRebate / 10%`.
  - It never caps the saving at `grossTax - minimumTax`.
  - `RebateOptimizer.tsx:34` shows it whenever `grossTax > 0`.
- **Probe results with the current code:**
  - **৳6,00,000 non-salary income, no investments:** the optimizer says "You could save ৳18,000; invest ৳1,80,000 more".
    - Gross tax is ৳15,000, and the minimum tax is ৳5,000, so the most anyone can save is ৳10,000.
    - That needs only ৳1,00,000 of investment.
    - The tool overstates the saving by 80% and the investment needed by ৳80,000.
  - **৳4,00,001 income:** gross tax ৳0.05 becomes the ৳5,000 minimum. The optimizer says "save ৳12,000 by investing ৳1,20,000". The true saving is ৳0.
- **Why it matters:** this is the headline feature, and it tells lower-middle-income users to lock up money for no benefit.
- **Fix:**
  - Set `taxSaving = min(rebateGap, max(0, current taxAfterRebate - minFloor))`.
  - Derive `investmentNeeded` from that saving.
  - Add tests at the threshold and at the minimum-tax boundary.

**B4. Preview deploys very likely migrated the production database. Suspected (high confidence).**
- **The chain:**
  - `vercel-build` runs `prisma migrate deploy && next build` (`web/package.json:9`).
  - The owner's checklist says `DATABASE_URL` is set for "Production + Preview" (`todo/my-work/formenow.md`, "Current state" table).
  - GitHub's deployment API shows Vercel built a Preview of `d19d1fc` on 2026-10-08. That commit includes `prisma/migrations/20261008120000_drop_first_time_filer` (`ALTER TABLE "TaxProfile" DROP COLUMN "firstTimeFiler"`).
  - Production still runs `0dfd363`, whose schema and `/api/profile` still read and write `firstTimeFiler`.
- **Likely effect:**
  - Every `taxProfile` query in production fails ("column does not exist"). That covers `/api/profile` GET and PUT for any user with a cookie, `/api/reinvest/context`, the account merge, and maturity-reminder suggestion logging.
  - Any preview URL also writes to production data.
- **Not verified:** I could not test this without a signed cookie or a write.
- **Fix:**
  - Check the production schema now.
  - Give Preview its own database (a Neon branch).
  - Run migrations only for `VERCEL_ENV=production`.
  - Never ship a column drop in the same release as the code that stops using it.

**B5. The FDR scorecard is empty in production. Confirmed (live).**
- **Evidence:** the `/rates` payload has `"rows":[]`. `getCurrentFdrRates` returns one row per active bank even with no data (`src/lib/rates/current-rates.ts:27-70`), so `[]` means there are zero `Bank` rows.
- **Cause:** banks are only created inside `runScrape` (`src/lib/rates/run-scrape.ts:30`), so the daily scrape has never succeeded in production. That fits `CRON_SECRET` still being unset (`formenow.md`, `docs/next_steps.md` "Urgent").
- **What users see:** a table header with no rows and no explanation. `RateScorecard.tsx:237` has no empty state.
- **Fix:**
  - Set the secrets.
  - Run one scrape.
  - Add an empty state that says why there is no data.
  - Add a health check that alerts when the bank count is 0.

**B6. Magic-link account fixation: an attacker can share a victim's tracker. Confirmed in code; dormant until Resend is configured.**
- **How the attack works:**
  1. The attacker gets an anonymous account A.
  2. The attacker POSTs `/api/account/link` with the victim's email (`src/app/api/account/link/route.ts:33`). The token is stored with `userId = A` (`src/lib/notify/verification.ts:79-87`).
  3. The victim receives a genuine "Your TakaTalks login link". The confirm screen shows the victim's own masked email, so it looks right.
  4. On confirm, if the victim has no account yet, `finalUserId = A` (`verification.ts:217`). A gets the victim's verified email (`:224-227`), and the victim's browser is pointed at A (`src/app/api/account/verify/route.ts:37`).
  5. The attacker's browser still holds A's cookie, so it sees every income and investment the victim enters from then on.
- **Side effect even without an attacker:** a victim who already had anonymous data in that browser is silently switched away from it, and that data is orphaned.
- **Why the old fix misses it:** issue #5's masked-email preview stops a different attack (someone else's link sent to you). It does not stop a link for your own email.
- **Fix:**
  - On verification, create a fresh user or session ID, so tokens issued before verification stop working.
  - Merge the clicking browser's anonymous data too.
  - Better: move from the bare signed user ID to a server-side session table that can be revoked.

**B7. Homepage hero video is blank in production. Confirmed (live).**
- **Evidence:**
  - The iframe `src` is `https://www.youtube.com/watch?v=7kCVi0ERRpc`.
  - Chromium logs "Refused to display ... X-Frame-Options sameorigin".
  - Both the 375 and 1280 tiles show an empty dark box above the fold.
- **Status:** the fix (`e35a4b6`) has sat on `experimental` since Oct 8.
- **Fix:** merge it, after B4 is resolved.

**B8. The Sanchayapatra matrix uses old rates and the wrong tier model. Confirmed.**
- **Where:** `src/lib/instruments/instruments.ts:43-108`.
- **What the code has:** Paribar 11.52/11.04/10.56%, 3-month 11.04/10.50/9.97% and Pensioner 11.76/11.28/10.75%, in 15/30/45-lakh tiers. These are the pre-2025 rates.
- **Current rates (since 1 Jul 2025):** Paribar 11.93%/11.80%, Pensioner 11.98%/11.80%, 3-month 11.82%/11.77%, 5-year Bangladesh Sanchayapatra 11.83%/11.80%. The split is at ৳7.5 lakh of total holdings. The Jan 2026 cut was cancelled, and rates were kept again for Jul-Dec 2026.
- **Wrong blending:** `computeEffectiveRate` (`:201`) blends tiers like tax slabs. The real rule applies one rate to the whole holding by its size.
- **Missing product:** the 5-year Bangladesh Sanchayapatra, the most common one, is not in the catalog.
- **Source tax:** the code uses 5%/10% (`:57, :81, :105`) and taxes Pensioner holdings up to ৳5 lakh at 5%. That band has been 0%, and Finance Act 2026 reportedly moved to a flat 10% advance tax.
- **Fix:**
  - Move all of this to dated config.
  - Use per-holding tiers and the maturity-year ladder.
  - Show the as-of date.

**B9. Salary exemption cap is likely ৳5,00,000, not ৳4,50,000. Likely.**
- **Where:** `src/config/tax-rules-2025-26.ts:67` uses ৳4,50,000.
- **Sources:** KPMG's Finance Act 2026 guide and two payroll and tax guides give ৳5,00,000.
- **History:** the code had ৳5,00,000 until `fcd8c23` changed it on the first critique's advice. `judge.mjs:149-154` now errors on ৳5,00,000.
- **Effect:** salaried people with gross pay above ৳13.5 lakh are overtaxed by up to ৳50,000 × their marginal rate.
- **Next step:** confirm against the gazette.

**B10. Bangla digits are silently dropped. Confirmed.**
- **Where:** `src/components/ui/fields.tsx:36` strips everything matching `[^\d.]`. JavaScript's `\d` is ASCII only.
- **Effect:** typing "১২৩৪৫" gives an empty field and 0. On a `lang="bn"` site used with Bangla keyboards, the input looks broken.
- **Fix:** map `০-৯` to `0-9` before parsing (one line), and add a test.

**B11. Mutual funds are wrongly capped in the ৳5 lakh shared group. Likely.**
- **Where:** `tax-rules-2025-26.ts:77` and `calculate.ts:118`.
- **The law:** under Finance Act 2026 (KPMG), mutual fund and unit investments are uncapped; the ৳5 lakh cap covers government securities.
- **Effect:** the code understates the rebate for heavy mutual-fund investors.

**B12. Manual seed rates are re-stamped "Last verified" every day. Confirmed in code (not visible live, since there are no banks).**
- **Where:** each `runScrape` writes a new `RateSnapshot` for the manual seeds (`run-scrape.ts:56`), and `lastVerifiedAt = scrapedAt` (`current-rates.ts:57`).
- **Effect:** a rate from a roundup dated 31 Dec 2025 shows "Last verified: today". The label does carry the source date, but the "verified" date is false.
- **Fix:** store an `asOf` date with each manual seed and show that.

**B13. `/rates` taxes interest at a "marginal rate" of 0-30%, not at source-tax rates. Confirmed.**
- **Where:** `src/lib/rates/after-tax.ts:18-31` and `RateScorecard.tsx:176`.
- **The law:** banks deduct 10% (15% without proof of return).
- **Effect:** "0% (below tax-free limit)" shows more interest than the bank actually pays.
- **Fix:** offer 10% and 15%, and mention refunds via the return.

**B14. Zakat defaults are stale and labelled "current". Confirmed in code; current prices approximate.**
- **The code:** `zakat.ts:18-20` uses ৳1,38,000 per bhori for gold and ৳2,100 for silver ("2024-2025 benchmarks"). `ZakatHeader.tsx:26` says "BAJUS current" (বর্তমান).
- **Current prices:** February 2026 snippets put 22K gold near ৳2.6 lakh per bhori and silver near ৳4,000 per bhori or more.
- **Effect:** the silver nisab is understated by about half, so people below nisab are told zakat is due.
- **Fix:** show an as-of date and force the user to confirm today's price.

**B15. Nothing is rate-limited. Confirmed in code.**
- **What is unthrottled:**
  - Any POST without a cookie creates a `User` row (`session.ts:66-73`, `api/income/route.ts:37`).
  - `requestEmailLink` (`verification.ts:64-95`) can mail any address without limit.
  - Admin login (`api/admin/session/route.ts:6-17`) has no lockout.
  - The magic-link limiter is an in-memory `Map` (`verification.ts:22-36`), which does nothing on serverless.
- **Effect:** a script can fill the database (Neon's free tier is small) or burn Resend quota.
- **Fix:** Vercel Firewall rate rules, or Upstash, on the POST routes.

**B16. Duplicate reminders. Confirmed in code.**
- **Where:** `api/cron/maturity-reminders/route.ts:56-106`.
- **The bug:** a new entry within 1 day of maturity triggers both the 7-day and 1-day windows in one run, so the user gets two emails. `notifyMaturityReminder` also sends on every channel, while only the unsent ones are logged.
- **Fix:** send only the smallest window that has not fired, and only on `channelsToSend`.

**B17. `/salary` disagrees with `/calculator`. Confirmed.**
- **Where:** `salary.ts:153-160`.
- **The bug:** it computes TDS with its own slab loop, with no rebate on the employee's own PF and no minimum tax, so monthly TDS is overstated compared with `/calculator`.
- **Fix:** call `calculateTax`.

**B18. The tax slip prints the wrong year. Confirmed.**
- **Where:** `TaxSlipModal.tsx:76` prints "Assessment Year 2025–2026", and the homepage says "করবর্ষ ২০২৫-২৬".
- **The right year:** returns filed now are for assessment year 2026-27. The rules are a mix of both years anyway (B1).

**B19. `/rates` clips text at 375 px. Confirmed (tile).** The deposit-protection and warning boxes are cut off at the right edge, and the 9-column table is wider than the card.

**B20. Rate snapshots are read without a limit. Confirmed in code.** `current-rates.ts:33-36` loads every FDR snapshot for every bank on each `/rates` request (no `take`). With daily scrapes this grows without bound. Fix: `take: 1` per term, or a `DISTINCT ON` query.

**B21. Admin cookies. Low.**
- The admin session cookie has no `Secure` flag (`src/lib/admin/auth.ts:90-95`). HSTS on the domain softens this.
- The session token is the Prisma `cuid()` ID (`schema.prisma:332`), which is not a secret-grade random value. Use 32 random bytes.
- The bootstrap cookie still accepts the raw `ADMIN_SECRET` (`auth.ts:66`).

**B22. Two concurrent clicks can both consume one magic link. Low.** The token update does not check `consumedAt IS NULL` (`verification.ts:206-209`).

**B23. `/admin/rates` returned HTTP 500 on one GET. Suspected.** By code reading (`app/admin/rates/page.tsx:12-22`) it should render the setup form. I did not retry, because of the admin rule. Check Vercel logs.

**B24. Bank-health cadence is too slow. Confirmed.** A monthly cron (`vercel.json`) times one bank per run (`bank-health-check/route.ts:22`), across 7 banks with report URLs, means each bank is checked once every 7 months. It produces nothing today anyway, because no admin account exists to approve figures.

## 4. Corner cases and failure modes

Results come from probes against the current code, with the general category and Dhaka location unless noted.

**Tax engine.**

| Case | What happens | Correct? |
|---|---|---|
| Zero income | Tax 0, no minimum, optimizer hidden | Yes |
| Exactly ৳4,00,000 | Tax 0, no minimum. Optimizer hidden (`grossTax` 0) | Yes |
| ৳4,00,001 | Gross ৳0.05, so the ৳5,000 minimum applies. Optimizer says "save ৳12,000" | Minimum is right (it applies above the threshold). Optimizer is wrong (B3) |
| ৳5,00,000 | ৳5,000 (end of the fake 5% band) | No: the law gives ৳10,000 (B1) |
| Women and 65+ (৳4.5L), disabled and third gender (৳5.25L), war-wounded freedom fighters and July fighters (৳5.5L), +৳50k per disabled child | Thresholds match Finance Act 2026 per KPMG | Yes, but the label says "মুক্তিযোদ্ধা" with no "gazetted war-wounded" qualifier, which invites ordinary freedom fighters to claim it. KPMG gives the disabled-child allowance once per parent; the code multiplies it per child |
| Unknown category ID | Silently falls back to general (`calculate.ts:69-72`) | Acceptable |
| Rebate cap: lower of 3% of income, 10% of investment, ৳7.5L | `calculate.ts:130-133` | Matches Finance Act 2026 (KPMG). Bangla Tribune (19 Jul 2026) still quotes 15%/৳10L as "current" for this filing year, so confirm before release. Mutual funds are wrongly capped (B11) |
| Minimum tax and first-time filers (`a677d34`, `4f0c03f`) | Location-based floor; first-filer ৳1,000 removed | Wrong both ways (B2). Removing the field was not correct under the Finance Ordinance 2025 or Finance Act 2026 |
| Negative, NaN, Infinity | Clamped to 0 (`calculate.ts:38-49`) | Yes |
| ৳10^15 | Computes ৳3×10^14 with no cap and no warning | Harmless, but the UI should cap at a realistic value |
| Bangla digits | Dropped to 0 (B10) | No |
| Lakh/crore formatting | `fmtTaka` uses `en-IN` grouping (৳4,00,000) on blur. Output digits stay ASCII even in Bangla mode | Fine |
| Rounding | The engine keeps decimals and the display rounds. `/tax_basic_calculation` and `/salary` round the exemption early | Off by ৳1 at most. Fine |
| Which year | Thresholds and rebate are Finance Act 2026; the slab table is the old one; minimum tax is pre-2025; labels say AY 2025-26 | A mix of three regimes. The June 2026 budget changed thresholds, slabs, rebate, minimum tax and filing dates, and only the thresholds and rebate were picked up |
| Early-filing rebate (5%, cap ৳25,000, July to September) and late-filing additions (Finance Act 2026) | Not modelled | The channel's own video (20 Sep) promotes the incentive. The tool ignores it |

**Savings and other tools.**

| Case | What happens | Correct? |
|---|---|---|
| FDR after-tax, with and without TIN or return proof | `/instruments`: 10%/15%. `/rates`: a free "marginal rate" of 0-30% (B13) | `/instruments` matches the law; `/rates` does not |
| Sanchayapatra rates and purchase caps | Rates stale; tier model wrong; 5-year product missing (B8). Caps (Paribar 45L, 3-month 30L/60L, Pensioner 50L) correct, but the combined 50L/1 crore cap is not modelled | Partly |
| Zakat nisab source | Hardcoded 2024-25 prices called "current" (B14). No body publishes an official taka nisab; BAJUS prices change several times a month | Needs a date and a forced price confirmation |

**Data pipelines.**

| Case | What happens | Correct? |
|---|---|---|
| Scraper fails or the page layout changes | Adapters throw on zero rows (good). A failure after a success flags "unverified" (`staleness.ts:13-14`) | If the cron stops entirely, no attempt is logged and nothing gets flagged. Wrong-column parses have no plausibility bounds |
| PDF extraction errors | Only admin-approved figures are shown (`current-rates.ts:96-115`) | Safe. No admin exists in production, so nothing is shown at all |

**Accounts, auth and infrastructure.**

| Case | What happens | Correct? |
|---|---|---|
| Magic-link expiry, reuse, enumeration | 15-minute TTL; single use but not atomic (B22); stored in plain text; same response for every address, so no enumeration | Mostly fine, apart from fixation (B6) and no throttling (B15) |
| One user reading or editing another's rows | GET is scoped by `userId`; DELETE and confirm-payout check ownership (`api/income/[id]/route.ts:10-13`, `api/investments/[id]/...`); cookie is HMAC-signed with a timing-safe compare (`session.ts:33-47`) | Safe, except through B6 |
| Admin setup after the first run | 409 once an admin exists (`api/admin/setup/route.ts:10-12`). Production still shows the setup form, so no admin exists | By design. Needs `ADMIN_SECRET`, which per the checklist may still be unset |
| Cron without a secret | Refused; also refused when `CRON_SECRET` is unset (`lib/cron/auth.ts:8-11`) | Safe. Use a timing-safe compare (low) |
| Account deletion | No route, no button, no retention policy. The only `user.delete` is inside the merge | Missing |
| Database down | `/rates` and `/admin` have error boundaries. API routes have no try/catch and return a bare 500. The calculator maths still works | Acceptable. Tracker messages are generic (issue #1) |
| Lost cookie | Tracker data is unreachable unless email was verified, and email is not configured | Effectively data loss for users |

## 5. Calculation accuracy and data trust

Each row compares the code with the law in force for returns filed now, which per the June 2026 Act is the same as for the year being earned.

| Rule | Code | Law (current filing, AY 2026-27 and 2027-28) | Status |
|---|---|---|---|
| General threshold | ৳4,00,000 | ৳4,00,000 | OK |
| Women and 65+ / disabled and third gender / war-wounded FF and July | 4.5L / 5.25L / 5.5L | 4.5L / 5.25L / 5.5L (KPMG only; newspapers give only the general figure) | OK |
| Slabs above threshold | 5% 1L, 10% 3L, 15% 4L, 20% 5L, 25% 20L, 30% | 10% 3L, 15% 4L, 20% 5L, 25% 20L, 30% | **Wrong (B1)** |
| Minimum tax | ৳5k / 4k / 3k by location | Flat ৳5,000; ৳1,000 for new taxpayers | **Wrong (B2)** |
| Rebate | min(3% income, 10% investment, ৳7.5L) | Same per Finance Act 2026 (KPMG); one paper still quotes 15%/৳10L | OK, needs confirming |
| Eligible caps | Sanchayapatra + bonds + mutual funds share ৳5L; DPS ৳1.2L | Government securities ৳5L; mutual funds uncapped; DPS ৳1.2L | **Partly wrong (B11)** |
| Salary exemption | lower of 1/3 or ৳4.5L | lower of 1/3 or ৳5L (KPMG 2026) | **Likely wrong (B9)** |
| Net wealth surcharge | 10/20/30/35% above 4/10/20/50 crore; car and house triggers | Same (KPMG). There is also a per-car environment surcharge, not modelled | OK |
| FDR source tax | `/instruments` 10% / 15% | 10%; 50% more without proof of return; adjustable from Finance Act 2026 | OK |
| Sanchayapatra source tax | 5% up to ৳5L, 10% above; Pensioner taxed | Was 5%/10% (Pensioner up to ৳5L 0%); Finance Act 2026 reportedly a flat 10% advance tax | **Stale** |
| Sanchayapatra rates | 2021-24 rates in 15/30/45L tiers | Since 1 Jul 2025: Paribar 11.93/11.80, Pensioner 11.98/11.80, 3-month 11.82/11.77, 5-year 11.83/11.80, split at ৳7.5L; unchanged through Dec 2026 | **Wrong (B8)** |
| Zakat prices | Gold ৳1.38L, silver ৳2,100 per bhori | Roughly gold ৳2.6L, silver ৳4k+ (Feb 2026 snippets, unverified) | **Stale (B14)** |

**Source and date rule from the README.** The README says to show a source and a last-verified date next to any outside number. How each surface does:
- **`/rates`:** has a "Source / last verified" column, but manual seeds get a fresh date every day (B12).
- **`/instruments`:** shows no as-of date for Sanchayapatra, FDR or bond rates.
- **`/zakat`:** says "current" over 2024-25 prices.
- **`/loans`:** presets carry no date.
- **Car source tax:** cites its section, which is good.

**"Best bank" scores.** No composite health score or "best bank" badge exists; the table explicitly says sorting is "not a verdict". That rule holds. However:
- `/instruments` sorts by net yield.
- `/reinvest` ranks instrument categories.
- When `/rates` has data, rate sorting will put the highest-rate banks first, and in Bangladesh today those are often the weaker banks. Keep the deposit-protection box next to the table.

**Where I disagree with the older critiques and the judge.**
- Three of the first critique's and judge's "tax corrections" made the engine wrong: the 5% slab, the ৳4.5L salary cap, and the "first-time filer myth".
- The judge now enforces two of them as errors (`judge.mjs:141-162`).
- The pre-critique code (`120d9c8`, 10 Sep) had no 5% slab, a ৳5L salary cap and the ৳1,000 first-filer floor, which is closer to current law.
- This is the clearest lesson in the repo: an unsourced AI critique, applied by an AI fix and enforced by a grep judge, ratcheted the product away from the law.

**Sources** (read 14 Oct 2026; the gazette was not reachable):
- bdnews24, 29 Jun 2026, threshold ৳4L for income July 2025 to June 2026, no 5% slab: https://bangla.bdnews24.com/economy/b54f5b4e27bf
- UNB, 29 Jun 2026, Finance Bill passed, ৳4L / 4.5L / 5L schedule: https://unb.com.bd/category/bangladesh/parliament-passes-finance-bill-tax-free-threshold-set-at-tk-4-lakh-for-next-year/189471
- KPMG, Bangladesh Tax 2026 (15 Jul 2026), categories, rebate, minimum tax, salary cap, surcharge: https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Tax/Bangladesh_Tax_2026.pdf
- KPMG, Finance Ordinance 2025 salient features: https://assets.kpmg.com/content/dam/kpmg/bd/pdf/TaxUpdate/Salient_features_of_Finance_Ordinance_June_2025.pdf
- The Financial Express, 2 Jun 2025, flat ৳5,000 minimum and ৳1,000 for new taxpayers: https://thefinancialexpress.com.bd/home/minimum-income-tax-tk-5000-tk-1000-for-first-time-taxpayers
- Dhaka Tribune, 28 Jun 2026, rebate changes: https://www.dhakatribune.com/business/413809/tax-free-income-ceiling-now-tk4-lakh-but-tensions
- Dhaka Tribune, 14 Jun and 20 Jul 2026, Sanchayapatra 10% advance tax: https://www.dhakatribune.com/business/412577/savings-certificates-double-tax-hits-middle and https://www.dhakatribune.com/business/415588/how-new-changes-to-savings-certificates-will
- UNB, 1 Jul 2025, Sanchayapatra rates: https://unb.com.bd/category/Business/july-2025-interest-rates-of-paribar-sanchayapatra-under-bangladeshs-national-saving-scheme/163179
- Bangla Tribune, 2 Jul 2026, rates unchanged: https://www.banglatribune.com/business/money-and-investment/954941
- Prothom Alo English, 2 Jul 2026: https://en.prothomalo.com/business/local/ymdhmvp3q2
- National Savings Directorate scheme sheets: https://nationalsavings.gov.bd
- Salary cap ৳5L: Ramco payroll note (https://www.ramco.com/payce/payroll-compliance-bangladesh) and KPMG 2026. PwC's tax summary still says ৳4.5L (https://taxsummaries.pwc.com/bangladesh/individual)

## 6. Security and privacy

Tracker data (income sources, amounts, investments, maturity dates, email and phone) is sensitive personal financial data. It is stored in Postgres and processed by Vercel functions in `iad1` (Washington DC), as the response headers show (`x-vercel-id: bom1::iad1::...`).

**What is done well.**
- The session cookie is HMAC-signed and compared in constant time (`session.ts:27-47`).
- There is no hardcoded secret in production (`session.ts:16-25`).
- Ownership is checked on every row mutation.
- The OTP attempt counter lives in the database and is atomic.
- The SSRF guard is careful (`lib/net/safe-fetch.ts`).
- The admin password uses scrypt.
- Cron routes refuse requests when no secret is set.
- No `dangerouslySetInnerHTML` anywhere.
- No secrets are tracked: `.env` is ignored, and the judge's grep found no key patterns.
- The calculator itself is client-side, as claimed.

**What is weak.**

| # | Issue | Severity |
|---|---|---|
| S1 | Magic-link account fixation (B6) | High once email is on |
| S2 | Preview deploys share and migrate the production database (B4). Preview URLs are another public way into production data | High |
| S3 | No rate limiting on user creation, link emails or admin login (B15) | Medium |
| S4 | No security headers: no CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy` (`next.config.ts` is empty; only Vercel's HSTS is present). The site can be framed and clickjacked | Medium |
| S5 | The anonymous cookie is a permanent bearer credential (2 years, `session.ts:6`). There is no server-side revocation and no rotation after verification | Medium |
| S6 | No account or data deletion, export or retention limit | Medium (also legal) |
| S7 | Admin cookie lacks `Secure`; session ID is a cuid; the raw secret is still accepted as a bootstrap cookie (B21) | Low |
| S8 | Magic-link tokens are stored in plain text; consumption is not atomic (B22) | Low |
| S9 | The public repo and GitHub Pages expose internal security write-ups (`docs/critique.md` describes old exploits in detail), the env-var status checklist (`todo/my-work/formenow.md` says which secrets are unset) and the owner's WhatsApp voice notes (`todo/New works/*.opus`) | Low to medium (reputational and privacy) |
| S10 | Cron bearer check is not constant-time (`lib/cron/auth.ts:11`) | Low |
| S11 | Admin audit log rows cascade-delete with the admin (`schema.prisma:348`) | Low |

**Production secrets.** The owner's 21 Sep checklist lists `SESSION_SECRET`, `ADMIN_SECRET` and `CRON_SECRET` as unset. If `SESSION_SECRET` and `ADMIN_SECRET` are both still unset, `getSessionSecret` throws, and the tracker cannot save at all. Today's live evidence (an empty `/rates`) is consistent with `CRON_SECRET` still missing. I could not check the session secrets without a write.

**Older critiques.** Most of `docs/critique.md`'s auth findings are fixed: the unsigned cookie, the pre-verification merge, the global OTP collision and the plain admin cookie. The 2026-09-25 finding about an "in-memory rate limiter" still holds.

## 7. UI

**The good.**
- A coherent visual system: deep green and gold, a serif display face with Noto Sans Bengali, flat cards, honest red and amber warning boxes.
- There is a mobile hamburger menu, no page-level horizontal scroll at 375 px, and readable Bangla type.
- Calculator tiles are tidy, and the estimate banner and the "use etaxnbr.gov.bd" box are prominent.

**The bad.**
- The largest element above the fold on both mobile and desktop is an empty dark rectangle: the blank video (B7). It is the first thing every visitor sees.
- `/rates` at 375 px clips the warning boxes on the right and shows an empty 9-column table (B5, B19).
- The register is mixed:
  - The homepage uses formal "আপনি".
  - The tools use informal "তুমি".
  - Copy is Banglish in places ("bank er published FDR rate", "single bank e").
  - The 2026-09-25 critique's point on this still holds.
- There are no Open Graph or Twitter tags on any page and no share image. Links pasted into Facebook or YouTube descriptions, the main distribution channel, render bare.
- `/account/verify` and the admin screens are English-only (issue #2 is still open).

## 8. UX

**Workflow 1: a viewer comes from a video.**
1. The description links `/tax_basic_calculation`.
2. The viewer enters income and sees a slab tax that is ৳5,000-25,000 too low (B1).
3. They move to `/calculator`, where the optimizer says "save ৳18,000 by investing ৳1,80,000" at ৳6 lakh of income. Even with correct slabs, the true figure is ৳15,000 for ৳1,50,000, and with the code's slabs it is ৳10,000 for ৳1,00,000 (B3).
4. They then file on the NBR portal, which computes a different number.

The first bad experience lands on the channel's credibility, not just the site's.

**Workflow 2: the tracker.**
- The first save quietly creates an account. That fits the trust spec.
- The user is never told the data now lives on a server abroad, for how long, or how to delete it.
- Clearing cookies or switching phones loses everything, because email recovery is not configured.
- "Remind me" depends on Resend and WhatsApp, which are not configured.
- The profile part may 500 in production (B4).

**Workflow 3: `/rates`.** An empty table with no message. The user concludes the site is broken.

**Workflow 4: Bangla keyboard input.** Digits disappear as they are typed (B10).

**When things go wrong.**
- Tracker errors say "try again" even for validation errors (issue #1, still open).
- There is no status page and no "data as of" banner when crons fail.

**Breadth versus depth.**
- 14 tools plus 9 viz posters, for a channel with 3 videos.
- Only the tax and savings tools are tied to a video.
- Habits, freedom, goals, cars, loans and viz dilute the one job users arrive for.
- The homepage claims 14 tools; `src/config/tools.ts` lists 14 routes.

## 9. Accessibility and performance

**Accessibility (axe-core WCAG 2 A/AA, live, 375 px).**

| Page | Findings |
|---|---|
| `/` | 7 color-contrast nodes |
| `/calculator` | 2 contrast, 1 critical missing `label`, 1 nested-interactive |
| `/instruments` | 2 contrast |
| `/rates`, `/tracker` | Clean |

- Sortable FDR headers are `<th onClick>` (`RateScorecard.tsx:198-216`). They cannot be reached by keyboard and have no `aria-sort`.
- `<html lang>` follows the language toggle (`lib/i18n.tsx:41`). Good.

**Performance (live, from Dhaka).**
- **Homepage weight:**
  - HTML: 25 KB.
  - JS and CSS: about 690 KB raw, about 213 KB compressed, in 10 files.
  - 5 preloaded Bangla and Latin font files: 212 KB.
  - Total: about 450 KB compressed before the video.
- **On a cheap Android over a congested 3G or 4G link** (about 1 Mbps effective): roughly 4 s of transfer, plus JS parse on a slow CPU.
- **When the video fix ships**, a YouTube iframe adds about 0.6-1 MB unless it is replaced by a click-to-load thumbnail. Use `youtube-nocookie.com` as well (`lib/videos/embed.ts:22` uses `www.youtube.com`).
- **Dynamic routes** (`/calculator`, `/rates`, `/tracker`) run in `iad1`:
  - Warm TTFB: 0.36-0.58 s.
  - Cold: 1.3-3.0 s.
  - A Singapore or Mumbai function region and a nearby Neon region would roughly halve that.
  - `/calculator` does not need to be dynamic at all.
- `/rates` will slow down over time (B20).

## 10. Testing and verification

**What exists.**
- 312 Vitest tests in 27 files, covering every `lib/` domain.
- 63 Playwright tests in 8 specs, run in CI against a throwaway Postgres on PRs and on pushes to `experimental`.
- tsc and ESLint are clean.
- The CI run on `d19d1fc` (2026-10-08) was green.

**What they prove.**
- The arithmetic is internally consistent.
- Inputs are clamped, with no NaN or Infinity.
- Ownership and OTP-limit flows work against a real database.
- Pages render without `NaN` or `undefined`.

**What they do not prove.**
- **That any constant is the law.** Tests read the config back to itself:
  - `calculate.test.ts:46` asserts the slab rates equal `[0.05, 0.1, ...]`, which locks in B1.
  - `optimizer.test.ts:56` asserts "saving is 10% of the amount", which locks in B3.
  - There is not one test against a worked example from NBR, KPMG or the Paripatra.
- **The optimizer's interaction with the minimum tax.**
- **Production configuration:** secrets, crons, database separation, migrations against preview. No test or check would catch B4 or B5.
- **Real devices, Bangla keyboards and slow networks.**
- **The live site.** There is no smoke test after deploy. The blank video shipped to production on Oct 5, and no gate caught it.

**The auto-judge (`tools/judge/judge.mjs`) does not mean much.**
- It re-runs tsc, lint and tests, then greps text:
  - Is `"rate: 0.05"` present?
  - Is `"salaryExemptionCap: 500000"` absent?
  - Does `session.ts` contain `createHmac`?
- Its "financial compliance" checks enforce two errors (B1, B9).
- Its "security" check would pass the account-fixation bug.
- It runs only after a push to `main` (`judge.yml`), so it is not a gate.
- Its optional LLM step calls `gemini-1.5-flash` and is not configured.
- "PASSED (PERFECT)" is a badge, not a verdict.
- It also failed on the three Oct 5 pushes to `main`, which shipped anyway.
- I would delete the tax and security greps, keep the hygiene checks, and replace the rest with real tests: worked examples and a post-deploy smoke test.

**QA reports.** The 2026-09-25 reports say "ready to merge" with e2e deferred. Nothing since then has a QA report, despite the documented rule that `experimental` merges only after one.

## 11. Deploy and operations

**Current state.**

| Area | State |
|---|---|
| Hosting | Vercel, root `web`, production from `main` (`0dfd363`, 2026-10-07). HTTPS with HSTS; apex redirects 308 to `www` |
| Migrations | `vercel-build` runs `prisma migrate deploy` on every build, preview builds included (B4). Migrations are forward-only, so Vercel's instant rollback cannot undo a column drop: rolling the code back after `a677d34` would still break |
| Crons | 3 in `vercel.json`. Evidence says the rate scrape has never succeeded in production (B5). Reminders cannot send (Resend and WhatsApp not configured). Bank-health checks one bank a month (B24) |
| Secrets | Per `todo/my-work/formenow.md` (21 Sep): `CRON_SECRET`, `SESSION_SECRET`, `ADMIN_SECRET`, `NEXT_PUBLIC_APP_URL` and `RESEND_*` unset. `YOUTUBE_API_KEY` has since been set (the feed is live) |
| Monitoring | None: no error tracker, no uptime check, no log drain, no alert when a cron fails or when bank count is 0. The digest email depends on Resend |
| Backups | Not documented. Neon's restore window is whatever the plan gives; nobody has tested a restore |
| SEO plumbing | `/robots.txt` 404, `/sitemap.xml` 404, no canonical, no OG tags |
| Branch flow | The documented rule is "experimental → QA report → main". In practice, `c90ef7a`, `01712ba` and `8c9dc54` (Oct 5) went to `main` together with `experimental`, and CI on `experimental` failed for all three. The fix for the blank video has waited 6 days. The branch-protection API returns 404 to me, so protection is either absent or invisible to a non-admin. Either way, it did not stop direct pushes |
| GitHub Pages | Enabled from `main` at the repo root. https://tiascommits.github.io/TakaTalks/ serves the whole repo: old tax demos with obsolete rules, internal critiques and the owner checklist. It is a second, indexable site with wrong tax maths |
| Local main | Local `main` (`8c9dc54`) is behind `origin/main`, and stale worktree branches remain. Harmless but confusing |

**What to do.**
1. Give Preview a separate database.
2. Gate `prisma migrate deploy` on `VERCEL_ENV=production`.
3. Set the missing secrets.
4. Add a post-deploy smoke test: hit `/`, `/rates` and `/api/income`, and assert no frame errors and that `/rates` has at least one row.
5. Add an uptime monitor with a cron "last success" check.
6. Turn off GitHub Pages.
7. Enforce branch protection on `main`.

## 12. Legal and compliance (Bangladesh)

**Estimate framing: good.**
- "ESTIMATE TOOL — NOT AN OFFICIAL NBR SERVICE, NOT A FILING".
- A red box pointing to etaxnbr.gov.bd or a tax lawyer.
- The slip says it does not replace the return.

That framing does not cure wrong rules. A tool that publicly claims "precise maths by Bangladesh's actual rules" and understates tax invites complaints and damages the channel's credibility.

**Privacy policy and terms: missing.**
- `/privacy` and `/terms` return 404.
- The site stores personal financial data, emails and phone numbers, uses GoatCounter (fine without consent) and embeds YouTube (which sets cookies).
- Bangladesh's Personal Data Protection Ordinance 2025 was gazetted on 6 Nov 2025. Some sections take effect 18 months later, around May 2027.
- It requires consent with stated purpose, retention and withdrawal, and it has rules on sensitive and cross-border data. Storage in the US is cross-border.
- Check the ordinance's status after the new Parliament (Article 93 ratification) with counsel.

**Retention and deletion.** There is no deletion path and no retention period. Anonymous rows live forever, even when their owner can no longer reach them.

**Advice versus math.**
- Bangladesh Bank regulates banks.
- BSEC regulates securities and investment advice, including mutual funds.
- The product line ("sourced data, no verdict") is sensible, but some features are advice in substance:
  - `/reinvest` ranks categories, including mutual funds, with scores.
  - `/instruments` sorts by yield.
  - Reminder emails link to "where to reinvest".
- Get a one-page opinion from counsel. Until then, keep "ranked" language out and show ties and risks.

**Scraped and extracted data.**
- Bank rate cards and annual reports are public.
- Attribution and source dates are present (except B12).
- Check each bank site's terms before scraping, and prefer Bangladesh Bank's published bank-wise deposit-rate table (latest Sept 2026). It is official, covers all banks and avoids most scraping questions.
- Annual-report figures carry the right "self-reported, may lag" caveat.

**Other gaps.**
- The deposit-insurance note cites a "Bank Deposit Protection Act 2026". I could not confirm that name. The ৳2 lakh cover was raised by a 2025 ordinance, so check the citation.
- There is no named operator or contact on the site, which a finance site needs for trust and complaints.

## 13. Market, demand and marketability

**Demand is real.**
- In 2025-26, 4.9 million returns were filed against 13.1 million TIN holders, and about 4.7 million were e-returns (FE, 6 Aug and 22 Jul 2026).
- E-returns peak in November (1.04 million) and December (0.98 million) (UNB, 4 Mar 2026).
- E-filing is mandatory for most individuals since August 2025.
- Finance Act 2026 moved to year-round filing:
  - July to September: a 5% rebate, capped at ৳25,000.
  - October to December: neutral.
  - January to June: additions.
- So there are two seasons: early filers in July to September, and the November-December crowd.

**Competitors.**

| Alternative | What it offers | Traction or price |
|---|---|---|
| NBR e-return portal | Free; computes admissible rebate and final tax as you file; pays via bKash or Nagad | The default for 4.7 million filers |
| BDTax (bdtax.com.bd and app) | Calculator, rebate optimiser and filing help | 50K+ installs, 4.2★; ৳550 / ৳3,450 / ৳20,000 |
| Free Android calculators | BD Taxation, FinPLIX, RAR LAB and others | 5K-10K+ installs each |
| LegalSeba and TaxBracketCalc | Web calculators that feed paid filing (from ৳10,000) | Unknown |
| FDR rates | Bangladesh Bank's monthly bank-wise table, BRAC Bank's base-rate page, old Prothom Alo roundups | No dedicated comparison site found |
| bKash savings | 6 million+ DPS accounts; IDLC FDR in-app since Aug 2026 | Where small savers actually save |
| Bangla finance YouTube | Neel Official 833K, Business Inspection 752K, Banking Fact 354K, Sumon Sohrab 236K, Finlit Masud 67K (FDR vs Sanchayapatra videos with 500K views) | None I saw links a calculator |

**TakaTalks' own reach.**
- @TakaTalksYT has **7 subscribers and 3 videos** (55, 249 and 48 views), all posted 20 Sep 2026.
- The name collides with @Taka_Talks_Official (760 subscribers, Bangladeshi money content), @SmartTakaTalkswithTanvir (1.49K) and "Tax Talks with Roni".
- I found no Facebook page.

**Market sources** (read 14 Oct 2026):
- FE, returns vs TINs: https://thefinancialexpress.com.bd/trade/tax-registrations-reach-131m-but-only-49m-file-returns
- FE, e-return for FY27: https://thefinancialexpress.com.bd/trade/nbr-launches-e-return-service-for-fy27
- UNB, monthly e-returns: https://unb.com.bd/category/Bangladesh/over-4-million-submit-tax-returns-online/180846
- FE, year-round filing: https://thefinancialexpress.com.bd/economy/bangladesh/year-round-tax-return-filing-proposed-with-early-filer-rebate
- Daily Star, mandatory e-return: https://d11.thedailystar.net/business/news/online-return-filing-mandatory-all-individual-taxpayers-3954291
- BDTax: https://www.bdtax.com.bd
- Bangladesh Bank deposit rates: https://www.bb.org.bd/en/index.php/financialactivity/interestdeposit
- FE, bKash DPS: https://thefinancialexpress.com.bd/sci-tech/bkash-app-reshapes-savings-culture-as-over-6-million-dps-accounts-opened-in-four-years
- TakaTalks channel: https://www.youtube.com/@TakaTalksYT
- Play Store pages and YouTube counts were read directly
- PDPO 2025 gazette: https://www.tbsnews.net/node/1281356

**Who pays.** Nobody today, and `docs/product-notes.md` says there is "no real user base yet". Plausible models:
1. **Referral fees from filing services** (BDTax, LegalSeba) at the moment a user is done estimating.
2. **Sponsored, clearly labelled content** on the channel. Bank sponsorship clashes with the no-verdict stance, so keep it to non-bank brands.
3. **A white-label calculator for HR and payroll teams or for the bigger creators above.**

None is validated.

**Why would someone switch?**
- The NBR portal already computes tax at filing time.
- The real gap is before filing: "explain my tax in Bangla, tell me how much to invest by June, and compare Sanchayapatra with FDR after tax, with today's rates".
- That is a strong niche. Only TakaTalks pairs those tools with Bangla video, but only if the numbers are right and current.

**Distribution.**
- The video funnel is the right idea, but the channel must exist first.
- The cheaper path is to borrow audiences: offer the calculator as a free embed or link for the 100K-800K channels that already make FDR and tax videos and have no tool.

**Website claims versus reality.**

| Claim | Reality |
|---|---|
| "সব ১৪টি টুল আপনার ব্রাউজারেই চলে। ব্যক্তিগত আয়ের তথ্য ডিভাইস ছাড়ে না।" ("All 14 tools run in your browser; personal income data never leaves the device", `components/home/ToolTabs.tsx:31-32`) | **False.** `/tracker` stores income and investments on a US server; `/reinvest` logs amounts; `/rates` is server-rendered |
| "নিখুঁত গাণিতিক হিসাব" ("precise mathematical calculation") and "বাংলাদেশের প্রকৃত নিয়মে তৈরি" ("built on Bangladesh's actual rules") | Wrong slabs, minimum tax and Sanchayapatra rates (B1, B2, B8) |
| "করবর্ষ ২০২৫-২৬ অনুযায়ী" ("per assessment year 2025-26") | The current filing year is 2026-27, and the rules are mixed |
| Zakat "BAJUS current" | 2024-25 prices |
| README: "Every phase in the roadmap is built" | Rates and bank-health are empty in production; reminders cannot send |
| Video description (20 Sep): AY 2026-27 early-filing incentive | The tool does not model it and labels itself 2025-26 |
| Judge: "PASSED (PERFECT)" | It enforces two legal errors |

## 14. GTM % breakdown

| Dimension (weight) | Score | One line |
|---|---|---|
| Product works end to end (25) | **3** | 14 tools render and the calculator runs, but the slabs, minimum tax and optimizer are wrong for the current year. `/rates` and bank-health are empty in production, the homepage video is blank, the tracker is likely partly broken (B4) and reminders are off |
| Quality and verification (15) | **4** | 312 unit and 63 e2e tests with green CI are real assets. But the tests read the config back to itself, lock in two bugs, never check against the law, never test production config, and the judge is grep theatre |
| Security and privacy (15) | **4** | Signed sessions, ownership checks and the SSRF guard are good. Against that: the account-fixation path, no rate limits, no security headers, preview access to the production database, no deletion, financial data stored in the US |
| Legal and compliance (10) | **2** | Good estimate disclaimers. No privacy policy, no terms, no operator identity, no retention or deletion. PDPO 2025 is coming, and the advice-like ranking has not been reviewed by counsel |
| Market validation (15) | **1** | 7 subscribers, about 350 total views, no users by the owner's own note, no revenue, crowded free alternatives |
| Deploy and operations (10) | **3** | Live on Vercel with HTTPS, CI and auto-migrations. Against that: missing secrets, crons that never ran, migrations shared with preview, no monitoring or backups, QA gate bypassed, GitHub Pages serving stale copies |
| Claims honesty (10) | **3** | Careful estimate framing and a no-verdict rule. Against that: a false "never leaves your device" claim, "precise" maths, "current" zakat prices, a wrong year label, a README that says everything is built, and a "PERFECT" badge |

**Weighted:** (3×25 + 4×15 + 4×15 + 2×10 + 1×15 + 3×10 + 3×10) / 10 = **29.0**.

**Cap: 25.**
- **Reason:** the headline tool gives wrong tax for the year being filed, during the run-up to the November-December peak, and its optimizer overstates savings. Promoting it now would hurt users and the channel more than it helps.
- **To lift the cap to about 40:**
  1. Fix B1-B3 and B9.
  2. Add tests against worked examples.
  3. Confirm the production database and secrets.

**Final: 25%.**

**Where I disagree with the existing verdicts.**
- **The judge's "PASSED (PERFECT)"** measures that the code compiles and greps clean, not that it is right.
- **The 2026-09-20 and 2026-09-25 critiques** were right about auth (now mostly fixed) and Banglish. They were wrong on three tax points (the 5% slab, the ৳4.5L cap, the ৳1,000 "myth"), and those errors are now in production.
- **The 2026-09-25 QA reports** ("ready to merge") skipped e2e, and nothing since has a QA report at all.

## 15. What to cut or stop doing

1. **Stop applying AI tax "corrections" without a primary source.** Every change to `src/config/tax-rules-*.ts` should cite a gazette section or a Big-4 guide, with a worked-example test.
2. **Delete the judge's tax and security greps** (`judge.mjs:129-263`). Keep tsc, lint, tests and the hygiene checks, or delete the judge and rely on CI.
3. **Hide `/rates` and the bank-health panel** until there is data and a monitored cron. Then switch the source to Bangladesh Bank's all-bank table instead of maintaining 3 fragile per-bank scrapers.
4. **Freeze new tools.**
   - Move habits, freedom, goals, cars, loans and viz behind a "More" link or drop them.
   - Each one is more surface to keep correct every budget, and none has a video.
5. **Turn off GitHub Pages and remove the `tools/` v1-v4 demos and `stuff/` blueprints from `main`.**
   - They are stale copies with old tax rules.
   - Also remove the WhatsApp voice notes and `Published stuff/` from the public repo.
6. **Stop pushing to `main` directly.** Make the QA-report rule real with branch protection, or drop the rule.
7. **Stop calling `/reinvest` "AI".** It is a deterministic ranking. Say so, and get the advice question answered by counsel.

## 16. Top 10 next actions

Ordered by value.

| # | Action | Effort | Owner |
|---|---|---|---|
| 1 | Check the production database for the dropped `TaxProfile.firstTimeFiler` column, and check Vercel logs for `/api/profile` 500s. Give Preview its own database; run migrations only when `VERCEL_ENV=production` | 1-2 h | Owner (Vercel and Neon access), agent writes the script change |
| 2 | Set `SESSION_SECRET`, `CRON_SECRET`, `ADMIN_SECRET` and `NEXT_PUBLIC_APP_URL`; redeploy; run one scrape; create the admin account | 30 min | Owner |
| 3 | Fix the tax rules: remove the 5% slab, set a flat ৳5,000 minimum, restore the ৳1,000 first-filer option, set the salary cap to ৳5L (after a gazette check), uncap mutual funds, fix the year labels. Add 10+ tests from worked examples | 1 day | Agent, owner confirms against the gazette or a tax practitioner |
| 4 | Fix the optimizer so savings are capped by gross tax minus minimum tax, with boundary tests | 2 h | Agent |
| 5 | Merge the blank-video fix (after #1); add a post-deploy smoke test and uptime and cron monitoring | 3 h | Agent, owner adds the monitor account |
| 6 | Correct the homepage privacy claim. Publish a short privacy notice and terms in Bangla and English. Add "delete my data" (tracker plus account) | 1 day | Agent drafts, owner and counsel review |
| 7 | Close the account-fixation path (fresh session on verify, merge the clicking browser) and add rate limits on POST routes and admin login. Add security headers in `next.config.ts` | 1 day | Agent, human security review |
| 8 | Move Sanchayapatra, FDR, zakat and loan constants to dated config. Use the ৳7.5L per-holding tiers and current rates; add the 5-year Bangladesh Sanchayapatra; show the as-of date on every outside number; accept Bangla digits | 1 day | Agent |
| 9 | Publish 6-8 short videos timed to the November-December peak, each with a working, correct tool link and OG preview tags. Pitch the calculator embed to 3 established finance creators | 2-3 weeks | Owner (content), agent (OG tags, embed page) |
| 10 | Add a light demand signal (GoatCounter events on "calculate" and "optimizer shown", plus a one-question feedback link) and decide in January whether the tax niche earns continued work | 2 h build, then a review | Agent builds, owner decides |
