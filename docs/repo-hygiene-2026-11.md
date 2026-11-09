# Repo hygiene, 2026-11-01

Drafts for the owner and Tia. Nothing here was posted or deleted on GitHub.

## 1. Comment to close issue #4 ("Nothing runs the e2e suite since `postbuild` was removed")

Post this on https://github.com/Tiascommits/TakaTalks/issues/4, then close it as completed:

> Fixed. CI now runs the e2e suite on every pull request to `main` and `experimental` and on every push to `experimental`, against a throwaway Postgres container: [`.github/workflows/ci.yml`, "E2E tests" step](https://github.com/Tiascommits/TakaTalks/blob/experimental/.github/workflows/ci.yml) (`npm run test:e2e`, added in ef1f778 on 20 Sep 2026; also on `main`). The other two points are done too: `npm run verify` in `web/package.json` runs unit tests, `tsc`, lint, `next build` and e2e, and `playwright.config.ts` no longer mentions `postbuild`. The last five CI runs on `experimental` and its PR branches (30 Oct 2026) passed. Closing.

## 2. Branches Tia can delete

Checked 2026-11-01 with `git merge-base --is-ancestor`. All five are fully merged, so deleting them loses nothing.

| Branch | Last commit | Merged into |
|---|---|---|
| `feat/jev-link-classification` | d3615be, 30 Oct 2026 (Jev 1.1) | `experimental` (PR #10) |
| `feat/jev-car-gate` | 2873c73, 30 Oct 2026 (Jev 1.2) | `experimental` (PR #12) |
| `test/jev-shadow-comparison` | c0aa9e7, 30 Oct 2026 (Jev 1.3) | `experimental` (PR #14) |
| `feat/jev-rate-guard` | 291e921, 30 Oct 2026 (Jev 2.1-2.2) | `experimental` (PR #16) |
| `master` | d2e16d5, 20 Sep 2026 | `experimental` and `main` |

The four `jev` branches are not in `main` yet, but `experimental` holds all their commits, so `main` gets them when `experimental` merges. To delete (GitHub, Branches page, or):

```sh
git push origin --delete feat/jev-link-classification feat/jev-car-gate test/jev-shadow-comparison feat/jev-rate-guard master
```

Keep `main` and `experimental` (`experimental` is long-lived and never deleted, per `CLAUDE.md`).

## 3. Other fixes in this change

- `.github/workflows/ci.yml` said "`main` is protected". GitHub has no branch protection or ruleset on `main` (branches API `protected: false`, rulesets API empty, 2026-11-01); the rule lives in `CLAUDE.md` and `git_instructions.md`. The comment now says so. If you want GitHub to enforce it, turn on protection for `main` (Settings, Branches) with the CI check required; that needs a repo admin.
- `web/src/config/tax-rules-2025-26.ts` has a June-2027 reminder: AY 2027-28 keeps the current bands, and the AY 2028-29 thresholds are already published (KPMG "Bangladesh Tax 2026", p46).
