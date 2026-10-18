# QA report: `experimental` → `main`, 2026-10-19

Written by an agent for the owner. The merge is the owner's decision. Nothing here merges anything.

## Where things stand

- `main` (`d3b29d8`, owner PR #7, 15 Oct) is what production serves. It still runs **Next 16.3.4**, which has a critical advisory (RCE in `next/og`) and a high one (SSRF in Image Optimization). On 2026-10-19, production `/api/health` returned `{"dbReachable":true,"banksWithFdrRates":0,"rateSnapshotAgeHours":null,"bankHealthCheckAgeHours":null}`. No scrape and no bank-health check has ever succeeded there.
- On production, `GET /api/cron/rate-scrape` and `GET /api/cron/bank-health-check` return an **empty 500 even without a secret**, while `/api/cron/maturity-reminders` returns 401. The two routes crash while loading, before they check auth. `3f8680a` fixes the cause (see below).
- This report covers the **17 commits on `experimental` that are not on `main`** (`git log origin/main..origin/experimental`, up to `3f8680a`). They touch 96 files, with 1,647 lines added and 483 removed. Most of the bulk is slides, screenshots and docs. **One database migration** is in the set (see Migrations). No branch holds commits that `experimental` lacks.
- The first 7 commits were already reviewed in `docs/qa-report-2026-10-15-experimental.md`, which recommended merging them. They are summarised here, not re-reviewed.

## What changed

| Commit | Change | Risk |
|---|---|---|
| `17bcf5c`, `7c8c851`, `c48fcbd` (merged at `73128d2`), `876c9f3`, `6981ce8`, `cdff5e0` | Already in the 2026-10-15 report: a rebate-optimizer test sweep, tracker saves rate-limited per signed-in user (per-IP backstops), an owner checklist, robots.txt, a sitemap and canonical URLs, and `/privacy` listing the visualizer events. | As in that report: medium for the rate limits (who gets a 429), low for the rest. |
| `050503c` | The 2026-10-15 QA report and judge.md update 2. | None. Documents. |
| `912c479` | A feature slide deck (`slides/`, 35 screenshots). `web/README.md` lists `/habits`, `/freedom`, `/viz`, `/account` and `/api/health`. Old `file://` links in `stuff/` READMEs become relative. | None. Nothing under `web/src` changes. |
| `aff6b53` | New nullable column `RateSnapshot.ratePctMax` (the upper end of a range). `runScrape` stores it and checks it against the plausibility band. | Low. The migration is additive (see Migrations). |
| `dccd59e` | FDR rates now come from Bangladesh Bank's monthly announced-rate chart: one download per run, and each bank's adapter reads only its own row. It covers AB, One, National, City, IFIC, Sonali and EBL. The AB, National and IFIC per-bank scrapers and the One and City seeds are deleted. Midland stays on its seed, and Standard Chartered stays "not available". | Medium. This is a new data source for public rate figures. Mitigations: the plausibility band, a per-bank failure, and source and month labels. One live run on 2026-10-16 read all 7 banks. |
| `7399908` | The scorecard shows rate, interest and after-tax figures as low–high ranges, sorts by the low end, and labels the source "Bangladesh Bank's announced rate chart" with the chart's month. | Low. A display change. `/rates` stays hidden until a scrape stores a rate. |
| `ab42cfc`, `b9aad06` | judge.md update 3, its review and the CI result. | None. Documents. |
| `71cf015` | Closes the 4 open items from the update-3 review: a chart row outranks older scraper rows, a revised chart for the same month gets a deterministic tiebreak, an overdue chart is flagged, and the admin digest compares both ends of a range. Also a lint fix. | Low. Covered by new tests in `current-rates`, `digest` and `staleness`. |
| `ba739f5` | `next` and `eslint-config-next` go from 16.3.4 to **16.4.2**. That clears GHSA-vcvr-r3jv-pc5j (RCE) and GHSA-cjq9-62q9-8jv4 (SSRF), plus the moderate advisories. | Low to medium. It is a minor bump inside 16.x, and build, unit tests and e2e are green on it. Any change in framework behaviour would show up across every page. |
| `3f8680a` | `web/next.config.ts` adds `serverExternalPackages: ["pdf-parse"]`, and `extract-figures.ts` imports `pdf-parse/worker` first. Turbopack had bundled `pdf-parse`, so Vercel never received its native `@napi-rs/canvas` or the pdf.js worker. pdf.js then threw `DOMMatrix is not defined` while loading, and the route returned an empty 500. `smoke.mjs` now reports a redirect to vercel.com as "Deployment Protection, VERCEL_AUTOMATION_BYPASS_SECRET not set/rejected". The owner checklist gives the exact steps for that secret. | Low. One config line and one import. This is the only `pdf-parse` caller left on `experimental` (the IFIC scraper that also used it is deleted in this set). |

## Migrations

- One migration: `web/prisma/migrations/20261016090000_rate_range/migration.sql`, which is `ALTER TABLE "RateSnapshot" ADD COLUMN "ratePctMax" DOUBLE PRECISION;`. It is nullable and additive and drops nothing.
- `vercel-build` runs `prisma migrate deploy` only when `VERCEL_ENV=production`, so the migration applies on the first production build after the merge, before `next build`.
- Rollback: Vercel's instant rollback restores the old code but leaves the column in place. That is safe, because the old code never reads it, and Prisma ignores columns that aren't in its schema.
- The update-3 review checked that the migration matches the schema change (`prisma migrate diff`). CI's `prisma migrate reset` applied it to a throwaway Postgres.

## What was tested, and how

- `scripts/check.sh` exits 0 on the working tree that became `3f8680a`: typecheck, lint, stray files, unsafe HTML, **570 unit tests in 43 files**, and `next build`.
- GitHub CI on `3f8680a` (run 39160792231) succeeded: typecheck, lint, 570 unit tests, the production build and **77 e2e tests**, against CI's throwaway Postgres.
- **The `pdf-parse` fix, before and after:**
  - Before: with `@napi-rs/canvas` hidden from `node_modules`, which is how the old bundle runs on Vercel, a local `next start` returned the same empty 500 on `bank-health-check` as production, logging `ReferenceError: DOMMatrix is not defined`.
  - After: the route's file trace (`route.js.nft.json`) includes `@napi-rs/canvas`, its native `.node` binary and `pdfjs-dist/legacy/build/pdf.worker.mjs`. Before the fix, none of them were there.
  - A temporary `output: "standalone"` build, copied out so it held only the traced files, returned 401 on `bank-health-check` without the secret. With the secret, it got as far as the database. Inside that copy, `PDFParse` extracted the text of a test PDF. The `standalone` setting was reverted, and it is not in the commit.
- **Cherry-pick check:** `ba739f5` alone applies cleanly on `origin/main` and passes `check.sh` there. A cherry-pick is therefore a fallback, but it would leave production's rate-scrape broken, because `main`'s IFIC adapter also imports `pdf-parse`. The full merge is the complete fix.
- **Smoke script:**
  - Against production (`main`, GET only), it passes 14 of 17 checks. The 3 failures are the canonical, robots.txt and sitemap checks, which come with this merge.
  - Against the protected Preview URL, it now prints the Deployment Protection message instead of 17 "missing text" lines. The smoke workflow on `3f8680a` (run 39160829801) failed in exactly that way, as expected until the secret is added.

## What was not tested

- **The `pdf-parse` fix on Vercel's Linux build.** The trace was checked on macOS. On Vercel, npm installs `@napi-rs/canvas-linux-x64-gnu` instead, and the tracer should pick it up the same way, but nobody has confirmed that.
- **The `experimental` code against a real database.** Preview shares production's database, and the migration runs only on production builds. Preview has therefore never had the `ratePctMax` column, so the new rate code first meets real data at the production deploy.
- **The smoke workflow passing on any deploy.** Every run so far has stopped at Deployment Protection.
- e2e was not run locally (the repo rule needs the owner's sign-off, and there is no local Postgres). CI ran it.
- The Next 16.4.2 upgrade was not checked by hand in a browser. Only the build, the unit tests and the e2e suite covered it.
- The per-user rate limits under load, Search Console, share cards, and the `owner-confirm:` tax figures. All are unchanged since the 2026-10-15 report.

## Risks and what to watch after a merge

1. **Cron routes.** After the deploy, `GET https://www.takatalks.com/api/cron/bank-health-check` and `/api/cron/rate-scrape` without a secret must return **401 `{"error":"Unauthorized"}`, not 500**. A 500 means the native module still isn't reaching the function. Check the Vercel function log for `DOMMatrix`.
2. **The migration.** The production build log should show `prisma migrate deploy` applying `20261016090000_rate_range`. If it fails, the build fails and production stays on the old deploy.
3. **Rates stay empty until the owner sets the secrets.** The merge fixes the code, but the crons refuse every call while `CRON_SECRET` is unset. Set these in Vercel → taka-talks → Settings → Environment Variables (Production), then redeploy:
   - **Needed:** `CRON_SECRET`, `SESSION_SECRET`, `ADMIN_SECRET`, and `NEXT_PUBLIC_APP_URL=https://www.takatalks.com`.
   - **Optional:** `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, the `WHATSAPP_*` variables and `YOUTUBE_API_KEY`.

   Then run one scrape, either with `curl -H "Authorization: Bearer $CRON_SECRET" https://www.takatalks.com/api/cron/rate-scrape` or with the admin "Run scrape now" button. `/api/health` should then show `banksWithFdrRates` above 0.
4. **Smoke check.** It stays red, now with a clear message, until the owner adds the bypass secret:
   - Vercel → Settings → Deployment Protection → Protection Bypass for Automation.
   - GitHub → Settings → Secrets and variables → Actions → `VERCEL_AUTOMATION_BYPASS_SECRET`.
5. **Next upgrade.** Run the smoke script against `https://www.takatalks.com` after the deploy. All 17 checks should pass.
6. **Preview database.** Preview still shares production's database. That is unchanged by this merge, and still an open owner item.

## Recommendation

**Ready to merge from a QA standpoint.** CI is green on `3f8680a`, e2e included, and `check.sh` passes. The one migration is additive. The merge closes two production problems: the Next RCE and SSRF advisories, and the two cron routes that crash on load. Live rates also need the Vercel secrets in item 3, which is an owner step that the merge cannot do.
