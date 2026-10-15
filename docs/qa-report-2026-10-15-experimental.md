# QA report: `experimental` → `main`, 2026-10-15

Written by an agent for the owner. The merge is the owner's decision. Nothing here merges anything.

## Where things stand

- The round-1 fixes (`7ca7227`) and the round-2 ops work (`5e3134c`) are on `experimental`, together with the sweep (`b1ad596`). No local or remote branch holds commits that `experimental` lacks.
- `main` already has most of that work. Owner PR #7 (`d3b29d8`, 15 Oct 09:03) merged `experimental` up to `e294460`. Production serves it: on 2026-10-15, `/privacy` returned 200, and `/api/health` returned `{"dbReachable":true,"banksWithFdrRates":0,...}`.
- This report covers the **7 commits on `experimental` that are not on `main` yet** (`git log origin/main..experimental`). They touch 20 files, with 249 lines added and 36 removed. There are **no database migrations** in the set.

## What changed

| Commit | Change | Risk |
|---|---|---|
| `17bcf5c` | Tests only. A 144-case sweep checks that the rebate optimizer never promises tax below the minimum. Adds three hand-worked first-return examples and an e2e check for the capped ৳15,000 promise at ৳6 lakh. | None in production code. |
| `7c8c851`, `c48fcbd` (merged at `73128d2`) | Tracker saves are now rate-limited per signed-in user, read from the HMAC-signed session, not per IP. Each IP also keeps a backstop of 600 saves per 10 minutes. The per-IP limit on login links becomes a backstop of 100 per hour; the per-address limit of 3 per 15 minutes stays. | Medium. It changes who gets a 429. A bug here either blocks real users or loosens abuse limits. |
| `876c9f3` | Owner checklist (`todo/my-work/formenow.md`). | None. It is a document. |
| `6981ce8` | `robots.txt` blocks `/admin`, `/api/` and `/account`. `sitemap.xml` lists the public tools, the legal pages and each `/viz/<slug>`, and adds `/rates` once a bank has rate data (re-checked hourly). Every page gets a canonical URL through `alternates.canonical: "./"` in the root layout. The smoke test checks all three. | Low. A wrong canonical could hide pages from search. The checks below show the right URL on 4 pages. |
| `cdff5e0` | `/privacy` now also lists the visualizer events (download, share, link copy, print) next to the two tax events. English and Bangla. | Low. It is a copy change, and the text matches `VizStudio.tsx`. |

## What was tested, and how

- `scripts/check.sh` exits 0 on `cdff5e0`: typecheck, lint, stray files, unsafe HTML, **559 unit tests in 42 files**, and `next build`. `/calculator`, `/privacy`, `/robots.txt` and `/sitemap.xml` build as static pages.
- GitHub CI (run 38731879485) on `cdff5e0`, the full set: unit tests and **77 e2e tests passed** against CI's throwaway Postgres.
- The SEO and privacy commits were tested on a local `next start` with no database:
  - `robots.txt` and `sitemap.xml` serve the expected content. `/rates` is absent from the sitemap, as it should be with no rate data.
  - The canonical tags are correct on `/`, `/calculator`, `/privacy` and `/viz/loading_car?x=1`. The last one resolves to the bare `/viz/loading_car`.
  - The Bangla privacy copy renders.
  - The smoke script passed 16 of 17 checks. `/api/health` returned 503 because there was no database, which is expected.
- The smoke script was also run against production (`main`, GET only). It passed 14 of 17 checks. The 3 failures are the new canonical, robots and sitemap checks, which `main` does not have yet.

## What was not tested

- **e2e was not run locally.** The repo rule (`AGENTS.md`) needs the owner's sign-off, and no local Postgres is installed. CI ran it instead (see above).
- The smoke workflow fails on every Vercel **preview** deploy. Every page comes back without its title (`15 of 15 checks failed`), which looks like Vercel Deployment Protection's login page. It needs the `VERCEL_AUTOMATION_BYPASS_SECRET` repo secret (owner).
- The per-user rate limits have unit tests only. Nobody has tested them under load, or with real CGNAT traffic.
- Nobody has checked the sitemap or canonicals in Google Search Console, or tested share cards in Facebook's Sharing Debugger.
- The tax figures still carry `owner-confirm:` comments that no tax practitioner has reviewed.

## Risks and what to watch after a merge

1. **Rate limits.** Watch for 429s on tracker saves and login links in the Vercel logs during the first week. Look most closely at Grameenphone and Robi mobile traffic.
2. **Canonical.** If a page later sets its own `alternates`, it replaces the root `canonical` and must set one of its own.
3. **Sitemap.** `/rates` appears in the sitemap only after the first scrape stores a rate. This follows the rule that keeps `/rates` hidden.
4. **Rollback.** There are no migrations in the set, so Vercel's instant rollback undoes all of it.

## Recommendation

The set is small and has no migrations. CI is green on `cdff5e0`, e2e included, so it is ready to merge from a QA standpoint. Before or soon after the merge, the owner still needs to finish the open Vercel items in `judge.md`: secrets, a Preview database and the smoke bypass secret.
