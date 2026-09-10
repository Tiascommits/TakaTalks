# Takatox web app

Next.js (App Router) + TypeScript + Tailwind + Prisma/Postgres. Built from
`prompts/01-tax-calculator-and-tracker.md`: Phase 1-2 MVP covering the tax
calculator + rebate optimizer, and the income/investment tracker.

## Getting started

You need a Postgres database — a free [Neon](https://neon.tech) project is
the easiest option (and what the Vercel deployment below uses).

```bash
cp .env.example .env      # fill in DATABASE_URL (and TEST_DATABASE_URL)
npm install                # also runs `prisma generate`
npx prisma migrate deploy  # applies migrations to DATABASE_URL
npm run dev
```

Open http://localhost:3000. `/calculator` works with zero setup (no account,
no server round-trip for the calculation itself). `/tracker` creates a
lightweight anonymous account (no email/password) the first time you save an
entry, tracked via an httpOnly cookie — see `src/lib/tracker/session.ts`.

## Deploying (Vercel)

1. Create two free Postgres databases (e.g. two Neon branches/databases) —
   one for prod, one throwaway one for e2e tests.
2. In Vercel, import this GitHub repo, set the **Root Directory** to `web`.
3. Add env vars in the Vercel project: `DATABASE_URL` (prod database).
4. Deploy. Vercel runs the `vercel-build` script (`prisma migrate deploy &&
   next build`), which applies any pending migrations to `DATABASE_URL`
   before building — no separate migration step needed on future pushes.

`vercel-build` intentionally skips the local `build` script's
prebuild/postbuild test hooks (Playwright needs a browser install and a
disposable test database that don't belong in a deploy step) — run
`npm test` / `npm run test:e2e` in CI or locally instead.

## Structure

- `src/config/tax-rules-2025-26.ts` — all tax slabs, caps, and thresholds.
  Review every national budget; nothing else in the codebase should
  hardcode these numbers.
- `src/lib/tax/` — pure calculation functions (`calculate.ts`,
  `optimizer.ts`), no React or Next.js dependencies, easy to unit test.
- `src/lib/tracker/` — lazy anonymous-user session handling and the
  tracker → calculator data mapping (`derive-tax-input.ts`).
- `src/app/calculator/`, `src/app/tracker/` — the two MVP modules.
- `prisma/schema.prisma` — `User`, `IncomeEntry`, `InvestmentEntry`,
  `TaxProfile`.

## Testing

`npm run build` automatically runs the full test suite — a broken test fails
the build:

- **prebuild** → `npm test` (Vitest): pure unit tests of the tax calculation
  engine (`src/lib/tax/*.test.ts`). 55 cases covering normal use, every
  taxpayer category, every capital-gains rule, rebate/surcharge edge cases,
  and adversarial input (negative numbers, NaN, Infinity, absurdly large
  values) — the engine clamps all of that to sane, non-negative behavior
  rather than producing garbage output.
- **postbuild** → `npm run test:e2e` (Playwright, real Chromium): drives the
  actual built app — `/calculator` and `/tracker` — through normal flows plus
  weird ones (negative/zero/huge/decimal input, rejected form submissions,
  matured-investment payout confirmation, cross-reload persistence) and
  asserts the page never shows `NaN`/`Infinity`/`undefined`. Runs against
  `TEST_DATABASE_URL`, a disposable Postgres database that gets wiped via
  `prisma migrate reset` on every run — never the developer's `DATABASE_URL`
  (see `e2e/global-setup.ts`, `e2e/test-db.ts`).

Run them individually during development:

```bash
npm test              # unit tests, watch mode: npm run test:watch
npm run test:e2e      # E2E — requires a build first (npx next build)
```

Playwright needs its browser installed once: `npx playwright install chromium`.

## Not yet built

AI reinvestment suggestions, goal planner, bank rate comparison/scorecard —
see the root `README.md` roadmap and `prompts/02-*`, `prompts/03-*`.
