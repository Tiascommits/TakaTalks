# TakaTalks: judge log

Gaps, status and next steps. Newest section last; read it first.

Baseline: the independent critique of 14 Oct 2026 (`CrtiQue_Oct14.md`, untracked, in the owner's checkout) put go-to-market readiness at **25%**. It was capped because the tax calculator gave wrong numbers for the current tax year. Production then ran `main` at `0dfd363` (7 Oct).

### Update 1 (2026-10-15): state after the round-1 fixes

**Where the code is:** the round-1 fixes are merged at `7ca7227`, 35 commits ahead of `experimental` (`d19d1fc`). They are not on `experimental` and not deployed. Production still serves the 7 Oct code: on 2026-10-15, `/privacy` and `/terms` returned 404 on www.takatalks.com.

**Fixed in round 1 (critique item in brackets):**
- Tax: the rules now follow the Finance Act 2026, so the 5% slab is gone, minimum tax is flat and the first-filer option is back. The year is labelled income year 2025-26, AY 2026-27 [B1, B2]. Optimizer savings are capped at the minimum-tax floor [B3]. `/salary` and `/freelance` now call the `/calculator` engine [B17].
- Outside numbers: Sanchayapatra rates are current, with the ৳7.5 lakh holding split. Zakat metal prices are dated and must be confirmed before use. Loan figures and excise bands are dated. Numeric inputs accept Bangla digits [B8, B10, B14].
- Rates: `/rates` reads only the newest snapshot per bank and term. It taxes FDR interest at the bank's source-tax rate, and it stays hidden behind an honest empty state until a bank has data. Manual seed rates are dated by their source. Every due bank's annual report is checked within a week [B5 partly, B12, B13, B20, B24].
- Security: the account-fixation path is closed. The admin session cookie is hardened. Postgres rate limits cover tracker saves, login links and admin login. The cron secret is compared in constant time. Security headers are on, an Account page lets people delete their data, and each maturity reminder is sent once [B6, B15, B16, B21].
- Deploy: `prisma migrate deploy` runs only on production builds [B4, partly: Preview still needs its own database].
- Claims and legal: the homepage, tool cards and READMEs now claim only what is true. A privacy notice and terms are linked from a site footer [action 6].

**Done in round 2 on `fix/taka-ops-oct15` (ops, template, share cards, demand):**
- Workspace template: `AGENTS.md`, `CODING_STANDARDS.md`, this file and `scripts/check.sh` (`--fast` too).
- `GET /api/health`: reports whether the database is reachable, the number of banks with FDR rates, and the age in hours of the newest rate snapshot and bank-health check. It returns 503 when the DB is down and has a unit test.
- `web/scripts/smoke.mjs <url>` GETs 13 pages, `/api/health` and the share image. It fails on a non-200 or a missing title or `og:image` tag, and warns when no bank has a rate. `.github/workflows/smoke.yml` runs it on every successful Vercel deploy.
- Share cards: `metadataBase` is https://www.takatalks.com, every page has `og:` and `twitter:` title, description and image, and the 1200x630 card is drawn from `public/logo-mark.png`. `/calculator`, `/rates` and `/tracker` got the descriptions they lacked.
- Demand signals: GoatCounter events `tax-calculate` (a result first shows income) and `tax-optimizer-shown`, plus a "Feedback?" footer link to the GitHub issues page.
- Another agent worked on page bodies, UX and the remaining bugs in parallel, on a separate branch. That work is not covered here.

**Checks:** `scripts/check.sh` exits 0: typecheck, lint, stray files, unsafe HTML, 389 unit tests in 39 files, and the build. The smoke script was run against a local `next start` with no database: 13 of 15 checks passed, and `/rates` (500) and `/api/health` (503) failed as expected. It was also run against production: all 15 failed, as expected for the 7 Oct code, and every title matched.
**Not verified:** e2e was not run locally (no Postgres, and the reset is destructive). The smoke workflow has never run on GitHub. No share card has been checked in Facebook's Sharing Debugger or WhatsApp. It is unknown whether `NEXT_PUBLIC_GOATCOUNTER_CODE` is set in production; without it, the events do nothing.

**Open, owner:**
- In Vercel, set `CRON_SECRET`, `SESSION_SECRET`, `ADMIN_SECRET` and `NEXT_PUBLIC_APP_URL`, and give Preview its own `DATABASE_URL`.
- Check whether the 8 Oct preview dropped production's `TaxProfile.firstTimeFiler` column [B4].
- Run one scrape and create the admin account.
- Have a tax practitioner confirm the `owner-confirm:` comments in `web/src/config/tax-rules-2025-26.ts`, `web/src/lib/instruments/instruments.ts` and `web/src/lib/loans/loans.ts`, and the zakat prices in `web/src/lib/zakat/zakat.ts`.
- Publish an operator name and contact.
- Get a legal review of `/privacy` and `/terms`.
- Confirm the Neon database region.
- Turn off GitHub Pages: it serves the stale `tools/` demos with obsolete tax rules.
- Turn on branch protection for `main`.
- The `experimental`-to-`main` merge needs a written QA report.
- If Vercel Deployment Protection guards preview URLs, add a `VERCEL_AUTOMATION_BYPASS_SECRET` repo secret so the smoke workflow gets past it.
- `/privacy` says GoatCounter counts page views. It should also mention the anonymous events (viz share/download, `tax-calculate`, `tax-optimizer-shown`). This is a page-body edit for the other agent or the owner.

**Next, in order:**
1. Owner: secrets, a Preview database and the `firstTimeFiler` check. These block every page that writes.
2. Merge round 1 and round 2 into `experimental`, run CI with e2e, write the QA report and merge to `main`. Production still gives wrong tax figures, and the November-December filing peak is close.
3. After that deploy: confirm the smoke workflow ran green, paste `/` and `/calculator` into Facebook's Sharing Debugger, and add an uptime monitor on `/api/health`. A plain monitor catches the 503. Staleness (`rateSnapshotAgeHours` over 48) needs a monitor that reads JSON.
4. Add `robots.txt`, `sitemap.xml` and canonical URLs; the critique found all three missing.
5. Rates: switch the source to Bangladesh Bank's all-bank table instead of three fragile per-bank scrapers (critique section 15).
6. In January, read the GoatCounter events and decide whether the tax niche earns more work (critique action 10).

**Score:** not re-scored. Round 1 removes the cause of the 25% cap on this branch, but none of it is in production yet.

### Update 2 (2026-10-15, agent round)

**Done:**
- Merge: there was nothing left to merge. Round 1 (`7ca7227`), round 2 (`5e3134c`) and the sweep (`b1ad596`) were already on `experimental`, and no branch holds commits that `experimental` lacks. The owner's PR #7 (`d3b29d8`) took `experimental` up to `e294460` into `main`, and production serves it: `/privacy` returns 200, and `/api/health` returns 200 with `banksWithFdrRates: 0`.
- QA report for the 7 commits still missing from `main`: `docs/qa-report-2026-10-15-experimental.md`. It finds no migrations and recommends the merge from a QA standpoint. The merge itself is the owner's call.
- SEO (`6981ce8`): `robots.txt` blocks `/admin`, `/api/` and `/account`. `sitemap.xml` lists the public pages and each `/viz/<slug>`, and adds `/rates` once it has data. Every page gets a canonical URL through `alternates.canonical: "./"`. `SITE_URL` now lives in `web/src/config/site.ts`, and the smoke test checks all three.
- `/privacy` (`cdff5e0`) now lists the visualizer events (download, share, link copy, print) next to the tax events.

**Checks:** `scripts/check.sh` exits 0 (559 unit tests in 42 files, plus the build). GitHub CI on `cdff5e0` passed, including 77 e2e tests. A local `next start` served the right robots, sitemap and canonical tags. Smoke on production passed 14 of 17 checks; the 3 failures are the new checks, which `main` does not have yet.

**Not verified:** e2e did not run locally (no Postgres, and it needs the owner's sign-off), but CI ran it. No one has checked Search Console or the Facebook Sharing Debugger. The per-user rate limits have not been tested under load.

**Still open (owner):**
- Merge `experimental` into `main`.
- The Vercel secrets and a Preview database.
- A `VERCEL_AUTOMATION_BYPASS_SECRET` repo secret: the smoke workflow fails 15 of 15 checks on every preview deploy, which looks like the Deployment Protection page.
- Submit the sitemap in Search Console after the deploy.
- The rest of Update 1's owner list.
- Next for agents: item 5 (Bangladesh Bank's all-bank rate table).

### Update 3 (2026-10-16, agent round): rates from Bangladesh Bank's chart

**Done (Update 1, next item 5):** the rate source is now Bangladesh Bank's monthly "Announced Interest Rate Chart of the Scheduled Banks (Deposit Rate)" (`BB_DEPOSIT_CHART_URL` in `web/src/config/rate-monitoring.ts`): one server-rendered HTML table, 61 banks, five fixed-deposit tenors. `adapters/bb-chart.ts` downloads it once per run and gives each bank its own adapter reading its row, so a missing row fails only that bank.
- Mapped by hand against the September 2026 chart: AB, One, National (NBL), City, IFIC, Sonali, EBL. The AB, National and IFIC per-bank scrapers and the One and City seeds are deleted. Not mapped: Midland (the chart's "MDBL" is unconfirmed; stays on its seed) and Standard Chartered (its real 0.05% lower bounds fail the 1% wrong-column floor; stays "not available").
- The chart gives most rates as ranges (City 12 months: 3.60–7.88%). New nullable column `RateSnapshot.ratePctMax` (migration `20261016090000_rate_range`, additive); the scorecard shows rate, interest and after-tax figures as low–high, sorts by the low end, and labels the source "Bangladesh Bank's announced rate chart" with "Chart for September 2026" instead of "Last checked".
- Proof: `scripts/check.sh` exits 0 (566 unit tests, build). New tests: parser (ranges, blanks, moved columns, missing month), adapter (dating, upper end, missing row), one download per run, `runScrape` storing and checking `ratePctMax`. One live run on 2026-10-16 read all 7 banks from bb.org.bd. e2e not run locally (needs Postgres); `rates.spec.ts` still matches (Midland keeps its "Source dated 31 Dec 2025").
- **Still blocks going live (owner):** `CRON_SECRET` in Vercel so the daily scrape runs, then one admin "Run scrape now". The migration applies on the next production build (`prisma migrate deploy`).
- Next for agents: map the other banks in the chart (61) once you decide the scorecard should list them; confirm Midland's code.

- **Review (2026-10-16, agent):** checked the whole diff. Fixed: the chart was parsed eagerly, so one odd cell in any of the 61 rows (or in an untracked 2- or 3-year column) failed all 7 banks; each adapter now parses only its own three cells. Ranges with an en or em dash are accepted. A late failed download could clear a newer cached chart. The implausible-rate error now names the whole range. Deleting the AB, National and IFIC adapters breaks no caller or test, and their stored rows stay in the database. The migration matches the schema change (`prisma migrate diff` against the old schema gives the same one `ADD COLUMN`). Proof: `scripts/check.sh` exits 0 (566 tests, build). The parser read today's live chart: September 2026, 61 banks, all 7 mapped codes found.
  - GitHub CI on `ab42cfc` passed, e2e included. Its `prisma migrate reset` applied the new migration to CI's throwaway Postgres. Not verified: the migration against a real database, and e2e locally. Still open: (1) in a database where the old per-bank scrapers stored rows after 1 Sep 2026 (production has none), those rows outrank the chart's rows, which are dated the 1st of the chart's month, until a newer chart arrives. (2) If Bangladesh Bank revises a month's chart, the two versions get the same date, and the scorecard may show either one. (3) A chart Bangladesh Bank stops updating still shows its month but is not flagged stale. (4) The admin digest compares only the low end of a range.

### Update (2026-10-19, review round)

Re-review of `3f8680a` and `b07cec5` on `experimental`, and of production after the owner's PR #8 (`87f0cac`, deployed to Production 2026-10-18 19:59 UTC). Production was checked with GET requests only.

**Verified fixed:**
- Production now runs **Next 16.4.2**: its client chunk reports `version:"16.4.2"`, and `origin/main:web/package.json` pins `16.4.2`. That closes the RCE (`next/og`) and SSRF advisories that were live on 16.3.4.
- The cron routes no longer crash while loading. Without a secret, `GET /api/cron/rate-scrape` and `/api/cron/bank-health-check` now return 401, where the QA report saw an empty 500. The route imports `pdf-parse/worker`, which imports `@napi-rs/canvas` at the top of the file, so a 401 means the native canvas loads on Vercel's Linux runtime.
- robots.txt, sitemap.xml (27 URLs) and canonical tags are live. `node web/scripts/smoke.mjs https://www.takatalks.com` passes 17 of 17 checks. It still warns that no bank has an FDR rate.

**Partly fixed:** the smoke workflow names its failure clearly now ("redirected to https://vercel.com: Vercel Deployment Protection, VERCEL_AUTOMATION_BYPASS_SECRET not set"), but every run still fails, including the Production one (run 39161264612, 17 of 17).

**Still open:** `/api/health` reports `banksWithFdrRates: 0`, `rateSnapshotAgeHours: null` and `bankHealthCheckAgeHours: null`. Until today the scrape route crashed on load, so this does not yet show whether `CRON_SECRET` is set. The first real test is the 02:30 UTC rate-scrape cron on 19 Oct (08:30 in Dhaka). Preview still shares the production database (QA report item 6). Whether the leaked YouTube key was rotated cannot be checked from outside.

**Bugs found:**
1. Medium: the smoke workflow tests the wrong URL for Production. `smoke.yml` uses `deployment_status.environment_url`, which is the protected per-deploy `taka-talks-<hash>-inovace-growths-projects.vercel.app` address, not www.takatalks.com. So the Production check fails even when the live site is healthy (it passed 17 of 17 by hand on the same day). Fix: when `environment == 'Production'`, run the smoke script against `https://www.takatalks.com`. That needs no secret. Keep the bypass secret for Preview.
2. Medium: GitHub Pages is still on, built from `main` at `/`, and rebuilt on every merge (run 39161197643). It serves the old `tools/tax-calculator/v1-v4` demos under the TakaTalks name: https://tiascommits.github.io/TakaTalks/tools/tax-calculator/v1-simple-slab-calculator.html returns 200. These demos are no longer maintained: v4 still counts mutual funds inside the ৳5 lakh Sanchayapatra cap, which the app dropped for the Finance Act 2026, and it has no ৳1,000 minimum tax for first-time filers. It also renders `judge.md` and `todo/my-work/formenow.md`, which lists the unset secrets and the shared Preview database, as indexable pages.
3. Low: the `pdf-parse` fix is proven only at module load. No PDF has been extracted on Vercel, and that cannot happen until `CRON_SECRET` is set. The trace (`@napi-rs/canvas` about 25 MB, pdfjs, Prisma) stays well under Vercel's 250 MB function limit.

**Gaps, ranked:**
1. High (ops): live data is still empty. Rates, bank health and reminders depend on `CRON_SECRET`, and tracker saves depend on `SESSION_SECRET` or `ADMIN_SECRET`. Neither can be checked from outside.
2. High (security): Preview shares the production database (`todo/my-work/formenow.md`). Every `experimental` push deploys code that can write to production, and Preview never runs migrations.
3. High (marketability and profitability): there is no revenue model and no demand evidence, and the 30 Nov filing deadline is six weeks away.
4. High (ux and legal): no operator is named and there is no private contact. `/privacy` offers only the public GitHub issues page.
5. Medium (accuracy): 13 `owner-confirm:` markers remain (tax rules 4, instruments 6, loans 2, inflation 1), and no tax practitioner has signed off. The calculator shows no 30 Nov deadline, no late-filing extra tax and no link to etaxnbr.gov.bd (`TrustBanner.tsx:24` is bold text, not a link).
6. Medium (ops): the post-deploy smoke check is red on every deploy (bug 1), and no uptime monitor reads `/api/health`.
7. Medium (legal and claims): the stale GitHub Pages demos and the public ops documents (bug 2).
8. Medium (security): the tracker cookie is a permanent bearer token that cannot be revoked, and the session key falls back to `ADMIN_SECRET` (`web/src/lib/tracker/session.ts:17`).
9. Medium (usability): functions run in `iad1` (US East) for Bangladeshi users (`x-vercel-id: bom1::iad1`).
10. Low (ops): CI has no `npm audit`. Today it reports 4 high advisories, all in build-time packages (`prisma` CLI → `deepmerge-ts`, and `source-map-js`) and not reachable at runtime. The Next RCE was found by hand.

**Next, in order:**
1. Owner, today: in Vercel, set `CRON_SECRET`, `SESSION_SECRET`, `ADMIN_SECRET` and `NEXT_PUBLIC_APP_URL` for Production, and give Preview its own Neon branch for `DATABASE_URL`. Redeploy, then run one scrape. `/api/health` should show `banksWithFdrRates` above 0.
2. Agent: in `smoke.yml`, smoke `https://www.takatalks.com` on Production deploys. Owner: add `VERCEL_AUTOMATION_BYPASS_SECRET` for Preview.
3. Owner: turn off GitHub Pages (Settings → Pages → None), or delete `tools/tax-calculator/`. Move `todo/my-work/formenow.md` and the critiques out of the public repo.
4. Agent, before 30 Nov: add the filing deadline, the late-filing extra tax and a link to etaxnbr.gov.bd to the result. Owner: get a practitioner to clear the `owner-confirm:` markers.
5. Owner: publish an operator name and a private contact email on `/privacy`, `/terms` and the footer.
6. Agent: after the first cron run, read `/api/health` (`bankHealthCheckAgeHours`) and the Vercel function log for the first PDF extraction. Add `npm audit --omit=dev --audit-level=critical` to CI.

**Score:** security goes from 5 to 6, because the critical and high Next advisories are fixed in production. Usability 5, UI 6, UX 5, marketability 3 and profitability 2 are unchanged: what users see in production has not changed. Go-to-market stays at 40 (weighted 43.5, capped at 40). The cap holds because the live-data features are still empty in production, the tax figures have no practitioner sign-off ahead of the filing season, and no operator is named.

### Update (2026-10-22, agent round): Bangladesh Bank chart on a real database

Closes the 2026-10-18 open item: the chart changes had never run against a real database or through e2e. Everything ran locally against a throwaway Postgres 16 (docker, port 56543, data dir in the session scratchpad, removed afterwards). Neither production, Vercel nor `web/.env` was used: every run set its own throwaway `DATABASE_URL`, `TEST_DATABASE_URL` and secrets.

**What ran:**
- Migrations from scratch: `prisma migrate deploy` applied all 9, including `20261016090000_rate_range` (`ratePctMax` is a nullable `double precision`). `prisma migrate diff` from the migrated database to `schema.prisma` reports no difference.
- Live ingest: `next start` on the local database, then `GET /api/cron/rate-scrape` with the cron secret. That read today's bb.org.bd chart (still September 2026, 61 banks): 8 of 8 adapters succeeded (the 7 chart banks and Midland's seed), SCB was skipped, 24 snapshot rows were stored, and `/rates` showed every range with "Chart for September 2026". Without the secret the route returns 401.
- Saved copy (kept in the scratchpad): ingesting it again stored no new rows. A revised same-month copy (AB 12 months 12.00 → 11.50, City 12 months 3.60–7.88 → 3.60–8.50) stored 2 rows with the same date. `/rates` showed the revised figures (tiebreak OK), and the admin digest listed both changes, City's from the high end alone (range digest OK). Re-ingesting the original copy stored A again and `/rates` showed it (the A, B, A case).
- Older scraper row: an IFIC 12-month 6.00% row dated 20 Sep, from another source. `/rates` still showed the chart's 8.50–9.00% (chart outranks).
- 62-day flag: Sonali's chart rows were re-dated to 1 Aug, which is 82 days old, and `/rates` showed "Chart for August 2026 — unverified since 01 Aug 2026". EBL's rows at 61.8 days were not flagged.
- e2e: Playwright passed 75 of 77 on a fresh database, all 3 `rates.spec.ts` tests included (the admin scrape read the live chart). Prisma refuses to let an agent run `migrate reset` from `e2e/global-setup.ts` without the owner's consent. So I ran the suite with a scratch config that drops `globalSetup`, against a newly created, empty database migrated with `migrate deploy`. The 2 failures are flaky tests outside the rates code (the next run failed different tests); see below.

**Bugs found and fixed (with tests):**
1. Medium (ops): `/api/health` `rateSnapshotAgeHours` read the newest snapshot's date. A chart row carries the chart's month (the 1st) and is stored once, so right after a good scrape it read 1208.9 hours. The planned "over 48 hours" monitor would alarm all the time and could not tell when the cron stops. It now reads the last successful `ScrapeLog` (`web/src/app/api/health/route.ts:24`, test `route.test.ts:39`). Against the real database it reads 0.1 hours after a scrape.
2. Low: the admin digest compared rows by date only, across sources. With the older IFIC row it reported "8.50–9.00% → 6.00% (-3.00pp)", which contradicts `/rates`. It now ranks chart rows first, as `getCurrentFdrRates` does (`web/src/lib/rates/digest.ts:92`, with `source` passed at `:140`; test `digest.test.ts:101`). On the real database it reads "6.00% → 8.50–9.00% (+3.00pp)". Production has no such rows.

**Checks:** `scripts/check.sh` exits 0 (571 unit tests in 43 files, plus the build).

**Not bugs, noted:**
- Flaky e2e: `tools.spec.ts:171` (habits reload) counts the remove buttons before the list renders, gets 0 and then expects -1. It failed with 1 worker too. `calculator.spec.ts:27` and `:90` failed once each under full parallel load and passed when rerun. CI retries once, which hides these.
- Two servers that share one `.next` share `next start`'s on-disk route cache (`.next/server/route-cache/`). After one server's scrape revalidated `/`, a second server on an empty database showed the rates card. This came from my local setup and cannot happen on Vercel, where each deploy has its own cache.
- The digest flags a month-over-month chart change on every daily run until the next chart arrives. The rows are monthly now, so this is expected, but the label still says "day-over-day" (`SIGNIFICANT_CHANGE_THRESHOLD_PCT` comment).
- "unverified since 01 Aug 2026" on an overdue chart repeats the chart month. It is accurate, but "next chart overdue" would read better.

**Not verified:** the migration on Neon or production. A real second chart month (October's is not out yet). A real same-month revision from Bangladesh Bank. The e2e `migrate reset` path (the owner must consent to it, or CI must run it).

### Update (2026-10-22, agent round 2): smoke URL, audit, filing date, flaky e2e

**Production, GET only (2026-10-21 21:14 UTC):** `/api/health` returns 200 with `{"dbReachable":true,"banksWithFdrRates":8,"rateSnapshotAgeHours":1209.2,"bankHealthCheckAgeHours":16.8}`. The daily crons now run (so `CRON_SECRET` is set): 8 banks have FDR rates, and a bank-health check ran 17 hours ago. The 1209.2 is the September chart's age, the bug fixed in `a45ce31`; it reads hours since the last successful scrape once that ships. `node web/scripts/smoke.mjs https://www.takatalks.com` passes 17 of 17.

**Done:**
- Smoke workflow (`.github/workflows/smoke.yml`, Update 2026-10-19 next item 2): on Production deploys it smokes `https://www.takatalks.com` instead of the protected `*.vercel.app` `environment_url`. On Preview it runs only when `VERCEL_AUTOMATION_BYPASS_SECRET` is set; otherwise it skips with a notice instead of failing. Both branches were run locally. Not yet seen on GitHub. Risk: if Vercel reports success before the domain points at the new build, Production smokes the previous build.
- CI (`ci.yml`): `npm audit --omit=dev --audit-level=critical` after `npm ci`. It passes locally: 0 critical; the 4 highs are build-time (`prisma` → `deepmerge-ts`, `source-map-js`).
- Filing date and portal link (next item 4): the tax result now ends with "File at etaxnbr.gov.bd by 31 December 2026 to avoid additional tax. First-time filers have until 30 June.", with a real link. `TrustBanner` links etaxnbr.gov.bd on all 8 tool pages. The Bangla copy is machine-written: "অতিরিক্ত কর এড়াতে ৩১ ডিসেম্বর, ২০২৬-এর মধ্যে etaxnbr.gov.bd-তে রিটার্ন দাখিল করুন। প্রথমবারের দাখিলকারীদের সময় ৩০ জুন পর্যন্ত।" A native speaker should check it. The date is `TAX_RULES.returnNoExtraTaxBy` in `web/src/config/tax-rules-2025-26.ts`, with an `owner-confirm:` marker (now 14). No late-filing amount is shown.
  - **Owner, decide: 31 Dec, not 30 Nov.** The plan said 30 Nov, the old "tax day". KPMG "Bangladesh Tax 2026" p45 and PwC's Tax administration page (reviewed 31 Jul 2026) both describe Finance Act 2026 windows: credit 1 Jul–30 Sep, no credit and no additional tax 1 Oct–31 Dec, additional tax from 1 Jan, first-time filers by 30 June. One LinkedIn post still says 30 Nov. No gazette was read. A practitioner should confirm the date before the filing peak.
- Flaky e2e, cause found: an action straight after `page.goto` ran before React hydrated. In the failure snapshot the typed income field is empty and the result still shows its placeholder: hydration had wiped the value. The habits test also counted the buttons before the list showed. The new `web/e2e/hydrated.ts` (`gotoHydrated`) waits until every input, select and button is hydrated. It is used for every `/calculator` test and both habits tests. 15 repeats of each of those tests: 225 of 225 passed, where about 1 in 15 failed before. Other spec files still use plain `goto` and could flake the same way.
- The digest threshold comment no longer says "day-over-day".

**Checks:** `scripts/check.sh` exits 0 (571 unit tests, plus the build). `calculator.spec.ts` and `tools.spec.ts` passed 155 of 155 runs (5 repeats). The full e2e suite was not rerun, because it needs a database and `migrate reset` needs the owner's consent.

### Update (2026-10-25, agent round 3): hydration-safe e2e everywhere, overdue-chart label

**Done:**
- Every e2e spec that acts right after `page.goto` now uses `gotoHydrated`: `tools`, `tracker`, `rates` (2 of 3), `account` (2 of 4), `verification` (all 3, including the attacker/victim contexts), `viz` (the theme-button test) and `videos` (2 of 3). Left on plain `goto` because they only read static content: `viz.spec.ts` list and canvas loops, `videos.spec.ts:12`, `rates.spec.ts:16`, `account.spec.ts` lines 13 and 27.
- Overdue chart label: `/rates` now says "— next chart overdue" (Bangla: "— পরবর্তী চার্ট বিলম্বিত") when the chart month is past 62 days, instead of repeating the chart month. `CurrentRateRow` and the DTO gained `chartOverdue`; a rate flagged for a failed or stopped scrape keeps "unverified since <date>". Unit test asserts the flag (`current-rates.test.ts`).

**Checks:** `scripts/check.sh` exits 0 (typecheck, lint, unit tests, build).

**Not run:** e2e. The Docker daemon was not running, and e2e's `migrate reset` needs the owner's consent, so the new `gotoHydrated` calls are untested. Risk: `gotoHydrated` waits for at least one input, select or button on the page, so a page with none would time out; run the suite in CI or against a throwaway database before trusting it. The Bangla label is machine-written; a native speaker should check it.

**2026-10-27 (agent):** Next item 4, late-filing tax: the result now shows the additional tax for filing after 31 Dec (1 Jan–31 Mar 2% of net payable, min ৳3,000; 1 Apr–30 Jun 5%, min ৳5,000), shown only when tax is payable; engine `web/src/lib/tax/late-filing.ts`, tested. Source: NBR "FAQ- e-Return" 2026 Q46(3) and NBR's 22 Jul 2026 press release, which also confirm the 31 Dec date (owner decision above is settled by NBR). The Finance Act 2026 PDF on nbr.gov.bd is in a legacy font and did not extract, so the gazette text is still unread. `owner-confirm:` markers now 15: the first-time-filer "30 June" line (old Act s.2(23)(c), the 2026 FAQ is silent) and what "net payable" means and whether the floor applies at zero. Bangla line machine-written. Next item 6: the CI audit step is in place; it passes locally (0 critical, 5 high, up from 4). The `/api/health` and Vercel log check was skipped (needs production access). `scripts/check.sh` exits 0 (574 unit tests, plus the build).

### Update (2026-10-30, agent round 4): Jev (System One) tasks 1.1–2.2, shadow mode

All Jev code is off unless `TYPESAFE_API_KEY` is set (`web/src/lib/jev/client.ts`, SDK `@typesafe-ai/sdk` 0.7.0), and any API error falls back to the existing heuristic. Per Boundary C in `todo/needs-us-both/system-one-jev-policy-and-gates.md` (still open), everything runs in shadow mode: Jev's answer is recorded, the heuristic still decides. No live Jev call was made in this round (no key).

- Task 1.1, link classification: `classifyReportLinks` in `web/src/lib/bank-health/fetch-reports.ts` labels the heuristic's top 25 PDF links in one `Choice` call; `pickFromClassified` takes the newest audited report at confidence ≥ 0.5. `checkBankForNewReport` logs `[jev-shadow]` to the Vercel log when Jev's pick differs. Unit tests use a stub client. `scripts/check.sh` exits 0 (578 unit tests, plus the build).
