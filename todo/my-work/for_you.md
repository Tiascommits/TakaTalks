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

## 4. Set YouTube API Keys in Vercel (~5 min, yours/dev's)

We've added an automated YouTube feed to the `/videos` page. It fetches the latest uploads seamlessly via the YouTube Data API v3 and caches them (using Next.js ISR) so you don't hit API quotas.

**What needs to be done:**
1. The developer with Vercel access needs to add two new Environment Variables to the production/preview deployment settings:
   - `YOUTUBE_API_KEY`
   - `YOUTUBE_CHANNEL_ID`
2. **Do not commit the API key to git.** The local `.env.example` has blank placeholders. I have drafted an email with the actual keys that you can send directly to your developer.

## 5. Create the GoatCounter site and set one env var (~5 min, yours)

The site has no analytics at all right now, so there is no way to tell which calculator
anyone actually uses. GoatCounter is wired up and tested — it just needs an account,
which has to be in your name.

1. Sign up at [goatcounter.com](https://www.goatcounter.com) and pick a site code. The
   code becomes the dashboard URL: `takatalks` → `https://takatalks.goatcounter.com`.
2. In Vercel, add `NEXT_PUBLIC_GOATCOUNTER_CODE` = that code, on the **Production**
   environment only. Leaving it off Preview keeps test deploys out of the numbers.
3. Redeploy. It's a `NEXT_PUBLIC_` variable, so it's baked in at build time — setting it
   without redeploying does nothing.

Until that variable is set, analytics is off: no script loads and no request is made.
Nothing breaks either way, so there's no rush beyond wanting the numbers.

**Why GoatCounter and not Google Analytics.** No cookies, no personal data, no
cross-site tracking — it records path, referrer, browser and country, and that's it.
That means no consent banner and no contradiction with the "calculated on your device,
nothing is sent to our server" promise the calculators make. GA would undercut that
claim on the one page where it matters most.

**One thing to check:** goatcounter.com's hosted service is free for non-commercial use,
and asks businesses to pay (a few dollars a month). Whether TakaTalks counts is your
call — if it does, it's the paid plan or self-hosting. The code handles both: set
`NEXT_PUBLIC_GOATCOUNTER_CODE` to a hostname instead of a site code and it points at your
own instance.

Optional, later: ad blockers block `gc.zgo.at`, so some share of visits go uncounted.
GoatCounter supports serving the script from your own domain to avoid that — worth doing
only if the numbers start looking implausibly low.

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
