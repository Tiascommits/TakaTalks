# TakaTalks: independent re-critique, 15 Oct 2026

Reviewer: independent, read-only review (engineering, product, go-to-market). Written 2026-10-15.

**Repo state reviewed.**
- Local branch `experimental` at `b1ad596`: 55 commits ahead of `origin/experimental` (`d19d1fc`, the Oct 14 baseline). None of them are pushed. All 55 are by one author and were made in one night (156 files, +3,854/-1,428 lines).
- Production serves `origin/main` at `0dfd363` (7 Oct). A trial merge of `experimental` into `0dfd363` is clean (no conflicts).
- Apart from the untracked critiques, the working tree was clean before and after this review. The only file I created is this one.

**What I ran** (from `web/`, after `npx prisma generate`):

| Check | Result |
|---|---|
| `scripts/check.sh` | Exit 0: tsc, ESLint, stray files, unsafe HTML, **408/408** Vitest tests in 42 files, `next build` OK |
| `npm run judge` | "PASSED (PERFECT)". It rewrote the gitignored `judge-report.md` |
| `npm run test:e2e` | **Not run** (no Postgres; the reset is destructive). I read all 8 specs (68 tests). CI has not run on these 55 commits, because they are not pushed |
| Scratch probes | About 30 tax, optimizer, salary and digit-parsing cases, run through a Vitest config in the scratchpad against the real modules |
| Local build | `next start` of the experimental build with no database. 10 pages as 375x812 and 1280x800 viewport tiles (no 768 tile), plus axe-core (WCAG 2 A/AA) at 375 |
| Live site | Read-only GETs of `/`, `/calculator`, `/rates`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/account`, plus response headers. No forms, no admin, no cron, no API |
| Law and market | Web research on 15 Oct 2026 (sources in sections 5 and 13). I could not read the gazette text itself |

"Confirmed" means I traced it in code or reproduced it. "Suspected" means strong evidence, not reproduced.

## 0. Since 2026-10-14

Statuses come from reading the code on `experimental`, not from `judge.md` or commit messages. "Fixed" means fixed on `experimental`; **none of it is in production**.

**Bugs B1-B24**

| ID | Baseline finding | Status | Evidence / note |
|---|---|---|---|
| B1 | 5% slab that no longer exists | **Fixed** | `web/src/config/tax-rules-2025-26.ts:68-74`; tests `src/lib/tax/worked-examples.test.ts:19-37`. Probe: 5L gives ৳10,000, 10L ৳75,000, 20L ৳2,90,000 |
| B2 | Location-based minimum tax; ৳1,000 first-return rule deleted | **Fixed** | `tax-rules-2025-26.ts:106-111`, `src/lib/tax/calculate.ts:139-146`, checkbox in `CalculatorForm.tsx:172-173`. The ৳1,000 income condition is still `owner-confirm` |
| B3 | Optimizer ignores minimum tax | **Fixed** | `src/lib/tax/optimizer.ts:16-21`. Probe: 6L gives ৳15,000 for ৳1,50,000; 4,00,001 gives ৳0 |
| B4 | Preview builds migrate the production DB | **Owner-only** (code part fixed) | `web/package.json:10` migrates only when `VERCEL_ENV=production`. Preview still shares `DATABASE_URL` (owner). Whether production already lost `TaxProfile.firstTimeFiler` is unchecked (owner). New risk from the same migration: bug M2 |
| B5 | `/rates` empty in production | **Fixed** (production still empty) | Honest empty state `src/app/rates/page.tsx:29-44`; nav gate `src/app/layout.tsx:41`. Live `/rates` still has `"rows":[]` today. Needs secrets and a scrape (owner) |
| B6 | Magic-link account fixation | **Fixed** | `src/lib/notify/verification.ts:53-79` binds the address to the verifying browser, never the requester. e2e covers it (`e2e/verification.spec.ts`) |
| B7 | Blank homepage video | **Fixed** (production still blank) | Click-to-load no-cookie player, `src/lib/videos/embed.ts:24-31`. Live `/` still embeds a `watch?v=` URL |
| B8 | Stale Sanchayapatra rates and wrong tiers | **Still open** (rates fixed, source tax wrong) | Current rates, ৳7.5 lakh whole-holding split, 5-year Bangladesh Sanchayapatra added, dated (`src/lib/instruments/instruments.ts:47-57`). Source tax is still 5%/10% (`:59-65`), but the Finance Act 2026 made it a flat 10% advance tax from 1 Jul 2026: bug M1 |
| B9 | Salary exemption cap ৳4.5L vs ৳5L | **Fixed** | `tax-rules-2025-26.ts:81-83`; test `worked-examples.test.ts:52-61` |
| B10 | Bangla digits dropped | **Fixed** | `src/lib/format.ts:8-16`, `src/components/ui/fields.tsx:36-42`. Probe: "১,০০,০০০" gives 100000 |
| B11 | Mutual funds capped with Sanchayapatra | **Fixed** | `calculate.ts:118-131`; `/reinvest` too (`src/lib/reinvest/suggest.ts:201`) |
| B12 | Manual seeds re-stamped "verified" daily | **Fixed** | Seeds carry their source date (`src/lib/rates/seed-rates.ts:16-19`, `run-scrape.ts:60-70`). But they are never flagged stale and they open the rates gate alone: bug M3 |
| B13 | `/rates` taxes interest at a marginal rate | **Fixed** | `src/config/rate-monitoring.ts` `FDR_SOURCE_TAX`; selector `RateScorecard.tsx:47, 192-196` |
| B14 | Zakat prices stale and called "current" | **Fixed** | Dated 13 Oct 2026, `src/lib/zakat/zakat.ts:18-23`; the UI asks for today's price (`ZakatCalculator.tsx:154, 351`) |
| B15 | No rate limiting | **Fixed** | Postgres fixed-window limiter `src/lib/rate-limit.ts:8-43`, used on every user POST and admin login. Gaps: `/api/account/verify` (L2) and CGNAT (L1) |
| B16 | Duplicate maturity reminders | **Fixed** | Tightest window only, claimed per channel before sending, `api/cron/maturity-reminders/route.ts:10, 52-64` |
| B17 | `/salary` disagrees with `/calculator` | **Fixed** | `src/lib/salary/salary.ts:135-145`; `/freelance` too (`freelance.ts:162-167`) |
| B18 | Tax slip prints the wrong year | **Fixed** | `TaxSlipModal.tsx:89` reads `TAX_RULES.yearLabel` ("income year 2025-26, AY 2026-27") |
| B19 | `/rates` clips at 375 px | **Fixed** (not seen with data) | `min-w-0` fieldsets and `overflow-x-auto`, `RateScorecard.tsx:109-147, 222`. With no DB I could only render the error state |
| B20 | Unbounded snapshot read | **Fixed** | `groupBy` newest per bank and term, `src/lib/rates/current-rates.ts:40-52`; index exists (`schema.prisma:238`) |
| B21 | Admin cookie: no `Secure`, cuid token, raw-secret bootstrap | **Fixed** | 32 random bytes, only the hash stored, `Secure` on Vercel (`src/lib/admin/auth.ts:8-11, 48-61`); bootstrap cookie gone (`:40-46`) |
| B22 | Two clicks consume one link | **Fixed** | Atomic claim, `verification.ts:219-223` |
| B23 | `/admin/rates` returned 500 once | **Owner-only** | Code renders the setup form (`app/admin/rates/page.tsx:12-22`). Only Vercel logs can explain the 500. I did not load admin pages this time |
| B24 | Bank health checked once every 7 months | **Fixed** | Daily cron (`vercel.json:5`), due-bank picker (`src/lib/bank-health/fetch-reports.ts:72-88`). Nothing is approved yet (no admin). New bug in the same path: L7 |

**Security items S1-S11**

| ID | Finding | Status | Evidence / note |
|---|---|---|---|
| S1 | Account fixation | **Fixed** | As B6 |
| S2 | Preview shares and migrates the prod DB | **Owner-only** (migration gate fixed) | Migrations gated (B4). A separate Preview DB is an owner task |
| S3 | No rate limits | **Fixed** | As B15 |
| S4 | No security headers | **Fixed** | `web/next.config.ts:8-21`: HSTS, nosniff, Referrer-Policy, `X-Frame-Options`, `frame-ancestors`, Permissions-Policy. No `script-src` (a stated choice) |
| S5 | Permanent bearer cookie, no rotation or revocation | **Still open** | `src/lib/tracker/session.ts:6, 27-31`. The value is `userId.HMAC(userId)`: identical on every device, valid 2 years, no server-side session. Merging now deletes the old anonymous user, which helps |
| S6 | No deletion, export or retention | **Still open** (deletion fixed) | "Delete my data" exists (`api/account/route.ts:10-15`, `/account`). No export. Orphaned anonymous rows are kept forever, which `/privacy` admits |
| S7 | Admin cookie | **Fixed** | As B21 |
| S8 | Plain-text tokens, non-atomic use | **Fixed** | SHA-256 only (`verification.ts:15-17`); atomic claim (B22) |
| S9 | Public repo exposes critiques, the secrets checklist and voice notes | **Still open** | Still tracked: `docs/critique.md`, `docs/critique_2026_09_25.md`, `todo/my-work/formenow.md` (lists which secrets are unset), 3 files in `todo/New works/`, `Published stuff/`, `stuff/`, `tools/` |
| S10 | Cron secret compared non-constant-time | **Fixed** | `src/lib/cron/auth.ts:10-16` |
| S11 | Audit log cascades on admin delete | **Fixed** | `onDelete: Restrict`, migration `20261015120000_keep_admin_audit_log` |

**Cuts (baseline section 15)**

| # | Cut | Status | Evidence / note |
|---|---|---|---|
| C1 | Stop AI tax "corrections" without a primary source | **Still open** (rules written) | `CODING_STANDARDS.md` "Cite" and "Prove" rules, `owner-confirm:` markers. But every tax constant still rests on KPMG and newspapers, and the "worked examples" are self-computed (section 10) |
| C2 | Delete the judge's tax and security greps | **Fixed** | `1e575f8`; `tools/judge/judge.mjs` has none left. It still prints "PASSED (PERFECT)" |
| C3 | Hide `/rates`; switch to the Bangladesh Bank table | **Still open** (hiding fixed, switch not done) | Gate at `layout.tsx:41`; still three per-bank scrapers plus three manual seeds |
| C4 | Freeze tools; move side tools under More | **Fixed** | `src/config/tools.ts:7`, `cad91d9` |
| C5 | Turn off GitHub Pages; remove `tools/`, `stuff/`, voice notes, `Published stuff/` | **Still open** | All still tracked; Pages is an owner switch |
| C6 | Stop pushing to `main` directly | **Owner-only** | No new pushes to `main` since `0dfd363`. Branch protection still unverified |
| C7 | Stop calling `/reinvest` "AI" | **Fixed** | "a fixed formula (not AI)", `app/reinvest/page.tsx:13`, `ReinvestHeader.tsx:22-23` |

**Top-10 actions (baseline section 16)**

| # | Action | Status | Evidence / note |
|---|---|---|---|
| A1 | Check prod DB column; Preview DB; gate migrations | **Owner-only** (migration gate fixed) | `package.json:10` |
| A2 | Set secrets, run a scrape, create the admin | **Owner-only** | Live `/rates` still empty |
| A3 | Fix tax rules with worked-example tests | **Fixed (pending gazette check)** | Section 5. Tests are self-computed, not from NBR or a practitioner |
| A4 | Fix the optimizer | **Fixed** | As B3 |
| A5 | Merge the video fix; smoke test; uptime monitor | **Owner-only** (smoke test fixed) | `.github/workflows/smoke.yml`, `web/scripts/smoke.mjs`. Smoke has never run |
| A6 | Honest privacy claim, privacy and terms, delete-my-data | **Fixed** | `src/app/page.tsx:13-14`, `ToolTabs.tsx:33-34`, `components/legal/LegalPages.tsx`, `/account`. Counsel review: owner |
| A7 | Fixation, rate limits, headers | **Fixed** | B6, B15, S4 |
| A8 | Dated config for outside numbers; Bangla digits | **Still open** (dating fixed) | Dated in place, and Bangla digits work. Open: the Sanchayapatra source tax (M1). Also Sanchayapatra, zakat and loan figures still live in `src/lib/<domain>/` files, not `src/config/` (AGENTS.md now accepts this) |
| A9 | Videos for the peak, OG tags, embed pitch | **Owner-only** (OG tags fixed) | `layout.tsx:29-38`, `app/opengraph-image.tsx`. Videos and the creator pitch are owner work. The embed page is not built, and the new `frame-ancestors 'self'` would block any embed |
| A10 | Demand signal | **Fixed** | GoatCounter events `CalculatorForm.tsx:130-137`, footer "Feedback?" link. GoatCounter is live in production (the script loads), but the events ship only with the merge |

**Other baseline points:** three slab loops, now one engine (**Fixed**). `/calculator` server-rendered, now static (**Fixed**). Workspace template files missing (**Fixed**: `AGENTS.md`, `CODING_STANDARDS.md`, `judge.md`, `scripts/check.sh`). Tracker "try again" errors (**Fixed**, `20d6606`). আপনি/তুমি register (**Fixed**, `f8d1f17`). Money as `Float` (**Still open**). No QA report since 25 Sep (**Still open**: 55 commits, no report). `robots.txt`, `sitemap.xml`, canonical (**Still open**: all 404 live, no route in the build). Early-filing rebate and deadlines not modelled (**Still open**). Disabled-child add-on "should be once per parent": **No longer applies**, I think the baseline was wrong (section 5).

**Count** of the 52 baseline items (24 bugs, 11 S-items, 7 cuts, 10 actions). Where part of an item is fixed, the status names what is left.

| Status | Bugs | S-items | Cuts | Actions | Total |
|---|---|---|---|---|---|
| Fixed | 21 | 7 | 3 | 5 | **36** |
| Still open | 1 (B8) | 3 (S5, S6, S9) | 3 (C1, C3, C5) | 1 (A8) | **8** |
| Owner-only | 2 (B4, B23) | 1 (S2) | 1 (C6) | 4 (A1, A2, A5, A9) | **8** |
| No longer applies | 0 | 0 | 0 | 0 | **0** |

Two of the 36 "Fixed" (B5, B7) are still broken in production, because nothing has shipped. Put simply: almost every code finding is fixed on `experimental`, and almost everything left needs the owner.

**Regressions the fixes introduced** (details in section 3):
- **M2:** the column-drop migration now ships in the same release as the code that stops using it. That breaks the repo's own new "Migrate" rule and makes an instant rollback unsafe.
- **M3:** the layout-level rates gate opens on 9.5-month-old manual seed figures alone, and those figures are never flagged stale.
- **L8:** the same gate puts a database query in the root layout, so every dynamic request pays an extra round trip to the database.
- **L4:** the static `/calculator` keeps the shared-link figures in the query string, which reaches server logs while `/privacy` says calculator input is "not sent to us".

I found **no regression in the tax maths, the optimizer, the account linking or merging logic, or the rate limiter's logic**. The probes in section 4 match hand calculations, and section 5 matches the slab, threshold, rebate and minimum-tax constants against current sources. The one rule error left (M1, Sanchayapatra source tax) is not a regression: the Finance Act 2026 changed the rule, and the fix agent flagged it `owner-confirm` instead of changing it.

## 1. Verdict up front

- **What it is:** a Bangla-first set of 14 personal-finance tools for Bangladesh, led by an income-tax estimator with a rebate optimizer, meant to sit next to TakaTalks videos.
- **Who it is for:** salaried and freelance urban filers and small savers who watch Bangla finance video.
- **Where the code is:** the 55 overnight commits fixed nearly every code finding from yesterday. The income-tax engine now matches every Finance Act 2026 source I could find, the optimizer is honest, the account-fixation hole is closed, and the legal pages exist. Two rule gaps remain: Sanchayapatra after-tax yields still use the pre-July source tax (M1), and the extra tax for filing after 31 December is not shown (M4). This is now a credible estimate tool, if the owner ships it.
- **Where production is:** unchanged since 7 Oct. It still uses the abolished 5% slab, shows a blank video and an empty `/rates`, has no privacy page, and claims data "never leaves the device". The November-December filing peak starts in about two weeks.
- **Continue:** yes, but the next step is mostly not code. After about a day of fixes (M1-M6), it is owner work: set the secrets, separate the Preview database, check the production schema, push, let CI run e2e, write the QA report and merge. Then put the calculator in front of real filers.
- **My GTM readiness: 40% for `experimental`** (weighted 43.5, capped at 40). **Production today: 25%**, unchanged from yesterday.

**Against the scorecard's 25%.** The 25% was right for the code it scored, and it is still right for production. Yesterday's critique said fixing the rules plus checking the production database and secrets "would lift the cap to about 40". The income-tax rules are fixed, so the old cap reason is gone from `experimental`. The database and secrets check has not happened. So I land at 40, not higher, for three reasons:
- None of the 55 commits has run against a real Postgres. That includes the rate limiter, the account merge and two new migrations.
- No QA report exists, which is the repo's own merge gate.
- The production config that every write depends on (`SESSION_SECRET`, `CRON_SECRET`, a separate Preview DB) is still missing as far as anyone has checked.

Market validation still scores 1 out of 10, and no code change moves it.

## 2. Code and architecture

**Structure: still good bones, now tidier.**
- Rules sit in `web/src/config/`, pure domain logic in `web/src/lib/<domain>/`, routes in `web/src/app/`. Next 16, React 19, Tailwind 4, Prisma 6 on Vercel and Neon remain a sensible fit for a mostly static site.
- One tax engine now. `/salary` and `/freelance` call `calculateTax` (`salary.ts:137`, `freelance.ts:166`), and `/tax_basic_calculation` reuses `slabTax` (`src/lib/tax/basic.ts:49`). The three-copies problem is gone.
- `/calculator` is static (`○` in the build). Shared-link values load client-side under `Suspense` (`CalculatorForm.tsx:60-76`). That is the right call for latency from Dhaka.
- The workspace template is in place: root `AGENTS.md`, `CODING_STANDARDS.md`, `judge.md`, `scripts/check.sh`. The standards are short and specific, and each rule says why. This is the best standards file in the workspace I have seen.

**Where it falls short.**

| Issue | Evidence | Why it matters |
|---|---|---|
| The release mixes a column drop with the code change | `prisma/migrations/20261008120000_drop_first_time_filer` still ships; production's `0dfd363` still writes the column (`git show 0dfd363:web/src/app/api/profile/route.ts:46`) | Violates `CODING_STANDARDS.md` "Migrate". See M2 |
| A database read in the root layout | `src/app/layout.tsx:41` calls `hasRateData()` | It works (static pages bake it in, and a scrape revalidates the layout, `run-scrape.ts:102-104`). But it couples every page to the DB, adds a query to every dynamic request (L8), and the reveal path has no test |
| Outside-number constants still live in `lib/` | `instruments.ts:47-65`, `zakat.ts:18-23`, `loans.ts` | Now dated and cited, so the harm is small. AGENTS.md accepts it. The `src/config/` rule in the README is still not literally true |
| One tax year only | `tax-rules-2025-26.ts` is imported by name | Fine until July 2027 for the slabs (they cover AY 2026-27 and 2027-28 per KPMG). Users planning for the year being earned see only the filing year |
| Session key falls back to the admin secret | `session.ts:17` | Couples two secrets and makes rotation destroy anonymous data (M5) |
| Money as `Float` | `schema.prisma` | Low impact at taka precision |
| No human review | 55 commits, about 3,900 lines, one night | Auth, merge, rate limiting and migrations were written and reviewed by agents only |
| Dead weight still in the public repo | `tools/` v1-v4 with obsolete rules, `stuff/`, `Published stuff/`, voice notes | The README still calls `tools/` v3 "the reference version" (`README.md:29-38`); AGENTS.md calls the same files obsolete |
| `judge.md` is out of date | "Update 1" says the round-1 fixes "are not on `experimental`" and never mentions the sweep merge `b1ad596` (token hashing, static calculator, entry caps, a11y) | The gaps file is what the scorecard reads |
| The auto-judge still prints "PASSED (PERFECT)" | `npm run judge` today | With the tax greps gone it is just tsc, lint, tests and hygiene. Rename the verdict to "checks passed" |

**Standards adherence (spot check against `CODING_STANDARDS.md`).**
- Cite: met in form. Every tax constant names KPMG, PwC or a newspaper with a date, and `owner-confirm:` marks the unconfirmed ones. Nothing cites the gazette.
- Prove: not met. The "worked examples" are computed by the agent from the config (`worked-examples.test.ts:1-10` says so). None comes from NBR, KPMG's own worked examples or a practitioner.
- Date: mostly met. The exception is manual seed FDR rates, which are dated but never labelled stale (M3).
- Derive, Escape, Bilingual: met as far as I sampled. Some English is left inside Bangla mode on the calculator ("tax-free limit ঠিক হয়", "(each +৳50,000 tax-free)").
- Guard: met except `/api/account/verify` POST, which has no rate limit (L2).
- Migrate: broken by M2.

## 3. Bugs

Ranked by user harm: H1, then M1-M6 in order, then L1-L12. The income-tax engine itself has no error I could find. M1 and M4 are rule gaps found against the Finance Act 2026 sources in section 5.

**H1. Production still serves the 7 Oct code, two weeks before the filing peak. Confirmed (live).**
- **Where:** www.takatalks.com runs `0dfd363`. On 15 Oct: the homepage says "করবর্ষ ২০২৫-২৬", embeds `youtube.com/watch?v=7kCVi0ERRpc` (blank frame), and keeps the false claim "ব্যক্তিগত আয়ের তথ্য ডিভাইস ছাড়ে না". `/rates` has `"rows":[]`. `/privacy`, `/terms`, `/robots.txt` and `/sitemap.xml` return 404.
- **Scenario:** a viewer from the 20 Sep videos runs `/tax_basic_calculation` at ৳10 lakh and is told ৳65,000 instead of ৳75,000.
- **Fix:** section 16, actions 1-4: owner config, the M1-M6 fixes, CI, QA, then merge.

**M1. Sanchayapatra after-tax yields use the old 5%/10% final tax. Confirmed (code plus two sources).**
- **Where:**
  - `src/lib/instruments/instruments.ts:59-65` (`sanchayaTds`: 5% up to ৳5 lakh, 10% above) and `:160` (Pensioner 0% up to ৳5 lakh).
  - `InstrumentsHeader.tsx:25` tells users the matrix strips "withholding tax (5%, 10%, or 15% TDS)" to show the real yield.
  - `/reinvest` ranks on the same numbers.
- **The law:** from 1 Jul 2026 the Finance Act 2026 makes Sanchayapatra source tax a flat 10% *advance* tax. The profit is then added to income and taxed at the slab rate, with any excess refunded (Prothom Alo, 12 Jun 2026; Dhaka Tribune, 20 Jul 2026). The budget also made all withholding adjustable rather than final (Budget Speech 2026-27, para 259).
- **Effect:** for anyone buying now, the matrix shows the wrong after-tax yield in both directions:
  - A 25%-slab saver with under ৳5 lakh in Paribar sees about 11.33% after a 5% deduction. Their real yield is about 8.95% after slab tax.
  - A saver below the threshold sees 11.33%, but is entitled to the full 11.93% via a refund.
- **Why it matters:** "FDR vs Sanchayapatra after tax" is the channel's own content theme. The code's own `owner-confirm` at `:62-64` already suspected this.
- **Fix:**
  - Use 10% withheld for all schemes.
  - Show "final tax = your slab rate" with a slab picker, as `/rates` already does for FDR (`RateScorecard.tsx:203-204`).
  - Keep the old 5%/10% only as a note for profit received before 1 Jul 2026.

**M2. The column-drop migration ships with the code change, so rollback breaks the tracker. Confirmed (code); impact depends on the production schema.**
- **Where:** `web/prisma/migrations/20261008120000_drop_first_time_filer/migration.sql` (`ALTER TABLE "TaxProfile" DROP COLUMN "firstTimeFiler"`) is in this release. Production code at `0dfd363` still reads and writes the column (`schema.prisma:148`, `api/profile/route.ts:26, 35, 46` at that commit).
- **Scenario A** (the Oct 8 preview did not drop it): the merge deploy drops it. If anything goes wrong and the owner uses Vercel instant rollback, every `taxProfile` query fails: `/api/profile`, `/api/reinvest/context`, account merge and reminder suggestions.
- **Scenario B** (the preview already dropped it): production's profile routes are failing today.
- **Fix:** before merging, look at the production `TaxProfile` columns. If the column still exists, move this migration to the release after next and record "no instant rollback past this deploy" in the QA report. This is exactly the rule `CODING_STANDARDS.md` "Migrate" sets.

**M3. Old manual FDR rates open the rates gate alone and are never flagged stale. Confirmed (code).**
- **Where:**
  - `src/lib/rates/adapters/manual-seed.ts:12-21`: the manual "scrape" always succeeds.
  - `seed-rates.ts:13-41`: Midland, ONE and City rates from a roundup dated 31 Dec 2025.
  - `run-scrape.ts:89, 104`: a success revalidates the layout.
  - `current-rates.ts:87-98`: the gate opens on any FDR snapshot.
  - `staleness.ts:11-20`: staleness looks only at scrape attempts, not at the source's age.
- **Scenario:** the first cron run after `CRON_SECRET` is set. AB, National and IFIC fail (their pages change often). The three manual seeds still "succeed", so `/rates` appears in the nav and on the homepage. It shows 9.5-month-old rates beside the date "Source dated 31 Dec 2025", with no "stale" or "unverified" flag. A saver sorts by rate and moves money on a number that is ten months old.
- **Why it matters:** the repo's own rule says "a stale value is labelled stale, never shown as current".
- **Fix:** gate on `method = SCRAPED` only, and mark any MANUAL row older than about 45 days as stale, or delete the seeds.

**M4. The calculator ignores the filing window, so January filers are told too little. Confirmed (code plus two sources).**
- **Where:** nothing in `src/` models or mentions filing dates. A search for "early", "deadline" and "late" finds no match in the calculator, slip or tax config.
- **The law:** the Finance Act 2026 made filing year-round (Daily Star, 2 Aug 2026; UNB, 11 Jun 2026):
  - July-September: a 5% rebate on tax payable, capped at ৳25,000. This window is now closed.
  - October-December: neutral.
  - January-March 2027: extra tax of 2% of tax payable or ৳3,000, whichever is higher.
  - April-June 2027: extra tax of 5% or ৳5,000, whichever is higher.
- **Scenario:** someone at the ৳5,000 minimum files on 10 January. The tool says ৳5,000; the portal asks for ৳8,000.
- **Fix:** a date-aware line on the result and the slip: "File by 31 Dec 2026 to avoid extra tax; from 1 Jan, add ৳X". Put the windows in the tax config with sources.

**M5. Changing the session key silently orphans every anonymous tracker. Confirmed (code).**
- **Where:** `src/lib/tracker/session.ts:16-25` signs cookies with `SESSION_SECRET || ADMIN_SECRET`, with one key and no rotation list.
- **Scenario:** the owner sets `ADMIN_SECRET` first to create the admin account, which is the natural order for unblocking `/rates`. People start saving tracker entries. Later the owner adds `SESSION_SECRET`, as the checklist says. Every existing cookie now fails its HMAC check. With email recovery off (Resend unset), those users' data is unreachable for good, and they see an empty tracker with no explanation.
- **Fix:** drop the `ADMIN_SECRET` fallback. Set `SESSION_SECRET` before or with the first deploy that writes. Accept a `SESSION_SECRET_PREVIOUS` for verification during rotation. Say in `formenow.md` that the value must never change.

**M6. The deploy smoke test cannot see that writes are broken. Confirmed (code).**
- **Where:** `web/scripts/smoke.mjs:17-31` only GETs pages, and `/api/health` (`src/app/api/health/route.ts:14-37`) reports DB reachability and data ages, not configuration.
- **Scenario:** with `SESSION_SECRET` and `ADMIN_SECRET` unset, every tracker save throws (`session.ts:19-23`). `/tracker` still renders for a visitor with no cookie, so the smoke test goes green.
- **Fix:** add `config: { session, cron, admin, email }` booleans (presence only, never values) to `/api/health`, and fail the smoke test when `session` is false on a production deploy.

**L1. IP-keyed limits will hit real users behind carrier NAT. Suspected (depends on traffic).**
- **Where:** `src/lib/rate-limit.ts:8-21`: 60 tracker writes per 10 minutes and 10 login-link requests per hour, per IP.
- **Scenario:** Bangladeshi mobile carriers put many subscribers behind shared carrier-grade NAT addresses. When one video sends a crowd at filing time, unrelated people on the same address share one budget and get "too many requests".
- **Fix:** key writes on the signed user ID when a cookie exists, and keep the IP key only for creating users and for link requests. Raise the per-IP numbers, and log 429 counts.
- **Off Vercel:** `x-forwarded-for` is client-controlled. The comment at `:15` says so. Keep the app on Vercel or trust only the platform header.

**L2. `/api/account/verify` POST has no rate limit. Confirmed.** `src/app/api/account/verify/route.ts:20-39`. Magic tokens are 256-bit and OTP guesses are capped per destination, so this is database load only. It breaks the "Guard" rule. Add `overLimit("link", clientIp(request))`.

**L3. The session cookie is a permanent, identical bearer token on every device. Confirmed (S5).** `session.ts:6, 27-31`. There is no "sign out other devices" short of deleting all data. Move to a server-side session row with a random ID, then rotate on verify.

**L4. Shared calculator links put income in the query string. Confirmed.**
- **Where:** `CalculatorForm.tsx:113-127` builds `/calculator?basic=…&ait=…`.
- **Effect:** the figures land in Vercel request logs, browser history and any referrer leak. Meanwhile `/privacy` says calculator input "is not sent to us" (`LegalPages.tsx:58`).
- **Fix:** put the values in the URL fragment (`#basic=…`), which browsers never send to the server.

