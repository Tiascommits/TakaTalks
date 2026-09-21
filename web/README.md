# TakaTalks web app

Next.js (App Router) + TypeScript + Tailwind + Prisma/Postgres. Started from
`prompts/01-tax-calculator-and-tracker.md` (Phase 1-2 MVP: tax calculator + rebate
optimizer, income/investment tracker) and has since grown through the rest of the
roadmap — see the root `README.md`'s roadmap table for phase-by-phase status. This file
covers setup, deployment, and the current module/route layout.

## Getting started

You need a Postgres database — a free [Neon](https://neon.tech) project is
the easiest option for prod (and what the Vercel deployment below uses). For
local dev, `docker-compose.yml` spins up a disposable local Postgres that
matches `.env.example`'s default `DATABASE_URL`/`TEST_DATABASE_URL` host/port
out of the box:

```bash
docker compose up -d       # local Postgres on localhost:55432
cp .env.example .env       # defaults already match the docker-compose db
npm install                 # also runs `prisma generate`
npx prisma migrate deploy   # applies migrations to DATABASE_URL
npm run dev
```

Open http://localhost:3000. Most tools — `/calculator`, `/tax_basic_calculation`,
`/goals`, `/salary`, `/instruments`, `/zakat`, `/freelance`, `/loans`, `/reinvest` —
work with zero setup, no account, no server round-trip for the calculation itself.
`/tracker` creates a lightweight anonymous account (no email/password) the first time
you save an entry, tracked via an httpOnly cookie — see `src/lib/tracker/session.ts`.
`/rates` and `/admin/*` need the rate-scrape/bank-health cron jobs and an admin login
to show live data (see `src/lib/rates/`, `src/lib/bank-health/`, `src/lib/admin/`).

## Deploying (Vercel)

1. Create two free Postgres databases (e.g. two Neon branches/databases) —
   one for prod, one throwaway one for e2e tests.
2. In Vercel, import this GitHub repo, set the **Root Directory** to `web`.
3. Add env vars in the Vercel project: `DATABASE_URL` (prod database), and
   `NEXT_PUBLIC_GOATCOUNTER_CODE` if you want analytics (see below) — set that one on
   the **production** environment only, so preview deploys don't skew the stats.
   Production also needs `CRON_SECRET`, `SESSION_SECRET` and `ADMIN_SECRET` (without
   `CRON_SECRET` every cron route refuses every request; without `SESSION_SECRET` or
   `ADMIN_SECRET` the tracker can't sign sessions). Optional: `YOUTUBE_API_KEY` +
   `YOUTUBE_CHANNEL_ID` for the `/videos` auto-feed, and the email/WhatsApp variables
   listed in `.env.example`. The variable-by-variable checklist is in `../formenow.md`.
4. Deploy. Vercel runs the `vercel-build` script (`prisma migrate deploy &&
   next build`), which applies any pending migrations to `DATABASE_URL`
   before building — no separate migration step needed on future pushes.

`vercel-build` intentionally skips the local `build` script's `prebuild`
unit-test hook, and Vercel never runs the e2e suite (Playwright needs a browser
install and a disposable test database that don't belong in a deploy step). The
e2e suite runs in CI (`.github/workflows/ci.yml`) and via `npm run verify`.

## Structure

Config and business logic live under `src/config/` and `src/lib/<domain>/` as pure,
framework-free functions (easy to unit test); each domain's route(s) live under the
matching `src/app/<domain>/` folder. `src/config/tools.ts` is the single registry that
drives both the site nav and the homepage tool tabs — add a tool there, not in two places.

| Domain | Lib | Routes |
|---|---|---|
| Tax calculator + rebate optimizer | `src/lib/tax/` (`calculate.ts`, `optimizer.ts`), rules in `src/config/tax-rules-2025-26.ts` — review every national budget, nothing else should hardcode these numbers | `/calculator`, `/tax_basic_calculation` (fast income-only on-ramp, shares the same rules config) |
| Income/investment tracker | `src/lib/tracker/` (anonymous session handling, `derive-tax-input.ts`; `projection.ts`: per-investment and portfolio profit estimates, same TDS and compounding rules as `/instruments`) | `/tracker` |
| Freelance/ITES exemption | `src/lib/freelance/` | `/freelance` |
| Bank rate scorecard | `src/lib/rates/` (per-bank adapters + manual-seed fallback) | `/rates`, `/admin/rates` |
| Bank health disclosures | `src/lib/bank-health/` (PDF extraction, confidence scoring) | `/rates` (public panel), `/admin/bank-health` (approval) |
| Goal planner | `src/lib/goals/` | `/goals` |
| Salary/offer comparator | `src/lib/salary/` | `/salary` |
| Instrument real-yield matrix | `src/lib/instruments/` | `/instruments` |
| Reinvestment suggestions (Phase 5) | `src/lib/reinvest/` (`suggest.ts`: deterministic category scoring, `log.ts`: persistence); the consolidated-profit card combines it with `src/lib/tracker/projection.ts` | `/reinvest`, surfaced from `/tracker`'s maturity panel |
| Car AIT and affordability | `src/lib/cars/` (`car-tax.ts`: BRTA advance income tax by engine cc / EV kW per Income Tax Act 2023 s.153 as amended by the Finance Act 2026; re-check the table whenever a Finance Act touches s.153) | `/cars` |
| YouTube feed | `src/lib/videos/youtube.ts` (Data API v3, ISR-cached for an hour; needs `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID`), hand-picked entries in `src/config/videos.ts` | `/videos` |
| Zakat | `src/lib/zakat/` | `/zakat` |
| Loan calculator | `src/lib/loans/` | `/loans` |
| Notifications (email/WhatsApp, no-op until env vars set) | `src/lib/notify/` | used by tracker + reinvest cron flows |
| Admin auth + audit log | `src/lib/admin/` | `/admin/*` |

`prisma/schema.prisma` has grown accordingly — `User`, `IncomeEntry`, `InvestmentEntry`,
`TaxProfile`, `ReminderLog`, `Bank`, `RateSnapshot`, `ScrapeLog`, `BBAggregateRate`,
`AnnualReportCheckLog`, `ExtractedFigure`, `AdminUser`, `AdminSession`, `AdminAuditLog`,
`ReinvestSuggestion`.

## Analytics

Pageviews are counted by [GoatCounter](https://www.goatcounter.com): no cookies, no
personal data, no cross-site tracking — it records path, referrer, browser and country
and nothing else. That's the only kind of analytics this project's trust posture allows
(`docs/feature-spec-tax-calculator.md` puts anything that logs the figures people type
into the calculators explicitly out of scope), and it needs no consent banner.

It is **off unless `NEXT_PUBLIC_GOATCOUNTER_CODE` is set**: with the variable unset the
component renders nothing, no script is fetched and no request leaves the browser. Set it
to your goatcounter.com site code (`takatalks` → `https://takatalks.goatcounter.com`), or
to a hostname if you move to a custom domain or self-host. GoatCounter also ignores
localhost on its own, so a stray local value won't pollute the stats either.

| Piece | What it does |
|---|---|
| `src/lib/analytics/goatcounter.ts` | Pure `countEndpoint()` — turns the configured code/host into the `/count` URL, or `null` to stay off. Unit-tested, including rejecting anything that isn't a plain host. |
| `src/components/Analytics.tsx` | Loads `count.js` (`afterInteractive`) and counts pageviews. |
| `src/app/layout.tsx` | Mounts `<Analytics />` once, for the whole site. |

The script's own count-on-load is turned off (`no_onload`) because the App Router
navigates without reloading the page, so it would only ever see the first page of a
visit; an effect on `usePathname` counts every path instead, the first one included.
Verified in a real browser: one count per pageview across client-side navigation, the
back button and a full reload, with no double-count on the initial load.

To count a custom event later, call
`window.goatcounter?.count?.({ path: "some-event", event: true })` from a client
component — same script, no extra setup.

## Testing

Two layers of tests. `npm run build` runs the unit tests first (`prebuild`), so a broken
unit test fails a local build. The e2e suite is **not** part of `build` — run
`npm run verify` (unit tests → `tsc` → lint → production build → e2e) before merging; CI
runs the same steps on every pull request.

- **Unit** (`prebuild`, or `npm test`) → Vitest: pure unit tests across every `src/lib/<domain>/`
  module — tax calculation (normal use, every taxpayer category, every capital-gains
  rule, rebate/surcharge edge cases, and adversarial input like negative numbers, NaN,
  Infinity, absurdly large values, all clamped to sane non-negative output), reinvestment
  scoring, freelance exemption, bank-health document selection, and more.
- **E2E** (`npm run test:e2e`, also run by `npm run verify` and CI) → Playwright, real Chromium: drives the
  actual built app through normal flows plus weird ones (negative/zero/huge/decimal
  input, rejected form submissions, matured-investment payout confirmation, cross-reload
  persistence) and asserts the page never shows `NaN`/`Infinity`/`undefined`. Runs against
  `TEST_DATABASE_URL`, a disposable Postgres database that gets wiped via
  `prisma migrate reset` on every run — never the developer's `DATABASE_URL`
  (see `e2e/global-setup.ts`, `e2e/test-db.ts`). This reset makes the command destructive
  to whatever it points at — never point `TEST_DATABASE_URL` at a real database, and get
  explicit sign-off before an agent runs this command.

Run them individually during development:

```bash
npm test              # unit tests, watch mode: npm run test:watch
npm run test:e2e      # E2E — requires a build first (npx next build)
```

Playwright needs its browser installed once: `npx playwright install chromium`.

## Status

Every phase in the root `README.md`'s roadmap table is built. What's left is tracked in
`todo/`, not here: `todo/my-work/` and `todo/needs-us-both/` are items gated on the human
owner's own accounts or judgment calls (email/WhatsApp provider setup, a couple of bank
data-source decisions); `todo/agent-work/README.md` is the running log of autonomous work
completed to date.
