# What's left for you (updated 2026-09-21)

Everything below needs you specifically — an account in your name, a key only you can
generate, or a Vercel setting only you can see. Ordered so the slowest thing starts first.

Two things changed since the last pass: the broken Facebook video is gone (the `/videos`
page now runs on three real YouTube entries, and the 2026-09-20 QA run has the embed
tests passing), and analytics is now built and waiting on an account.

**Update, later on 2026-09-21:** analytics is now live (GoatCounter account created, env
var set, redeployed, count request confirmed). The short, ordered checklist is in
[`../../formenow.md`](../../formenow.md); this file is the longer version with the
reasoning.

## Start here: the Vercel environment checklist

I looked at the Vercel project's Environment Variables page on 2026-09-21. It holds
**only** `DATABASE_URL`, `NEXT_PUBLIC_GOATCOUNTER_CODE` (Production) and
`YOUTUBE_CHANNEL_ID`. Everything else in the table below is **not set**. Three of them
fail **silently** when missing — no error page, the feature just never happens.

| Variable | If it's missing | Priority |
|---|---|---|
| `DATABASE_URL` | Nothing works. **Set.** | — |
| `ADMIN_SECRET` | `/admin/*` is locked and you can't create your first admin login at `/admin/setup`. Also the fallback for `SESSION_SECRET`. | High |
| `CRON_SECRET` | **All three cron jobs refuse every request.** Rate scrapes, maturity reminders and the monthly bank-health check silently never run. Verified in `src/lib/cron/auth.ts`: no secret → `false`, always. | **Check first** |
| `SESSION_SECRET` (or `ADMIN_SECRET` as fallback) | In production the app **throws** rather than signing a session, so `/tracker` can't save anything. | **Check first** |
| `NEXT_PUBLIC_APP_URL` | Magic-link emails build links off the request origin instead. Usually right, wrong behind a proxy or a preview URL. | Check |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | Email quietly no-ops. See item 2. | High |
| `WHATSAPP_*` (4 vars) | WhatsApp quietly no-ops. See item 1. | Medium |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | The auto-feed returns an empty list and logs an error. The three hand-curated videos still show, so the page looks fine — you just get no new uploads. **`YOUTUBE_CHANNEL_ID` is set; the key is not.** See item 3. | Medium |
| `NEXT_PUBLIC_GOATCOUNTER_CODE` | No analytics at all. **Set and live.** See item 4. | Done |

Anything named `NEXT_PUBLIC_*` is baked in at build time, so setting it without
redeploying does nothing.

## 1. Start WhatsApp Business verification — `whatsapp-business-api-setup.md` (yours)

**Start this first even though it finishes last.** Meta's business verification takes
days, and template approval adds another day or two on top. Nothing else here is blocked
by it, which is exactly why it should be in flight while you do the rest. Unlocks
WhatsApp reminders and phone-based account recovery.

## 2. Resend email setup — `email-provider-setup.md` (~30 min, yours)

The highest-leverage thing you can actually finish today: sign up, verify a sending
domain, create an API key, set `RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_EMAIL`.
Magic-link login and maturity reminders are fully built and silently no-op without it.

Note this one interacts with `CRON_SECRET` above: maturity reminders need *both* the
email keys and a working cron job. Setting Resend alone won't produce a single reminder
if the cron secret is missing.

## 3. Set the YouTube API key in Vercel (~5 min, yours)

The `/videos` page pulls your latest uploads via the YouTube Data API v3, cached with
Next's ISR so you don't burn quota.

1. `YOUTUBE_CHANNEL_ID` is **already set** (Production + Preview, 2026-09-21).
2. Add `YOUTUBE_API_KEY` (Secret, Production + Preview) using the key from your
   developer's message, then redeploy. Secrets are typed in by you, never by an agent.
3. **Don't commit the key.** `.env.example` has blank placeholders.
4. In Google Cloud Console → Credentials, restrict the key to **YouTube Data API v3**
   only. It has been pasted into a chat, so regenerate it if it ever leaks.

Without them the page degrades gracefully rather than breaking — the auto-feed is empty
and the three curated videos in `src/config/videos.ts` still render — so this is a
"missing feature", not an outage.