**L5. A shared link drops investments, so the recipient sees a different tax. Confirmed.** Same lines. Rebate inputs are not shared, and nothing tells the recipient. Add "investments not included" next to the share button.

**L6. Per-term rate gaps are not flagged. Confirmed (code).** `current-rates.ts:56-76` uses the bank's latest log for every term. If a scraper stops finding, say, the 6-month row, the old 6-month snapshot keeps showing with its old "Last checked" date and no "unverified" flag. Flag a term whose snapshot is older than the bank's last successful log.

**L7. Bank-health never retries a report that failed once. Confirmed (code; pre-existing, not a regression).**
- **Where:** `fetch-reports.ts:148-156` treats a report as "unchanged" when the last logged `docUrl` matches, even if that log was a failure (`:171-175` stores the `docUrl` with the error). `:167-169` logs success before the cron extracts figures (`api/cron/bank-health-check/route.ts:42`).
- **Scenario:** a timeout downloading a 20 MB annual report, or a crash in `pdf-parse`, means that bank's new report is never processed.
- **Fix:** compare only against logs with `foundNewDoc = true` and no error, and write the success log after extraction.

**L8. Every dynamic request pays for the rates gate. Confirmed (code).** `layout.tsx:41` queries Postgres on each request to `/tracker`, `/account`, `/rates`, `/reinvest` and the admin pages, from `iad1`. Wrap `hasRateData` in a cached function with a tag that `runScrape` revalidates.

