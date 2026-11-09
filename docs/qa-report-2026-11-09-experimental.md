# QA report: `experimental` → `main`, 2026-11-09

Written by an agent. The owner asked on 2026-11-09 for all work to be on `main`, so this report is followed by a merge PR (experimental → main, merge commit, like PR #8).

## Where things stand

- `main` (`87f0cac`, PR #8, 18 Oct) is what production serves. On 2026-11-09 production `/api/health` returned `{"dbReachable":true,"banksWithFdrRates":8,"rateSnapshotAgeHours":933.1,"bankHealthCheckAgeHours":364.7}`. The newest stored rate is about 39 days old and the newest bank-health check about 15 days old, so the daily crons are not storing results. The cron routes answer 401 without a secret (not 500), so the routes load; the gap is on the Vercel side (cron secret or schedule), not in this merge.
- `node web/scripts/smoke.mjs https://www.takatalks.com` passes all 17 checks on production.
- This report covers the **26 non-merge commits on `experimental` that are not on `main`** (`git log --no-merges origin/main..origin/experimental`, up to `002a5d3`), plus this report's commit. Together they touch 76 files, 2,039 lines added and 143 removed; 44 files and 1,196 added lines are under `web/src`. **Two database migrations** are in the set.
- `main` has 3 commits `experimental` lacks: `0dfd363`, `d3b29d8`, `87f0cac`. They are the merge commits of PRs #6, #7 and #8, each with an empty diff against its `experimental` parent. Nothing on `main` is missing from `experimental`.
- The 2026-10-30 product critique (`docs/ProductCritique/2026-10-30-product-critique.md`, `fb4662b`) is removed in this report's commit so it does not reach `main`. Product critiques are kept outside the product repos.

## What changed

| Commit | Change | Risk |
|---|---|---|
| `93c9ff0`, `a95ff6a`, `eeeb621`, `a9dd67d`, `941bdcf` | judge.md rounds of 19 and 27 Oct, a practitioner sheet for the 11 remaining `owner-confirm` values, a draft closing comment for #4, a CI comment on where the branch rule lives. | None. Documents and comments. |
| `0d28749`, `e927b56`, `519a49c`, `02b41c3` | Go-to-market docs: a content calendar (10 Nov to 15 Jan) and a creator and community seeding pack. | None. Nothing under `web/`. |
| `ae945ba` | `.coderabbit.yaml` review config. | None. |
| `77ac5a7`, `3e1e92a` (workflows) | The smoke test skips GitHub Pages deploys and, on Production, checks the public domain. CI audits runtime dependencies (`npm audit --omit=dev --audit-level=critical`). | Low. CI only. |
| `a45ce31` | `/api/health` reports scrape age from the last *successful* run. The admin digest ranks the Bangladesh Bank chart row first. | Low. Covered by tests. |
| `3e1e92a`, `862b235` (app) | The tax result shows the filing date and an etaxnbr link. `/rates` labels an overdue chart "next chart overdue". e2e navigation waits for hydration. | Low. Display changes. |
| `681efc0` | The tax result lists the **late-filing additional tax** from NBR's 2026 e-Return FAQ: after 31 Dec 2026, 2% (min 3,000) until 31 Mar 2027, then 5% (min 5,000) until 30 Jun 2027 (`lateFilingExtraTax` in `tax-rules-2025-26.ts`, `lib/tax/late-filing.ts`). | Medium. A new public figure. It is shown as extra information; the main tax figure is unchanged. |
| `8eadcd3`, `6faf18f` | Four `owner-confirm` markers settled with KPMG and NBR FAQ citations, and a June-2027 reminder comment. | None in code. Comments only; no rule value changes. |
| `d3615be`, `2873c73`, `c0aa9e7`, `291e921` (PRs #10, #12, #14, #16) | Jev (TypeSafe AI) in **shadow mode**: classifies bank-report links, gates the capital-adequacy page, and guards scraped rates, flagging doubtful ones to the admin digest. `jevClient()` returns null when `TYPESAFE_API_KEY` is unset, and every caller falls back to the existing heuristic on null or on an API error. | Low. With no key, behaviour is the same as today; with a key, it only records results and flags rows for review. |
| `c6cc14f` (PR #23) | `/privacy`, `/terms` and the footer name the operator and a private contact once `OPERATOR_NAME` and `PRIVACY_EMAIL` are set in `web/src/config/site.ts` (both `null` now). New daily cron `/api/cron/prune-anonymous` deletes anonymous accounts (no email, no phone) not seen for 180 days. New column `User.lastSeenAt`. | Medium. The cron **deletes data**. Mitigations: it needs the cron secret, it only touches rows with neither email nor phone, and the migration sets `lastSeenAt` to the deploy time for existing rows, so nothing can be deleted before about May 2027. |
| `6935d9b` (PR #21) | `/api/account/link` and `/api/account/verify` refuse cross-site requests and non-JSON bodies (`lib/same-origin.ts`). The per-address limit uses a canonical address (case, `+tag`, Gmail dots). Verify gets a per-IP limit. Admin login spends the same scrypt time for an unknown email. Provider error text no longer reaches the client. | Low to medium. A wrong host check would block sign-in; e2e (account flows) is green in CI, and unit tests cover each refusal. |
| `34c7bc1`, `6734ee6` (PR #22) | Workflow actions pinned to commit SHAs, the judge workflow token scoped down, and the smoke workflow takes `smoke.mjs` from the default branch. | Low. CI only. |

## Migrations

- `20261030090000_scrape_review_note`: `ALTER TABLE "ScrapeLog" ADD COLUMN "reviewNote" TEXT;` Nullable, additive.
- `20261108090000_user_last_seen`: `ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;` Additive. The default fills existing rows in one statement.
- `vercel-build` runs `prisma migrate deploy` only when `VERCEL_ENV=production`, so both apply on the first production build after the merge, before `next build`.
- Rollback: Vercel's instant rollback restores the old code and leaves both columns. That is safe: the old code never reads them, and the default keeps inserts working.
- CI's `prisma migrate reset` applied both to a throwaway Postgres.

## What was tested, and how

- Local, on `002a5d3` after a fresh `npm ci` in `web/`: `scripts/check.sh` exits 0 (typecheck, lint, stray files, unsafe HTML, **620 unit tests passed and 1 skipped, in 52 files**, `next build`). `npm run build` (unit tests, then `next build`) also exits 0. Local Node is 26.5; CI uses 22.
- GitHub CI on `002a5d3` (run 42531880048) succeeded: typecheck, lint, the runtime-dependency audit, 620 unit tests, the build and **77 e2e tests** against CI's throwaway Postgres.
- The smoke workflow on the `002a5d3` Preview deploy (run 42531934727) skipped, because `VERCEL_AUTOMATION_BYPASS_SECRET` is not set.
- Smoke script against production (`main`): 17 of 17 checks pass.
- Cron routes on production without a secret: `rate-scrape`, `bank-health-check` and `maturity-reminders` return 401; `prune-anonymous` returns 404 (it comes with this merge).

## What was not tested

- e2e was not run locally (the repo rule needs the owner's sign-off, and there is no local Postgres). CI ran it.
- Jev with a real `TYPESAFE_API_KEY`. Only stubs in unit tests.
- The `prune-anonymous` cron against real data. It cannot delete anything until about 180 days after the deploy.
- The new routes against real data before production: Preview shares production's database but migrations run only on production builds.
- The late-filing figures against a tax practitioner. They cite NBR's FAQ.
- `npm audit --omit=dev` reports 5 high advisories (`undici` via `cheerio`, `deepmerge-ts` via `prisma`, `source-map-js`) and no critical one, so CI's audit gate passes. They were not upgraded in this round.

## Risks and what to watch after a merge

1. **Migrations.** The production build log should show `prisma migrate deploy` applying both migrations. If one fails, the build fails and production stays on the old deploy.
2. **Sign-in.** After the deploy, link an email on `/account` in a browser. A 403 `forbidden` means the host check disagrees with the domain the browser used.
3. **Crons.** `GET https://www.takatalks.com/api/cron/prune-anonymous` without a secret must return 401. `/api/health` should show `rateSnapshotAgeHours` falling below 24 once the scrape cron runs again (owner item below).
4. **Smoke check.** Run `node web/scripts/smoke.mjs https://www.takatalks.com` after the deploy; all 17 checks should pass.

## Owner items (not done by this merge)

- Set `OPERATOR_NAME` and `PRIVACY_EMAIL` in `web/src/config/site.ts`. Until then the legal pages give only the GitHub issues page as contact.
- Check `CRON_SECRET` in Vercel (Production) and the cron runs: rates are 39 days old.
- Add the smoke-test bypass: Vercel → Deployment Protection → Protection Bypass for Automation, then the GitHub Actions secret `VERCEL_AUTOMATION_BYPASS_SECRET`.

## Recommendation

**Ready to merge from a QA standpoint.** CI is green on `002a5d3`, e2e included; `check.sh` and `npm run build` pass locally; both migrations are additive; and the security fixes from PRs #21 to #23 reach production only through this merge.
