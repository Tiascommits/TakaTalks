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