**L9. Account merge is not one transaction and ignores the 300-entry cap. Confirmed (code).** `verification.ts:27-44` moves rows in one transaction, then the profile, then deletes the user in separate steps. A merged account can pass `MAX_ENTRIES_PER_USER` (`src/lib/tracker/limits.ts:15`). Low impact.

**L10. Admin setup: a race and a dead link. Confirmed.** Two concurrent setup POSTs with the secret can both create an admin (`api/admin/setup/route.ts:12-36`). The 409 message says "use /admin/login", which does not exist (`:13`); login lives on `/admin/rates`.

**L11. Tracker frequency select is clipped at 375 px. Confirmed (tile).** It shows "মা" for "মাসিক".

**L12. Hosting plan fit. Suspected.**
- A code comment says the project is on Vercel Hobby (`fetch-reports.ts:72`). Hobby is for non-commercial use, and any sponsorship or referral model needs Pro.
- The PDF cron downloads up to 25 MB (`:14`) and parses it with no `maxDuration`. Check the plan and add `export const maxDuration`.

## 4. Corner cases and failure modes

**Tax inputs** (probes against the real modules, general category, business income unless noted):

| Case | Result | Correct? |
|---|---|---|
| Zero income | ৳0, no minimum, optimizer hidden | Yes |
| ৳4,00,000 | ৳0 | Yes |
| ৳4,00,001 | Gross ৳0.10, raised to the ৳5,000 minimum. Optimizer: ৳0 saving, "already at max" | Yes |
| ৳4,50,000 | Gross ৳5,000 equals the floor; optimizer ৳0 | Yes |
| ৳4,60,000 | ৳6,000; optimizer ৳1,000 for ৳10,000 | Yes |
| ৳6,00,000 | ৳20,000; optimizer ৳15,000 for ৳1,50,000 | Yes (B3 fixed) |
| ৳6,00,000, first return | Optimizer ৳18,000 for ৳1,80,000 (3% of income binds before the ৳1,000 floor) | Yes |
| ৳4,05,000, first return | ৳1,000 | Yes, if the ৳1,000 has no income condition (owner-confirm) |
| Woman or 65+ at ৳4,50,000 / ৳4,50,001 | ৳0 / ৳5,000 | Yes |
| War-wounded freedom fighter at ৳5,50,000 | ৳0; label now says "gazetted war-wounded" | Yes |
| Two disabled children, ৳5,00,000 | Threshold ৳5,00,000, tax ৳0 | Per child; see section 5 |
| Unknown category ID | Falls back to general | Acceptable |
| Salary, basic ৳1,50,000 a month | Exemption capped at ৳5L, tax ৳1,30,000 | Matches hand calculation |
| `/salary`, basic ৳30,000 | ৳5,000 (minimum), same as `/calculator` | Yes (B17 fixed) |
| Net wealth ৳5 crore, income ৳3 crore | 10% surcharge. Optimizer says ৳7.5L saving; true saving ৳8.25L, because the rebate also cuts the surcharge | Understates, which is safe |
| ৳4,20,000 plus "more than one car" | ৳5,500 (10% surcharge on the ৳5,000 minimum) | Not verified against the law |
| Listed-share gain ৳60L only | ৳1,50,000 (15% above ৳50L) | Per KPMG |
| Negative, NaN | Treated as 0 | Yes |
| ৳10^15 | The engine computes; the input field caps at ৳10,000 crore (`fields.tsx:41`) | Fine |
| "১২৩৪৫", "১,০০,০০০", "০.৫" | 12345, 100000, 0.5 | Yes (B10 fixed) |
| "12e3", "1.2.3" | 123 and 1.2 | Odd but harmless |
| Early-filing rebate, late-filing additions | Not modelled; no deadline shown | Gap (M4): a January filer owes at least ৳3,000 more than shown |

