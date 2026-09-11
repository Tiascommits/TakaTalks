# Agent work — running list

Autonomous build work for the "close the BD-usability gaps" plan
(`/Users/blackbird/.claude-biz/plans/snoopy-petting-clarke.md`). Nothing here needs input
from you — see `../my-work/` and `../needs-us-both/` for what does.

- [x] Notification foundation: `src/lib/notify/` (email via Resend, WhatsApp via Meta Cloud
      API, both no-op safely until their env vars are set), contact/verification schema.
- [x] Contact capture + account recovery flow (`/account/link`, `/account/verify`, magic-link
      email login now, phone/OTP UI gated behind WhatsApp being configured, "remind me" toggle
      on the tracker).
- [x] Maturity reminders actually sent: cron route + `ReminderLog` to avoid double-sends.
- [x] Real bank-rate scrapers: AB Bank and National Bank verified live and wired in
      (`src/lib/rates/adapters/ab-bank.ts`, `national-bank.ts`); daily scrape cron added
      (previously manual-trigger only); admin digest now emails when non-empty. See
      `../needs-us-both/confirm-new-bank-list.md` for what else was checked and why it
      stayed on manual-seed.
- [x] Bank-health disclosure pipeline (Module 5): schema, monthly cron, PDF extraction with
      confidence scoring, `/admin/bank-health` review screen, scorecard panel. Ships
      functional but empty until bank URLs are supplied (see
      `../needs-us-both/bank-annual-report-urls.md`).
- [x] Freelance/export-service income: dedicated input field + tracker mapping + breakdown
      line, tax treatment flagged off pending `../needs-us-both/freelance-tax-rule.md`.
- [x] Admin multi-user accounts (`/admin/setup` bootstrap, email+password login) + audit log,
      replacing the single shared `ADMIN_SECRET` as ongoing auth (it still bootstraps the
      first account).

## Known follow-ups, not blocking

- The local dev database needs `prisma db push --accept-data-loss` run manually once (the
  harness's safety classifier blocks that flag) — see the command in the session summary.
  The `User` table is empty so nothing is actually at risk.
- `npm run build` / `npm run test:e2e` haven't been run this pass (would need the dev DB
  migrated first, plus e2e's separate `TEST_DATABASE_URL`) — `npm run test` (vitest, 72
  tests) and `tsc --noEmit` are clean.
- IFIC Bank's real FDR rates live in a PDF, not HTML — could reuse the Module 5 pdf-parse
  pipeline to scrape it properly in a follow-up pass instead of manual-seed.
