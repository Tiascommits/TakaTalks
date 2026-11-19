# QA report: `experimental` → `main`, 2026-11-20

Written by an agent on branch `agent/nw-tt-security-bump` (cut from `origin/experimental` at `ef63ee4`). Nothing was pushed or merged. The owner and Tia decide the merge.

## Where things stand

- `main` (`e0c7499`, PR #24, 2026-11-09) is what production serves. On 2026-11-20 production `/api/health` returned `{"dbReachable":true,"banksWithFdrRates":8,"rateSnapshotAgeHours":17.3,"bankHealthCheckAgeHours":16.1}`: the daily crons now store results (on 2026-11-09 the newest rate was 39 days old).
- `node web/scripts/smoke.mjs https://www.takatalks.com`: all 17 checks pass on production.
- Production runs **Next.js 16.4.2**, which `npm audit` flags for two cache-leak advisories (GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8; fixed in 16.4.6).

## What would merge

Three non-merge commits are on this branch and not on `main`: two from `experimental` (PRs #25 and #26, merged 2026-11-10) and one from this branch.

| Commit | Change | Risk |
|---|---|---|
| `6e2e4c9` (PR #25) | The videos page stops promoting the early-filing credit, which expired; a test pins it (`web/src/config/videos.ts`). | None. Copy and a test. |
| `e283faa` (PR #26) | Six Bangla filing-season pages with English twins; every figure is read from `TAX_RULES` (`web/src/lib/seo/filing-pages.ts`, 83-line test). | Low. New static pages; numbers come from the same rules file as the calculator, so they cannot drift from it. |
| `3ae471a` (this branch) | `next` and `eslint-config-next` 16.4.2 → 16.4.6 (exact pins kept); `undici` and `source-map-js` patch fixes via `npm audit fix`. | Low. Patch releases. `npm audit --omit=dev` goes from 1 moderate + 5 high to 3 high, all in the prisma CLI chain (`deepmerge-ts` via `@prisma/config`, stack exhaustion on recursive config objects), which needs prisma 7: a major upgrade left for its own branch. |

No migrations.

## What was tested

- Local, after a fresh `npm ci` and `prisma generate` in `web/`: `scripts/check.sh` exits 0: typecheck, lint, stray files, unsafe HTML, **653 unit tests passed, 1 skipped, in 54 files**, `next build`. Local Node is 26.13; CI uses 22.
- With 16.4.2, `next build` stopped with a "known security vulnerability" error instead of building; with 16.4.6 it builds.
- Not run: e2e (it resets `TEST_DATABASE_URL`; CI runs it on every push to `experimental` and on PRs).

## Steps for the owner and Tia

1. Review, then `git push -u origin agent/nw-tt-security-bump` and open a PR into `experimental`. CI runs the e2e suite there.
2. After it merges, open `experimental → main` (merge commit, like PR #24). Vercel deploys `main`.
3. After the deploy: `node web/scripts/smoke.mjs https://www.takatalks.com` and `curl -s https://www.takatalks.com/api/health`.
4. Issue #4 ("Nothing runs the e2e suite") is out of date: `.github/workflows/ci.yml` runs `npm run test:e2e` on every push and PR. It can be closed.