**Rates.**
- **FDR source tax:** `/rates` and `/instruments` both offer 10% with proof of return and 15% without. That matches the sources in section 5.
- **Sanchayapatra source tax:** `/instruments` applies 5% up to ৳5 lakh, 10% above, and 0% to Pensioner holdings up to ৳5 lakh, as a final tax. From 1 Jul 2026 it is a flat 10% advance tax, settled at the slab rate (M1).
- **Sanchayapatra caps:** Paribar ৳45L (`owner-confirm`; one bank FAQ says ৳1 crore), Bangladesh Sanchayapatra and 3-month ৳30L single / ৳60L joint, Pensioner ৳50L. The combined ceiling across schemes is not modelled.
- **Stale or failed scrapes:**
  - A failure after a success flags "unverified".
  - No attempt for 48 hours flags every rate (`rate-monitoring.ts`, `MAX_HOURS_WITHOUT_SCRAPE`).
  - Manual seeds are never flagged (M3), nor are per-term gaps (L6).
- **Implausible parses:** rates outside 1-20% are refused and logged (`run-scrape.ts:52-59`). The band is wide: a wrong column reading "9.5" still passes.
- **Bad PDF extraction:** only admin-approved figures reach the public (`current-rates.ts:116-145`). There is no admin, so nothing is shown. A failed report is never retried (L7).

**Accounts.**
- **Token expiry:** email links last 15 minutes, OTPs 10 minutes. Both are stored hashed and claimed atomically.
- **Email enumeration:** link requests answer the same way for every address. A per-address 429 says nothing about whether an account exists. No enumeration found.
- **Cross-user tracker access:** every GET is scoped by the signed user ID; every DELETE and confirm checks ownership (`api/income/[id]/route.ts:6-13`). Fixation is closed. The remaining path is "login CSRF": someone sends you a link for their own email. The confirm screen shows the masked address, and that is the only defence. This is acceptable.
- **Merge:**
  - An anonymous verifier is merged into the address owner, or into a fresh user, and then deleted. That kills its old cookie.
  - A verifier that is already verified some other way keeps its own data.
  - No path deletes the target user. `fromUserId === intoUserId` cannot reach the delete (`verification.ts:69`).
