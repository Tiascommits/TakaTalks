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
- [x] IFIC Bank FDR scraper (`src/lib/rates/adapters/ific-bank.ts`), verified live
      2026-09-16: its rates live in a PDF (`ificbank.com.bd/deposit-rate` embeds it, filename
      changes on every rate revision) rather than HTML, parsed with the same `pdf-parse`
      dependency Module 5 uses. Overrides IFIC's manual-seed entry in `registry.ts`.
- [x] Local Postgres for dev + e2e (`web/docker-compose.yml`), matching `.env.example`'s
      default host/port — `docker compose up -d` and both `DATABASE_URL`/`TEST_DATABASE_URL`
      work with zero further config. `npm run build` (prebuild → unit tests, build, postbuild
      → e2e) now runs clean end-to-end on a freshly cloned machine; verified across repeated
      runs. This surfaced two e2e tests that had apparently never actually passed before
      (nothing had ever gotten `test:e2e` running against a live DB): one asserted an
      English-only field label the app never renders (default language is Bangla, see
      `src/lib/i18n.tsx`), the other asserted a tax-exemption badge that correctly requires
      opting into a compliance checkbox first. Both fixed in `web/e2e/`.
- [x] Verified bank annual-report / DSE URLs supplied for the configured banks
      (`src/config/banks.ts`, upserted by `runScrape`), so Module 5 has real sources
      instead of reporting "not disclosed" for everything. City Bank and Sonali Bank have
      no usable page and are left null on purpose — see
      `../needs-us-both/bank-annual-report-urls.md` for each URL, the two gaps, and the
      National Bank TLS caveat.
- [x] Fixed annual-report document selection (`pickAnnualReportLink` in
      `src/lib/bank-health/fetch-reports.ts`). The old "first PDF, or any href containing
      'annual'" rule picked the wrong document on 5 of the 7 verified bank pages (AB
      Bank's gave a 2014 credit-rating letter, Standard Chartered's a reward-points
      leaflet, EBL's a standalone directors' report). Now scored, with the neighbouring
      document types penalised, newest-year tie-break that ignores upload timestamps, and
      null rather than a guess. Every real-world case is a regression test.
- [x] Removed `src/lib/bank-health/seed-bank-health.ts`, which wrote CAR/NPL/ROA/ROE
      figures for 8 banks straight to the public scorecard as approved,
      confidence-1.0 "verified audited disclosures". Nothing referenced it, and 7 of the 8
      `sourceReportUrl`s it recorded for those figures are 404s, so the numbers cannot
      have come from the documents they cite. Recoverable from git if ever needed.
- [x] Freelance/ITES exemption confirmed against the statute and applied — Income Tax Act
      2023, Sixth Schedule, Part I, para (21) (100% exclusion, 1 Jul 2024 - 30 Jun 2027,
      individuals only). Gated on the paragraph's bank-transfer proviso via an explicit
      opt-in, default false. See `../needs-us-both/freelance-tax-rule.md`.

- [x] Homepage rebuilt mobile-first and the site nav cut back to brand + Tools + Demo.
      The nav listed all 10 tools inline; it now has one "Tools" menu grouping them by
      category (`src/config/tools.ts`, shared with the homepage so the two can't drift).
      The homepage no longer stacks nine near-identical cards into a scroll-list — tools
      are behind four category tabs (`components/home/ToolTabs.tsx`), which puts the whole
      page at ~2.4 phone screens instead of ~6. Added an auto-advancing video reel
      (`components/home/VideoReel.tsx`): scroll-snap so swiping works natively, and the
      timer stops on hover/focus/touch, on a hidden tab, and under
      `prefers-reduced-motion`. It only animates with 2+ videos in `config/videos.ts`.

- [x] Wired up the basic tax calculator (2026-09-19) — an upstream pull had added
      `/tax_basic_calculation` (income-only slab tax) without registering it anywhere.
      Added it to `src/config/tools.ts` (now shows in nav + homepage), added the missing
      "calculated on your device" trust banner it was missing per
      `../../docs/feature-spec-tax-calculator.md`, and confirmed it already imports the
      shared slab logic/config rather than duplicating it. Kept the relationship
      one-directional: the basic calculator links up to `/calculator` for rebate
      optimization; the full calculator doesn't link back down.

- [x] Fixed the `CalculatorForm.tsx` lint error noted below (2026-09-19) — moved URL-param
      hydration into a lazy `useState` initializer + `useSearchParams` inside a `Suspense`
      boundary, per Next's documented pattern, instead of a mount `useEffect`. No
      hydration-mismatch risk since the route is already dynamically rendered.

- [x] Phase 5: AI reinvestment suggestions (2026-09-19) — built ahead of the original
      "needs real usage data" gate on explicit product-owner sign-off; see
      `../../docs/product-notes.md`'s "Phase 5 built ahead of the usage-data gate" section
      for the full reasoning. Deterministic category-level scoring
      (`src/lib/reinvest/suggest.ts`) over the person's own tracked data — after-tax real
      yield (reuses `/instruments`' logic), tax-rebate headroom (reuses the `/calculator`
      optimizer), and goal-horizon fit — never a named bank or product, and no LLM in the
      loop. New `/reinvest` tool plus surfacing from `/tracker`'s maturity panel and the
      maturity-reminder email. New `ReinvestSuggestion` model/migration.

## Known follow-ups, not blocking

- Full verification runs clean end-to-end on this machine: 138 unit tests, `tsc --noEmit`,
  `next build`, and (as of the last full run before the 2026-09-19 batch above) 42
  Playwright e2e tests — the e2e suite hasn't been re-run since that batch merged, since it
  requires a destructive `prisma migrate reset` and needs explicit human sign-off first.
  `npm run test:e2e` needs `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` set when an agent
  invokes it, since `e2e/global-setup.ts` runs that reset.
- The single video in `config/videos.ts` does not play — Facebook's embed returns "Video
  unavailable" for its `/share/v/...` shortlink (and curl gets an HTTP 400). Pre-existing;
  the e2e test only asserted the iframe existed, never that it loaded. Needs a canonical
  permalink from a public post — see `../my-work/for_you.md`.
