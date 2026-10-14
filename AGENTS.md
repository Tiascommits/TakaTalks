# Agent notes

- Branch rule (`CLAUDE.md`, `git_instructions.md`): never commit or push to `main`. Work goes to `experimental`, which merges into `main` only after a written QA report, and only when the owner decides.
- Run `scripts/check.sh` before finishing: typecheck, lint, stray files, unsafe HTML, unit tests, build. `--fast` skips tests and build.
- The app is `web/` (Next 16, React 19, Tailwind 4, Prisma/Postgres, Node 22). This Next.js differs from your training data: read the guide in `web/node_modules/next/dist/docs/` before using a Next API (see `web/AGENTS.md`).
- E2E (`npm run test:e2e`) runs `prisma migrate reset` on `TEST_DATABASE_URL` and wipes it. It is not in `check.sh`, CI runs it, and an agent needs the owner's sign-off to run it. Never point it at a real database.
- Tax rules live only in `web/src/config/tax-rules-2025-26.ts`; Sanchayapatra, loan and zakat figures sit in their `web/src/lib/<domain>/` files. `owner-confirm:` comments mark values a tax practitioner has not confirmed yet.
- Migrations are forward-only. `vercel-build` migrates only when `VERCEL_ENV=production`. Drop a column one release after the code stops using it.
- `/rates` stays out of the nav and homepage until a scrape stores a rate (`hasRateData` in `web/src/lib/rates/current-rates.ts`).
- Analytics: GoatCounter only, off unless `NEXT_PUBLIC_GOATCOUNTER_CODE` is set (production). Count events with `window.goatcounter?.count?.({ path, event: true })`; never send a figure someone typed.
- Share cards: `metadataBase` and a title-less `openGraph` in `web/src/app/layout.tsx`, image from `web/src/app/opengraph-image.tsx`. A page that sets its own `openGraph` replaces the whole object and loses the image, so give pages `title` and `description` only.
- Operations: `GET /api/health` (DB up, banks with FDR rates, age of the newest scrape and bank-health check; 503 when the DB is down). `node web/scripts/smoke.mjs <url>` checks a deploy; `.github/workflows/smoke.yml` runs it on every successful Vercel deploy.
- `tools/` holds frozen HTML demos with obsolete tax rules. Don't edit or link them; `check.sh` skips them.
- `npm run judge` writes the gitignored `judge-report.md`, which is different from `judge.md`.
- Status, open gaps and next steps: `judge.md` (newest section last). Review rules: `CODING_STANDARDS.md`. Owner checklist: `todo/my-work/formenow.md`.