- **Delete my data:** `DELETE /api/account` removes the user with a cascade and clears the cookie. Cross-site calls are blocked by `SameSite=Lax` plus CORS. Other devices lose access, which is correct.
- **Behind proxies:** see L1.

**Admin and cron.**
- **Admin setup after the first run:** returns 409, and the setup page sends you to `/admin/rates` to sign in. Race and dead link: L10.
- **Cron without a secret:** 401, and also 401 when `CRON_SECRET` is unset. Compared in constant time.
- **DB down** (tested locally with no database):
  - `/rates` shows a Bangla "page could not load" screen with retry and home buttons, and React logs error #441 in the console.
  - `/api/health` returns 503 (per its code and unit test; I did not call it).
  - Static pages and every calculator work.
  - `/tracker` with no cookie renders empty.
  - The layout gate falls back to hidden.

## 5. Calculation accuracy and data trust

**Which year.** Returns filed now are for tax year 2026-27, covering income earned 1 Jul 2025 to 30 Jun 2026. They are filed from 22 Jul 2026 at the rates the Finance Act 2026 set when it passed on 29 Jun 2026 (BSS, 22 Jul 2026; Daily Star, 29 Sep 2026). The code's label "income year 2025-26, assessment year 2026-27" is right.

**Constants against the law** (sources read 15 Oct 2026; the gazette text itself was not reachable):

| Rule | Code | Law per sources | Status |
|---|---|---|---|
| General threshold | ৳4,00,000 (`tax-rules-2025-26.ts:39`) | ৳4,00,000; the Bill said ৳3.75L and Parliament raised it (Daily Star, 29 Jun 2026; Bangladesh Post, 29 Jun 2026) | **OK** |
| Women and 65+ / disabled and third gender / war-wounded FF and July fighters | 4.5L / 5.25L / 5.5L (`:38-55`) | Same (PwC tax summary, reviewed 31 Jul 2026; Daily Star, 29 Sep 2026). PwC lists 5.5L for freedom fighters only; July fighters rest on Daily Star Bangla (2 Jul 2026) | **OK**; July fighters single-source |
| Disabled child | +৳50,000 per child (`:76-79`, `owner-confirm`) | Per child or dependent, claimed by one parent (Budget Speech 2026-27 Appendix B, 11 Jun 2026; UNB, 11 Jun 2026) | **OK**. The `owner-confirm` can close. The baseline's "once per parent" was a misreading |
| Slabs | 10% 3L, 15% 4L, 20% 5L, 25% 20L, 30% (`:68-74`) | Same, no 5% band (PwC, 31 Jul 2026; Daily Star, 29 Sep 2026; KPMG Finance Bill 2026 notes, 14 Jun 2026) | **OK** |
| Minimum tax | Flat ৳5,000; ৳1,000 first return (`:110-111`) | Flat ৳5,000 above the threshold; ৳1,000 for "new taxpayers" (KPMG, 14 Jun 2026; PwC). No source defines "new taxpayer" or adds an income condition | **OK**. "First return" is an interpretation; say so in the label |
| Rebate | Lowest of 3% of income, 10% of investment, ৳7.5L (`:97-99`) | Same; replaces 15% / ৳10L (KPMG, 14 Jun 2026; PwC; Daily Star, 16 Jun 2026) | **OK** |
| Rebate claw-back | Not modelled | Investments must be held to maturity or the rebate is reversed (Daily Star, 16 Jun 2026; single source) | **Gap**: the optimizer should warn before telling people to lock money up |
| Govt securities cap / DPS cap | ৳5L / ৳1.2L (`:102-104`) | Same (Daily Star, 16 Jun 2026; asset-manager notes, Jul-Oct 2026) | **OK** |
| Mutual funds | Uncapped (`:162`, `owner-confirm`) | Out of the ৳5L pool (TBS, 29 Jun 2026, snippet only). Two asset managers say "up to ৳75L" | **Likely OK**; a ৳75L cap may exist. Keep the `owner-confirm` |
| Salary exemption | Lower of 1/3 or ৳5L (`:81-83`) | Same (PwC, 31 Jul 2026). LegalSeba's ৳4.5L page is for AY 2025-26 | **OK** |
| Gold capital gains | 5% (`:93`, `owner-confirm`) | Not confirmed by me | **Unconfirmed** |
| Filing windows | Not modelled | Jul-Sep 5% rebate (cap ৳25,000, now closed), Oct-Dec neutral, Jan-Mar +2% or ৳3,000, Apr-Jun +5% or ৳5,000 (Daily Star, 2 Aug 2026; UNB, 11 Jun 2026) | **Gap (M4)** |
| FDR source tax | 10% with proof of return, 15% without (`rate-monitoring.ts`) | 10%, +50% without proof of return (or TIN; sources differ). Now adjustable advance tax (Budget Speech para 259) | **OK as withholding**. `/rates` rightly says the return settles the final tax |
| Sanchayapatra rates | Paribar 11.93/11.80, BD 5-year 11.83/11.80, 3-month 11.82/11.77, Pensioner 11.98/11.80, split at ৳7.5L | Same, unchanged for Jul-Dec 2026 (Financial Express, 2 Jul 2026; Business24BD, 2 Jul 2026). Pensioner above ৳7.5L is single-source | **OK** |
| Sanchayapatra source tax | 5% to ৳5L, 10% above, Pensioner 0% to ৳5L, treated as final (`instruments.ts:59-65, 160`) | Flat 10% advance tax from 1 Jul 2026; profit then taxed at slab (Prothom Alo, 12 Jun 2026; Dhaka Tribune, 20 Jul 2026) | **Wrong for new money (M1)** |
| Zakat metal prices | Gold 22K ৳2,28,031; silver ৳4,199 per bhori, 13 Oct 2026 (`zakat.ts:18-23`) | Same BAJUS figures (TBS, 13 Oct 2026). Traditional-method silver is ৳2,624 | **OK and dated**. Name the silver grade: with traditional silver the silver nisab falls from about ৳2.2L to ৳1.38L |
| Deposit cover | ৳2 lakh per depositor per bank (Deposit Protection Ordinance 2025) | Per the code's cited UNB and Dhaka Tribune reports; not re-checked | **OK per code sources** |

