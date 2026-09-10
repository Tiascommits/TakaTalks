# Takatox web app

Next.js (App Router) + TypeScript + Tailwind + Prisma/SQLite. Built from
`prompts/01-tax-calculator-and-tracker.md`: Phase 1-2 MVP covering the tax
calculator + rebate optimizer, and the income/investment tracker.

## Getting started

```bash
npm install
npx prisma migrate dev   # first time only, creates prisma/dev.db
npm run dev
```

Open http://localhost:3000. `/calculator` works with zero setup (no account,
no server round-trip for the calculation itself). `/tracker` creates a
lightweight anonymous account (no email/password) the first time you save an
entry, tracked via an httpOnly cookie — see `src/lib/tracker/session.ts`.

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

## Not yet built

AI reinvestment suggestions, goal planner, bank rate comparison/scorecard —
see the root `README.md` roadmap and `prompts/02-*`, `prompts/03-*`.