## 4. GoatCounter — done, two small things left (yours)

**Done 2026-09-21:** the site `takatalks` exists, `NEXT_PUBLIC_GOATCOUNTER_CODE=takatalks`
is set on **Production only**, production was redeployed without the build cache, and
loading www.takatalks.com sends `POST https://takatalks.goatcounter.com/count` which
returns 200. (That check counted as one pageview from us.)

Still yours:

1. **Click the verification link** GoatCounter emailed to nshababa16@gmail.com. Data is
   arriving, but the account is unconfirmed until you do.
2. **Decide the commercial-use question** below.

Analytics stays off on Preview deploys and locally: no script loads and no request is
made when the variable is unset.

**Why GoatCounter and not Google Analytics.** No cookies, no personal data, no
cross-site tracking — path, referrer, browser and country, and that's it. So no consent
banner, and no contradiction with the "calculated on your device, nothing is sent to our
server" promise the calculators make. GA would undercut that claim on the one page where
it matters most.

**One thing to decide:** goatcounter.com's hosted service is free for non-commercial use
and asks businesses to pay a few dollars a month. Whether TakaTalks counts is your call —
if it does, it's the paid plan or self-hosting. The code handles both: set
`NEXT_PUBLIC_GOATCOUNTER_CODE` to a hostname instead of a site code to point at your own
instance.

Optional, later: ad blockers block `gc.zgo.at`, so some visits go uncounted. GoatCounter
can serve the script from your own domain to avoid that — only worth doing if the numbers
start looking implausibly low.

## 5. Spot-check the bank list decision — `needs-us-both/confirm-new-bank-list.md`

Still open, and the only item here that needs your judgement rather than an account:
confirm the two scraped adapters (AB Bank, National Bank) match what you see published,
and decide on the three candidate banks that had no scrapeable source (BRAC, Dutch-Bangla,
Islami Bank). No deadline, but the scorecard stays at nine banks until you do.

## Not on this list, deliberately

- **Publishing cadence and the CDN video migration** live in `next_steps.md` — strategy,
  not setup, so they're tracked separately.
- **`docs/Car.md`'s remaining unverified claims.** The AIT amounts and the credit
  mechanism are now checked against Section 153 (see the 2026-09-21 second pass below).
  Still unchecked, so don't publish from them yet: the salary-to-tax figures in Car.md,
  whether salary counts as "regular source" income under Section 163(2), and the
  calculator's "10% wealth surcharge" for a second car. This repo has been bitten by
  unverified tax figures before.

---

## Done without you — 2026-09-21, second pass

- **Vercel env vars, the non-secret ones** — `NEXT_PUBLIC_GOATCOUNTER_CODE=takatalks`
  (Production only) and `YOUTUBE_CHANNEL_ID` (Production + Preview), both saved as Config
  variables. Production redeployed after the first; analytics confirmed live. Secrets were
  left for you on purpose.
- **Car AIT tables corrected against the statute** — Income Tax Act 2023, Section 153, as
  substituted by the Finance Act 2026 from 1 July 2026 (read on bdlaws.minlaw.gov.bd).
  The tiers above 2000cc, the microbus rate and the whole EV table were wrong; they now
  match the Act, with tests. `docs/Car.md` no longer says a second car pays double (the
  Act says 50% more; the code already did this). Motorcycles are excluded from this AIT.
  On `experimental` only until it is QA'd and merged.
- **YouTube feed** now skips private/deleted videos (they have no thumbnail and would have
  rendered as a broken image), and the lint error that arrived with the feed is fixed.
  `eslint`: 0 errors. `tsc`: clean. Unit tests: 248 / 248.

## Done without you — 2026-09-21 pass

- **The broken video is fixed** — the old item 1 here (Facebook `/share/v/...` shortlink
  rendering "Video unavailable") is gone. `src/config/videos.ts` now holds three real
  YouTube entries, and the 2026-09-20 QA run records the embed tests passing. Nothing
  needed from you; the request for a canonical Facebook permalink is withdrawn.
- **GoatCounter analytics** — built, unit-tested and verified in a real browser (one
  count per pageview across client-side navigation, the back button and a full reload).
  Off until you set the env var; see item 4.

## Done without you — 2026-09-16 pass

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
