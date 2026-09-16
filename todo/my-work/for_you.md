# What's left for you (updated 2026-09-16, later same day)

Git works again on this machine, so everything that was stuck behind it is now committed
and pushed to `origin/main`. Since then I also finished both of the `needs-us-both/` items
that only needed research rather than an account — bank annual-report URLs and the
freelance tax rule. Details at the bottom.

Two of the four things in the previous version of this list are genuinely yours (they need
an account in your name), and there are two small decisions I need from you.

## 1. Decision: run the e2e suite? (~1 min of your attention)

`npm run test:e2e` hasn't run against today's changes. Prisma blocks `prisma migrate
reset` — which `e2e/global-setup.ts` runs on every e2e run — when it detects an AI agent,
and it requires your explicit per-invocation consent rather than anything I can set up
once. This is by design, not a bug.

It only ever touches `TEST_DATABASE_URL`, which is the disposable `takatalks_test`
database on the local docker-compose Postgres — no dev or prod data is at risk. If you
tell me to go ahead, I'll run it. Otherwise `npm run test` (119 unit tests),
`tsc --noEmit` and `next build` are all clean, and you can run it yourself with:

```bash
cd web && npm run test:e2e
```

## 2. Decision: fix the stray commit message? (needs a force-push)

`c08b153 "Your commit message here"` is still on `origin/main`. Giving it a real message
means rewriting already-pushed history and force-pushing, which breaks anyone else who has
pulled that branch. Say the word and I'll do it — I just won't rewrite shared history
without you asking for it specifically.

## 3. Resend email setup — `email-provider-setup.md` (~30 min, yours)

Unchanged, and now the single highest-leverage thing left: sign up, verify a sending
domain, create an API key, set `RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_EMAIL`.
Magic-link login and maturity reminders are fully built and silently no-op without it.

## 4. Start WhatsApp Business verification — `whatsapp-business-api-setup.md` (yours)

Unchanged. Worth starting today whatever else happens — Meta's business verification is
the long pole (days), and template approval adds another day or two. Unlocks WhatsApp
reminders and phone-based account recovery.

---

## Done without you this pass

- **Bank annual-report / DSE URLs** — `needs-us-both/bank-annual-report-urls.md` is done
  for 7 of the 9 configured banks; the URLs now live in `src/config/banks.ts`, so Module 5
  has real sources instead of showing "not disclosed" everywhere. All verified live, none
  pattern-guessed. Two banks have no usable page at all and are deliberately left null
  (City Bank's site is client-rendered and serves no report links in its HTML; Sonali
  publishes no listing page). National Bank's URL is right but its TLS chain is broken for
  Node's fetch, which is recorded so the failure shows up in `/admin/bank-health` rather
  than looking unconfigured.
  - Supplying URLs alone wasn't enough: the old "first PDF on the page" rule picked the
    **wrong document on 5 of the 7** verified pages — a 2014 credit-rating letter for AB
    Bank, a reward-points leaflet for Standard Chartered. That picker is now scored and
    tested against each real case; 6 of 7 banks resolve to their current 2025 report.
- **Freelance tax rule** — `needs-us-both/freelance-tax-rule.md` is done, and it turned
  out not to need a practitioner: the provision is in the Act itself, not an SRO. Income
  Tax Act 2023, Sixth Schedule, Part I, paragraph (21) — a **100% exclusion** from total
  income (not a concessional rate) for 19 listed software/ITES businesses including "IT
  Freelancing", for resident/non-resident Bangladeshi **individuals**, for
  1 July 2024 – 30 June 2027. Cited from NBR's own authentic English text of the Act.
  The calculator applies it, gated on the paragraph's one proviso (all business income,
  expenditure and investment wholly through bank transfer) via a checkbox that defaults to
  off. **Note the 30 June 2027 expiry** — a future tax-year config must re-check the
  Schedule rather than carry it forward.

## One thing you should look at

I deleted `web/src/lib/bank-health/seed-bank-health.ts`. It was a runnable script that
wrote CAR/NPL/ROA/ROE figures for 8 banks directly to the public bank-health scorecard,
marked `approved: true` with `extractionConfidence: 1.0`, under a log line reading
"Seeding verified audited bank health disclosures". They were not verified: **7 of the 8
`sourceReportUrl`s it recorded for those figures return 404**, so the numbers cannot have
been read from the documents they cite, and one of its DSE codes (`ONEBANKLTD`) doesn't
exist on the exchange at all. Nothing in the app referenced the file, so nothing broke —
but had anyone ever run it, the scorecard would have published uncitable figures about
named banks' financial health as audited fact.

It's recoverable from git if you disagree with removing it. Real figures now come only
from the extraction pipeline, which requires per-figure manual approval before anything is
shown publicly. Worth knowing that this file and the dead URLs in it came from the same
kind of pattern-guessing that `prompts/03` already forbids, in case anything else in the
project was seeded the same way — the e2e tests that had never passed were a similar
story.
