# What's left for you (updated 2026-09-16, later same day)

Git works again on this machine, so everything that was stuck behind it is committed and
pushed. Both `needs-us-both/` items are now done — bank annual-report URLs and the
freelance tax rule (details at the bottom). The e2e suite has been run (42 passing) and the
stray `"Your commit message here"` commit has been given a real message and force-pushed;
tell the team to read `git_instructions.md` before their next `git pull`.

Everything below needs you specifically — an account in your name, or a link only you can
get.

## 1. The one video we have doesn't play — need a working URL (~2 min, yours)

The only entry in `web/src/config/videos.ts` is
`https://www.facebook.com/share/v/19SFrZz1mm/`, and Facebook's embed player renders
**"Video unavailable — This video may no longer exist, or you don't have permission to view
it."** for it. Confirmed on both `/videos` and the new homepage reel; `curl` on that URL
gets an HTTP 400 straight from Facebook.

This is pre-existing, not new — the e2e test only asserted that an `<iframe>` was present,
never that the video inside it loaded, so it passed the whole time.

Two likely causes, and I can't tell which from outside: the video is no longer public (or
was deleted), or `/share/v/...` shortlinks simply aren't resolvable by Facebook's video
plugin, which generally wants a canonical permalink like
`facebook.com/<page>/videos/<id>` or `facebook.com/watch/?v=<id>`.

What I need from you: the **canonical permalink** for that video (open it on the page, use
the post's own "Copy link", not the share sheet's short link), and confirmation the post's
audience is Public. Paste it over the `url` in `config/videos.ts` and it'll work — or send
it to me and I'll swap it in and verify the embed actually renders.

While you're there: the reel auto-advances only when there are **two or more** videos, so
with one entry it sits still. Send me a handful of URLs and it'll animate as intended.
Each video is one entry in that file.

## 2. Resend email setup — `email-provider-setup.md` (~30 min, yours)

Unchanged, and now the single highest-leverage thing left: sign up, verify a sending
domain, create an API key, set `RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_EMAIL`.
Magic-link login and maturity reminders are fully built and silently no-op without it.

## 3. Start WhatsApp Business verification — `whatsapp-business-api-setup.md` (yours)

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