**The `owner-confirm` items in the code, re-checked.**
1. Disabled child per child or per parent: **resolved, per child.** Close it.
2. Is the ৳1,000 minimum limited by income? No 2026 source adds a condition. Keep the flag, and name the term the law uses ("new taxpayer").
3. Are mutual-fund purchases before 1 Jul 2026 uncapped too, and is there a ৳75L cap? **Open.**
4. Gold capital gains at 5% or 15%: **open.**
5. Sanchayapatra source tax: **resolved against the code.** It is a flat 10% advance tax from 1 Jul 2026 (M1).
6. Does the lower Sanchayapatra rate cover the whole holding above ৳7.5L? Sources give "up to / above ৳7.5L" tables without saying. **Open.**
7. Paribar cap ৳45L or ৳1 crore: **open.**
8. Illustrative FDR 9.75%, bond 11.85% and fund 8.75% "set without a source" (`instruments.ts:188, 209, 233`; the bond's 5% source tax at `:188` is unsourced too). They are labelled illustrative. Bangladesh Bank's table (May 2026) puts private-bank 6-month FDRs at 7.75-12%, average 9.46% (BRAC Bank base-rate page), so 9.75% is plausible. Cite that table instead.
9. Loan figures: not re-checked.

**Does every outside number show its source and date?**
- **`/rates`:** yes. Every row shows its source and date; manual rows say "Source dated …". But old manual rows are not flagged stale (M3), and neither are per-term gaps (L6).
- **`/instruments`:** yes. Each row shows "Rate and source tax as of …: source" (`InstrumentMatrix.tsx:229`). The Sanchayapatra source tax shown is wrong (M1).
- **`/zakat`:** yes. Dated, and the user must confirm today's price.
- **`/calculator`, `/salary`, `/freelance`, `/tax_basic_calculation`:** only the year label. No visible "rules from the Finance Act 2026, checked 15 Oct 2026" line, and no link to a source. The citations live only in code comments. Add one line under the result.
- **Loans:** presets are dated in code; tests check a "dated Bangladesh Bank benchmark" label.

**Where I agree and disagree.**
- I agree with the round-1 tax fix agent on every income-tax constant it changed. The main tax maths is now right by every source I could find.
- I disagree with treating KPMG plus newspapers as settled. `CODING_STANDARDS.md` itself says a news or advisory-firm source alone needs `owner-confirm`. By that rule the slabs and rebate also need a practitioner's confirmation. They are probably right, but the repo's own standard is not met.
- I disagree with the baseline on the disabled-child add-on, as above.

**Sources** (read 15 Oct 2026; the gazette was not reachable):
- BSS, 22 Jul 2026, e-return for tax year 2026-27 and 4.7M e-returns: https://www.bssnews.net/news/407877
- Daily Star, 29 Jun 2026, Finance Bill passed, ৳4L threshold: https://www.thedailystar.net/business/bangladesh-budget-2025-26/news/finance-bill-passed-tax-free-income-threshold-set-tk-4-lakh-fy2026-27-4211511
- Daily Star, 29 Sep 2026, first-timer's guide (thresholds, slabs): https://www.thedailystar.net/news/technology/news/first-timers-guide-filing-your-income-tax-return-4285901
- PwC Worldwide Tax Summaries, Bangladesh individual, reviewed 31 Jul 2026: https://taxsummaries.pwc.com/bangladesh/individual/taxes-on-personal-income
- KPMG, Salient features of Finance Bill 2026, 14 Jun 2026: https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Salient_features_of_Finance_Bill_2026(Tax-and_VAT).pdf
- Budget Speech 2026-27 (English), Appendix B and para 259, 11 Jun 2026: https://customs.gov.bd/files/BudgetSpeech_2026_2027_E.pdf
- Daily Star, 16 Jun 2026, rebate 10% / ৳7.5L, hold to maturity: https://www.thedailystar.net/business/news/new-tax-regime-may-hit-middle-class-hardest-4199691
- Daily Star, 2 Aug 2026, early-filing rebate and filing windows: https://www.thedailystar.net/business/news/submit-returns-sep-30-tk-25000-tax-rebate-nbr-4238366
- Financial Express, 2 Jul 2026, Sanchayapatra rates unchanged for Jul-Dec: https://thefinancialexpress.com.bd/home/bangladesh-keeps-national-savings-certificate-interest-rates-unchanged-for-jul-dec
- Prothom Alo, 12 Jun 2026, Sanchayapatra 10% advance tax: https://www.prothomalo.com/business/economics/ifkl7ecfeo
- Dhaka Tribune, 20 Jul 2026, how the Sanchayapatra changes work: https://www.dhakatribune.com/business/415588/how-new-changes-to-savings-certificates-will
- TBS, 13 Oct 2026, BAJUS gold and silver prices: https://www.tbsnews.net/economy/gold-prices-fall-tk3266-bhori-bangladesh-1571191
- TBS, 29 Jun 2026, mutual funds out of the ৳5L ceiling (snippet only): https://www.tbsnews.net/economy/stocks/dividend-tax-slashed-listing-threshold-axed-ignite-capital-market-1475656
- BRAC Bank base-rate page with Bangladesh Bank's 6-month FDR table: https://www.bracbank.com/en/page/brac-bank-base-rate-for-retail-loan-home-loan-auto-loan-personal-loan

## 6. Security and privacy

**Done well (verified in code):**
- HMAC session cookie, compared in constant time, with no default secret in production.
- Ownership checks on every row change.
- Account fixation closed.
- Login links and OTPs stored only as hashes and claimed atomically.
- OTP guesses capped per destination in the database.
- Admin sessions: 32 random bytes, only the hash stored, `Secure` on Vercel.
- scrypt for admin passwords.
- Constant-time cron and admin-secret checks.
- A Postgres rate limiter that stores only hashed keys.
- Security headers on every response.
- No `dangerouslySetInnerHTML`, and `check.sh` blocks new raw-HTML sinks.
- A careful SSRF guard for scraper fetches.
- Analytics that send only the path, never figures (`Analytics.tsx:47-50` counts `pathname`, so query strings never reach GoatCounter).

**Still weak:**

| # | Issue | Where | Severity | Fix |
|---|---|---|---|---|
| 1 | Production lacks every fix above, including the headers | `0dfd363` | High until merged | Merge after QA |
| 2 | Preview deploys can reach production data | `DATABASE_URL` set for Production + Preview (`todo/my-work/formenow.md`) | High (owner) | Neon branch for Preview |
| 3 | Session key: no rotation, admin fallback | `session.ts:16-25` | Medium | M5 |
| 4 | Permanent, identical bearer cookie | `session.ts:6, 27-31` | Medium | Server-side sessions |
| 5 | Public repo exposes which secrets are unset, old exploit write-ups and voice notes | `todo/my-work/formenow.md`, `docs/critique*.md`, `todo/New works/` | Low-Medium | Move to a private repo or delete from history; turn off Pages |
| 6 | Income figures in shared-link URLs | `CalculatorForm.tsx:113-127` | Low | Fragment, L4 |
| 7 | IP-keyed limits and CGNAT | `rate-limit.ts:16-21` | Low now | L1 |
| 8 | `/api/account/verify` not limited | `verify/route.ts:20` | Low | L2 |
| 9 | Hashed rate-limit keys are unsalted, so a known email's bucket can be recomputed | `rate-limit.ts:32` | Very low | Add a server-side pepper |
| 10 | No human security review of agent-written auth and merge code | 55 commits | Medium (process) | One hour of review by someone who did not write it |

**Privacy posture.**
- The data is sensitive: income, investments, maturity dates, email and phone, processed in the US (Vercel `iad1`; Neon region unconfirmed).
- `/privacy` now says this plainly, which is good.
- Two gaps remain:
  - The only contact is a public GitHub issues page, which is a poor channel for a deletion or access request about financial data.
  - Orphaned anonymous rows are kept forever. The page admits this; it is still a retention problem.

## 7. UI

Experimental build, viewport tiles at 375x812 and 1280x800:
- **Homepage:** clean and confident. The headline promises a "verifiable estimate". The hero now shows a real video thumbnail with a play button instead of a blank box. Tabs group the tools (কর, আয়, সঞ্চয়, যাকাত, আরও). No horizontal scroll at 375.
- **Calculator:** the header reads "ESTIMATE TOOL — NOT AN OFFICIAL NBR SERVICE · আয়বর্ষ ২০২৫-২৬ (করবর্ষ ২০২৬-২৭)". The on-device note is green and the "use etaxnbr.gov.bd" warning red. The first-return checkbox is visible near the top. Good.
- **Mixed language** remains in places: "tax-free limit ঠিক হয়", "(each +৳50,000 tax-free)", "Provident Fund (নিজের অংশ)". Bangla-mode users still meet English mid-sentence.
- **Tracker:** the frequency select is clipped (L11).
- **Share cards:** `og:` and `twitter:` tags plus a 1200x630 image on every page (`layout.tsx:29-38`). Not yet checked in Facebook's Sharing Debugger.
- **Production today:** still the blank video, no OG tags, and the old false privacy line.

## 8. UX

**Workflow 1: viewer from a video to the calculator (experimental).**
1. They land on `/calculator` from a description link, and the page is static, so it is fast.
2. They type salary in Bangla digits, and it works.
3. The result shows slabs, rebate, minimum tax and net payable, all consistent with `/salary`.
4. The optimizer gives an honest figure, or says nothing can be saved at the minimum.

Remaining friction:
- No filing deadline. From 1 January the tool under-states what people owe (M4).
- No "next step" after the estimate (how to file on etaxnbr, or who can help).

**Workflow 2: tracker.**
- The first save creates an anonymous account. The tracker header now says so and links to "see or delete saved data" (`/account`).
- Clearing cookies still loses everything while email recovery is off, and the owner rotating the session key would do the same silently (M5).
- "Remind me" still depends on Resend and WhatsApp, which are unset.

**Workflow 3: `/rates`.** It is hidden until data exists and says so honestly. The risk is the reverse: it reappears with only ten-month-old manual figures (M3).

**Workflow 4: something fails.**
- DB-backed pages have a loading state and a Bangla error page with retry.
- Tracker saves now say why they failed, including 429.
- There is still no status note or "data as of" banner when a cron stops.

**Breadth.** Habits, freedom, goals, cars, loans and viz now sit under "More". That is the right fold. The core is tax, salary, freelance, savings comparison and zakat.

## 9. Accessibility and performance

**Accessibility.**
- axe-core (WCAG 2 A/AA) found **0 violations** on 10 pages at 375 px in the experimental build: `/`, `/calculator`, `/tax_basic_calculation`, `/salary`, `/instruments`, `/zakat`, `/rates` (error state), `/tracker`, `/privacy`, `/account`. Yesterday production had contrast, missing-label and nested-interactive failures.
- Sort headers are now buttons inside `<th aria-sort>` (`RateScorecard.tsx:92-101`), and an e2e test checks `aria-sort`.
- The tax slip is a real `<dialog>` (`TaxSlipModal.tsx:41`).
- Not tested: screen readers, Bangla text-to-speech, real phones. Note that `/rates` with data was not rendered.

**Performance.**
- **Homepage weight (from the build):** about 7 KB of compressed HTML, 208 KB of compressed JS and CSS, and 212 KB in 5 preloaded font files. That is about 430 KB before the video thumbnail, the same as yesterday.
- **Fonts are the cheapest win:** 4 Noto Sans Bengali weights plus Newsreader and Plex Mono. Two Bangla weights would save roughly 80-100 KB.
- **On a low-end Android at about 1 Mbps:** roughly 3.5-4 s of transfer plus parse. The video iframe (about 1 MB) now loads only on tap, which is a real improvement.
- **Latency:** `/calculator` is static now. Production today takes 1.87 s to first byte because it is still dynamic on `main`, against 0.19 s for the cached homepage. `/tracker`, `/account` and `/rates` still run in `iad1` with an extra layout query (L8). A Mumbai or Singapore region plus a nearby Neon region would roughly halve their latency.

## 10. Testing and verification

**What exists.**
- 408 unit tests in 42 files (up from 312 in 27).
- 68 Playwright tests in 8 specs (up from 63). New ones cover account fixation through real browser cookies, delete-my-data, the first-return minimum, the optimizer at the minimum-tax floor, Bangla digits and the rates empty state.
- `scripts/check.sh` gives one-command local checks.
- A post-deploy smoke workflow.
- `/api/health` has a unit test.

**What they prove.**
- The engine's arithmetic matches hand calculations of the configured rules, at every slab boundary, category threshold and the minimum-tax floor.
- The optimizer no longer promises impossible savings.
- The e2e specs check ownership, OTP limits and the fixation fix against a real Postgres. They have not run on these commits yet.

**What they do not prove.**
- **That the constants are the law.** `worked-examples.test.ts` says its cases are "computed by hand from the rules in `src/config/tax-rules-2025-26.ts`". That is the config tested against itself with better arithmetic. `CODING_STANDARDS.md` "Prove" asks for examples from the source or a practitioner. Ask a practitioner for five real cases (salaried, woman, first return, investor at the cap, surcharge) and paste their numbers in.
- **That the new database code works on Postgres.** The rate limiter, account merge and verification are unit-tested with a mocked Prisma (`src/lib/rate-limit.test.ts:6`, `verification.test.ts:22`). Only e2e exercises them for real, and e2e has not run on these 55 commits. No e2e touches the rate limiter.
- **The rates-gate reveal.** `e2e/rates.spec.ts` checks that `/rates` is hidden before data. After the admin scrape, it never checks that the nav shows `/rates`.
- **Production config.** No test or probe checks that the secrets exist (M6).
- **Real devices and slow networks.** Not tested.
- **The judge.** It still says "PASSED (PERFECT)". It now checks only what CI checks, plus hygiene. It is harmless but adds nothing.

**QA.** The repo's rule is "`experimental` merges only after a written QA report". The newest report is `docs/qa-report-2026-09-25-fixes.md`. There is nothing for the 55 commits.

## 11. Deploy and operations

| Area | State on `experimental` | Gap |
|---|---|---|
| Hosting | Vercel, production from `main` (`0dfd363`). HTTPS, HSTS | Plan suspected Hobby (L12) |
| Migrations | Production builds only (`package.json:10`); 2 new migrations, both safe to roll back past | M2 drop ships in the same release; Preview DB still shared (owner) |
| Crons | 3 daily (`vercel.json`) | `CRON_SECRET` reportedly unset, so nothing runs; `/rates` empty live |
| Health | `GET /api/health`: DB, banks with rates, data ages; 503 on DB down | No config presence (M6); stale data still returns 200 |
| Smoke | `smoke.yml` on every successful deployment | Never run; GETs only; needs a bypass secret if preview protection is on |
| Monitoring | None | No uptime monitor, error tracker or alert on a stopped cron |
| Backups | Not documented | Neon restore window unknown and untested |
| Rollback | Vercel instant rollback | Unsafe after the column drop (M2) |
| Branch flow | Rule: `experimental` → QA report → `main` | 55 unpushed commits and no QA report. `judge.md` "Update 1" misstates where the code is. Branch protection unverified |
| GitHub Pages | Still serves the repo root, including `tools/` with obsolete tax maths | Owner switch |
| SEO plumbing | Share cards added | `robots.txt`, `sitemap.xml`, canonical all missing |

**The experimental-to-main flow, in order:**
1. Owner sets `SESSION_SECRET` (and never changes it), `CRON_SECRET`, `ADMIN_SECRET` and `NEXT_PUBLIC_APP_URL`, and gives Preview its own Neon branch.
2. Owner checks the production `TaxProfile` columns and decides M2.
3. Agent fixes M1-M6 on `experimental`.
4. Push `experimental` and let CI run e2e.
5. A QA pass on a preview deploy with the 375/768/1280 tiles, including `/rates` with data after one admin scrape and one tracker save.
6. Write the QA report. Merge. Watch the smoke run. Run one scrape. Paste two URLs into the Facebook Sharing Debugger.

That is about half a day of owner time and a day of agent time.

## 12. Legal and compliance

- **Estimate framing:** good, and consistent across the calculator, slip and terms.
- **Privacy and terms:** now exist in Bangla and English (`components/legal/LegalPages.tsx`).
  - The privacy page names what is stored, where (US), the processors (Vercel, Neon, Resend, WhatsApp, GoatCounter, YouTube), the retention and how to delete.
  - The terms disclaim advice and say rankings are arithmetic.
  - Nobody qualified has reviewed either.
- **Operator identity:** still missing. No person or company name, no address or email, only a public GitHub issues link. A money site that collects financial data needs a named operator and a private contact for data requests.
- **Personal data law:** the Personal Data Protection Ordinance was issued on 6 Nov 2025 and amended on 5 Feb 2026 (Daily Sun). One secondary source says the new Parliament repealed it and passed a Personal Data Protection Act 2026 (Act No. 63) in April 2026 (Securiti, 29 Jun 2026). I could not confirm this from the gazette or find the commencement dates. Either way, consent with a stated purpose, retention and withdrawal, plus rules on cross-border transfer, are coming. Today's tracker stores financial data in the US on an implied-consent first save. Ask counsel which instrument is in force and when its duties start.
- **Cross-border transfer:** the functions run in the US, and Neon's region is unconfirmed. The privacy page discloses US processing, and consent at the moment of the first tracker save would be stronger.
- **Advice versus maths:** `/reinvest` now says "fixed formula, not AI, not investment advice", and the scorecard says "not a verdict". `/instruments` and `/reinvest` still rank categories. Get counsel's one-page opinion before promoting `/reinvest`.
- **Scraping:** bank rate pages and annual reports are public, with attribution and dates shown. Bangladesh Bank's bank-wise deposit-rate table would avoid most terms-of-use questions and cover every bank.
- **Deposit insurance:** the scorecard now cites the "Deposit Protection Ordinance 2025", with ৳2 lakh per depositor per bank (`rate-monitoring.ts`), which fixes yesterday's doubtful "Act 2026" name.

## 13. Market, demand and marketability

**Demand is real, and it is moving earlier.**
- About 4.7 million e-returns were filed for tax year 2025-26 (BSS, 22 Jul 2026), against about 13 million TIN holders.
- For tax year 2026-27, 12.53 lakh returns were filed in July-September alone. That is up 77%, and about 3 lakh claimed the new early-filing rebate (TBS, 9 Oct 2026).
- The rest of the crowd now has until 31 December to avoid extra tax.
- So the next ten weeks are the window. After January the question changes from "how much do I owe" to "how much extra do I owe".

**Competitors.**

| Alternative | What it offers | Note |
|---|---|---|
| NBR e-return portal (etaxnbr.gov.bd) | Free; computes the admissible rebate and the tax due while you file; mandatory for most individuals | The default. It answers "what do I owe" at filing time, not "what should I do before June" |
| BDTax (site and app) | Tax from an uploaded salary certificate, a rebate optimiser and paid filing help; claims 80k users (May 2025) | The strongest paid rival. Current prices not found |
| bdtaxguide.com, ekushwml.com, rebat.vercel.app, tool.teamzlab.com | Free calculators, some already on AY 2026-27 | Easy to build. ayakor.com still uses 15% / ৳10L; TaxBracketCalc is still on the old ৳3.5L threshold |
| LegalSeba | Calculator feeding paid filing | Its guide is for AY 2025-26 |
| FDR comparison | No dedicated site found. Bangladesh Bank's bank-wise 6-month FDR table is republished on BRAC Bank's base-rate page (May 2026: 7.75-12%, average 9.46%) | A real gap, and the source TakaTalks should use |
| bKash savings | IDLC DPS for about 5 years; EBL FDR since late Jul 2026; IDLC FDR since Aug 2026, ৳10k-1L for 6 or 12 months | Where small savers actually act. A comparison that includes these in-app products would be useful |
| Bangla finance YouTube and Facebook | Large channels (several 100K-800K subscribers, per the baseline) making FDR-vs-Sanchayapatra and tax videos | They have the audience and no tool. TakaTalks has the tool and no audience |
| Tax consultants | Paid filing from about ৳10,000 (baseline) | Not a rival for estimates; a referral partner |

**TakaTalks' own reach.** The channel `@TakaTalksYT` still has **7 subscribers and 3 videos**, posted about three weeks ago. Two of them show 49 and 55 views (YouTube page, read 15 Oct 2026). GoatCounter is live on production, but no figures are public and the new calculator events are not deployed. There is still no evidence of a single user.

**Who pays.** Nobody yet, and nothing has been tested. In order of plausibility:
1. **Referral to filing help** (BDTax, LegalSeba, practitioners) at the end of an estimate, timed for November-December.
2. **A white-label or embeddable calculator** for the large creators and for HR and payroll teams. Note that the new `frame-ancestors 'self'` header blocks embedding, so this needs its own route.
3. **Clearly labelled sponsorship** from non-bank brands. Bank sponsorship would clash with the no-verdict rule on `/rates`.

**Why would someone switch?** The portal tells you what you owe while you file. TakaTalks can tell you, in Bangla, before you file:
- why you owe that amount;
- how much to invest by June to owe less;
- what Sanchayapatra versus FDR really pays after slab tax, at today's rates.

That niche is real and empty. It only works if the numbers are right (they now mostly are on `experimental`, apart from M1 and M4) and if people see it (they do not).

**Distribution.** The video-first plan has not produced an audience: 7 subscribers in three weeks. The cheaper route is to borrow audiences:
- Offer the calculator, with correct AY 2026-27 rules and the December deadline, to two or three established Bangla finance creators.
- Post short "how much tax on ৳X salary" clips that link a pre-filled calculator, using the fragment links from L4.

**Website claims versus reality** (on `experimental`):

| Claim | Reality |
|---|---|
| "Calculators run in your browser and keep what you type on your device" (`ToolTabs.tsx:33-34`, `page.tsx:13-14`) | True for typing. A shared link puts the figures in a URL the server sees (L4) |
| "আয়বর্ষ ২০২৫-২৬ (করবর্ষ ২০২৬-২৭) অনুযায়ী" (`tools.ts:83`) | True |
| "যাচাইযোগ্য আনুমানিক হিসাব" ("verifiable estimate", homepage hero) | The page shows no source for the tax rules (section 5). Add one line and the claim holds |
| `/instruments`: rates "stripped of withholding tax" give the real yield | False for Sanchayapatra after 1 Jul 2026 (M1) |
| README: `tools/` v3 is "the reference version" | Obsolete tax rules, served on GitHub Pages |
| Judge: "PASSED (PERFECT)" | Means tsc, lint and tests passed |

**On production today**, yesterday's table still holds word for word: "data never leaves the device" is false, the tax maths is out of date and the year label is wrong.

**Market sources** (read 15 Oct 2026):
- TBS, 9 Oct 2026, July-September filings up 77%: https://www.tbsnews.net/nbr/tax-filings-jump-77-early-rebate-drives-returns-1567086
- BSS, 22 Jul 2026, e-return launch and last year's count: https://www.bssnews.net/news/407877
- Daily Star, 29 Sep 2025, e-return step-by-step (the portal computes the rebate): https://www.thedailystar.net/business/news/how-file-income-tax-return-online-step-step-guideline-3997576
- Dhaka Tribune, Aug 2026, IDLC FDR on bKash: https://www.dhakatribune.com/business/417527/customers-can-now-open-idlc-fdr-instantly-through
- BRAC Bank base-rate page (Bangladesh Bank FDR table): https://www.bracbank.com/en/page/brac-bank-base-rate-for-retail-loan-home-loan-auto-loan-personal-loan
- Securiti, 29 Jun 2026, Personal Data Protection Act 2026 overview: https://securiti.ai/bangladesh-personal-data-protection-act-overview/
- TakaTalks channel, read directly: https://www.youtube.com/@TakaTalksYT
- BDTax, LegalSeba and the free calculators were checked on their own sites during this review. Competitor install counts and creator subscriber counts are from the 14 Oct critique and were not re-read.

## 14. GTM % breakdown

| Dimension (weight) | Oct 14 | **Oct 15 (experimental)** | One line |
|---|---|---|---|
| Product works end to end (25) | 3 | **5** | The income-tax engine, optimizer, salary and freelance tools are right by every source I found, and Bangla input works. Sanchayapatra after-tax yields are wrong for new money (M1), and the filing window is missing (M4). Rates, bank health, reminders and cross-device recovery still produce nothing until the owner sets secrets and email |
| Quality and verification (15) | 4 | **5** | 408 unit and 68 e2e tests, a clean `check.sh`, real boundary tests. But no test comes from a primary source, the new DB code has not run on Postgres, there is no QA report and no human review |
| Security and privacy (15) | 4 | **6** | Fixation closed, hashed tokens, rate limits, headers, delete-my-data. Open: a permanent identical cookie, session key rotation that destroys data, Preview reaching production data, public-repo exposures |
| Legal and compliance (10) | 2 | **3** | Honest privacy and terms pages. No named operator or private contact, no counsel review, US processing under a coming data-protection law, and the advice question is open |
| Market validation (15) | 1 | **1** | Still 7 subscribers and 3 videos, no measured users, no revenue, and free calculators multiplying. The demand is real (12.5 lakh early filers), but none of it reaches this site |
| Deploy and operations (10) | 3 | **4** | Migration gate, health probe, smoke workflow, CI. Not pushed, not run, no monitor, backups unknown, rollback unsafe (M2), secrets missing |
| Claims honesty (10) | 3 | **6** | Homepage, tool cards, `/privacy` and the year label now tell the truth. Left: "PASSED (PERFECT)", a README that calls obsolete demos "the reference", a stale `judge.md`, self-computed "worked examples", `/privacy` vs shared-link URLs, and `/instruments` "real yield" for Sanchayapatra (M1) |

**Weighted (experimental):** (5×25 + 5×15 + 6×15 + 3×10 + 1×15 + 4×10 + 6×10) / 10 = **43.5**.

**Cap: 40.**
- **Reason:** what scores 43.5 is unproven where it counts. None of the 55 commits has run against Postgres or in CI, the repo's own QA-report gate has not been met, and the config every write depends on is missing. A tool that may fail on its first save (M5, M6), or roll back into a broken schema (M2), should not be promoted in the filing peak.
- **To lift it to the weighted score:** CI green with e2e on these commits, a QA report, the owner's secrets and Preview DB done, and M1-M6 fixed.
- **To pass 50:** real filers using it, measured. A market-validation score of 1 out of 10 holds the ceiling down more than any code.

**Final: 40% for `experimental`. Production today: 25%** (the Oct 14 scores and the cap still apply to `0dfd363`).

**Where I disagree with others.**
- **`judge.md` Update 1:**
  - Its "where the code is" paragraph is wrong now: the fixes are on `experimental`, just not pushed.
  - It says GoatCounter's production status is unknown. The live homepage loads `gc.zgo.at/count.js`, and the owner's checklist says it is set.
  - It counts B8, B12 and B24 as fixed without noting M1, M3 and L7.
  - It does not mention that M2 breaks the rule it just wrote.
- **The commit messages** are accurate about what each commit does. "Bring the tax rules in line with the Finance Act 2026" overstates the certainty: every source is secondary, several values carry `owner-confirm`, and the Sanchayapatra source tax was left on the old rule (M1).
- **The scorecard's "about 40 once fixed"** was right. I land there too, but for a different reason: the code is fixed, and verification and config are not.

## 15. What to cut or stop doing

1. **Stop adding features.** Fix M1-M6, then freeze the code until the owner steps, QA and the merge are done. Fifty-five commits already sit unpushed. Each new one raises the QA burden and the merge risk, and the filing peak is close.
2. **Stop shipping manual seed FDR rates.** Either drop the three seeds or gate on scraped data only (M3). Better still, replace all of it with Bangladesh Bank's monthly bank-wise table.
3. **Stop calling self-computed tests "worked examples".** Rename them "boundary tests". Reserve "worked example" for a practitioner's or NBR's numbers.
4. **Stop printing "PASSED (PERFECT)".** Make the judge say "checks passed", or delete it and rely on `check.sh` and CI.
5. **Remove from the public repo:** `todo/my-work/formenow.md` (a list of unset secrets), `todo/New works/` voice notes, `docs/critique*.md`, `stuff/`, `Published stuff/`, and `tools/` v1-v4. Then turn off GitHub Pages and fix the README that still calls `tools/` v3 the reference.
6. **Keep the side tools frozen under "More".** No new tool until the calculator has users.
7. **Stop letting `judge.md` drift.** Update it in the same change that moves code between branches.

## 16. Top 10 next actions

Ordered by value. Actions 1-4 belong before 1 November.

| # | Action | Effort | Who |
|---|---|---|---|
| 1 | Set `SESSION_SECRET` (permanent, never rotated without a previous-key slot), `CRON_SECRET`, `ADMIN_SECRET` and `NEXT_PUBLIC_APP_URL`. Give Preview its own Neon branch | 30 min | Owner |
| 2 | Check the production `TaxProfile` columns. If `firstTimeFiler` still exists, hold the drop migration one release (M2) | 30 min | Owner checks; agent moves the migration |
| 3 | Fix M1 (Sanchayapatra: 10% withheld, final tax at slab, slab picker), M4 (31 Dec deadline and the Jan-Jun extra tax on the result and slip, plus a hold-to-maturity warning in the optimizer), M3 (gate on scraped rates, stale-flag or delete manual seeds), M5 (drop the `ADMIN_SECRET` fallback) and M6 (config flags in `/api/health`, smoke fails without a session key). Add one "rules: Finance Act 2026, checked <date>" line under every tax result | 1 day | Agent |
| 4 | Push `experimental`, get CI and e2e green, run a QA pass on a preview (viewport tiles, one admin scrape, `/rates` with data, a tracker save), write the QA report, merge | 1 day | Agent runs QA; owner merges |
| 5 | Have a tax practitioner confirm the five open `owner-confirm` values (section 5) and supply 5 worked cases (salaried, woman, first return, investor at the cap, surcharge). Replace the self-computed "worked examples" with theirs | 2 h of practitioner time | Owner arranges; agent encodes |
| 6 | Distribution for November-December: offer the calculator to 2-3 established Bangla finance creators, and post 4-6 short "tax on ৳X salary" clips linking pre-filled calculators (fragment links, L4) with working share cards | 2-3 weeks | Owner (content and outreach); agent builds the links and an embed route with its own `frame-ancestors` rule |
| 7 | Add an uptime monitor on `/api/health` (JSON check of `dbReachable` and rate age), an error tracker, and a tested Neon restore | 2 h | Owner (accounts); agent writes the runbook |
| 8 | Publish a named operator and a private contact email on `/privacy` and `/terms`; get a one-page legal review of both, of `/reinvest`, and of which data-protection law is in force | 1 day elapsed | Owner and counsel |
| 9 | Replace the three scrapers and the manual seeds with Bangladesh Bank's monthly bank-wise FDR table, entered by the admin or parsed, with its date | 4 h | Agent; owner approves the source |
| 10 | Clean the public repo (section 15, item 5), turn off GitHub Pages, enable branch protection on `main`, add `robots.txt` and `sitemap.xml`. In January, read the GoatCounter events and decide whether the tax niche earns more work | 2 h, then a review | Agent cleans; owner switches settings and decides |
