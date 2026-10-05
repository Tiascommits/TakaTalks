# Product notes — planning conversation summary

Running notes from the planning conversation with Claude, kept here so context isn't lost
once it drops out of chat history.

## Original vision (as first described)

One app under the TakaTalks brand, tied to money-management video content, covering:
multi-source income input, multi-investment tracking with maturity notifications, an AI
layer suggesting where to reinvest matured funds, a tax calculator with rebate guidance,
a wishlist/goal planner (e.g. "buy a car in 5 years"), and a retirement calculator.

## Why this got split into phases

This is really five or six separate products bundled into one ask. Shipping all of it at
once means none of it is good, and it's months of work before anything is usable. Phasing:

- **Phase 1**: Tax calculator + rebate optimizer (pure math, no AI needed).
- **Phase 2**: Multi-source income + investment tracker, with maturity reminders.
- **Phase 3**: Bank rate comparison + comparison scorecard (transparent data, no verdict).
- **Phase 4**: Goal planner (car, retirement) using data already collected.
- **Phase 5**: AI layer, reinvestment suggestions, personalized nudges, once there's real
  usage data to ground it in. Built ahead of that original gate on 2026-09-19 — see the
  dedicated section below for why that was safe to do without the usage data this phase
  assumed it would need.

## The advice-vs-math line

"AI will tell people where to invest" is a real regulatory/liability risk (BSEC territory in
Bangladesh). The distinction kept throughout planning: maximizing a legally defined tax
rebate is deterministic math (safe, automatable), telling someone which bank or instrument
will perform better is advice (risky, kept explicitly out of scope, and any comparison
feature shows sourced data side by side rather than a verdict).

## Phase 5 built ahead of the usage-data gate (2026-09-19)

The original phasing above deferred AI reinvestment suggestions until there was real
aggregate usage data to ground suggestion quality in — the app has no real user base yet,
so that data still doesn't exist. The product owner made an explicit call to build the
feature now anyway, ahead of that gate, rather than continue waiting.

That decision was scoped narrowly: it overrides only the "wait for usage data" gate, not
the separate advice-vs-math line above, which stays in force. The implementation
(`web/src/lib/reinvest/suggest.ts`) reflects that split deliberately:

- It reasons over **the individual person's own tracked data** (their tracker entries,
  goals, and tax situation) rather than cross-user aggregate patterns, since no aggregate
  data exists to reason over yet. This is a different, and safer, kind of "AI" than what
  the original phase description implied — no learning from usage across users, no model
  trained on outcomes.
- The output ranks **instrument categories** (Sanchayapatra, Govt Bond/Sukuk, Bank FDR,
  Mutual Fund) by three transparent, already-computed numbers — after-tax real yield (the
  same math `/instruments` uses), tax-rebate headroom (the same math the `/calculator`
  rebate optimizer uses), and goal-horizon fit — never a specific bank or branded product.
  A test asserts no bank name can appear anywhere in the suggestion output.
- No LLM is in the loop. The scoring is deterministic and unit-tested; if natural-language
  phrasing is ever added on top, it must only phrase a result already computed
  deterministically, never invent a number or pick a winner itself.

Net effect: the feature exists, but it's still "sourced data + transparent math" rather
than "an AI told me where to put my money" — the distinction the advice-vs-math line
exists to protect.

## Consolidated profit view (2026-09-22)

The request was: track investments, show the profit each will make, then suggest another
place to put the money along with a consolidated profit figure. Most of that already
existed (`/tracker` records principal, rate, term and maturity; `/reinvest` ranks where to
reinvest), so it was built on top of those rather than as a second tracker. What was
actually missing, and is now there:

- **Profit per investment and for the portfolio** on `/tracker` (`src/lib/tracker/projection.ts`).
  It uses the same TDS bands and compounding rules as `/instruments`, so the tracker,
  the matrix and the ranking agree. A confirmed payout counts as real profit, not an
  estimate. Only four instrument types (Sanchayapatra, govt bond, FDR, mutual fund) get a
  tax figure; the rest are shown before tax and say so. A donation returns nothing and is
  left out of the totals.
- **A consolidated figure on `/reinvest`**: profit already tracked plus the extra
  after-tax profit from putting the amount into a category, shown for the top-ranked
  category in a summary card and for every category on its own card. Only the incremental
  profit is added, so the payout being reinvested is not counted twice.

**What is suggested is still a category, not a named place.** "Another place" means
Sanchayapatra, Govt Bond/Sukuk, Bank FDR or Mutual Fund, never a specific bank, branch or
fund. That is the advice-vs-math line above, and it stays in force: the profit figures are
arithmetic on numbers the person typed, but picking a named institution would be a verdict.
Naming a bank would be a separate, deliberate owner decision (the per-bank rate data in
`/rates` exists, so it is technically easy; the regulatory exposure is the reason it is
not done). Every profit figure is labelled an estimate, not a guarantee.

## Why the bank health/scorecard idea is higher-stakes than it first looked

At the time of planning, Bangladesh's banking sector was in a documented stress period:
Bangladesh Bank's most recent Financial Stability Report showed a **negative aggregate
CRAR (~-2.64%)** against a 12.5% requirement, an **NPL ratio near 32%**, at least 19 banks
below minimum capital requirements, and some individual banks with default ratios above 80%.
A government white paper described several banks as effectively insolvent. Some of this bad
-loan exposure had reportedly been concealed in self-reported figures for years before
surfacing.

Deposit insurance (Deposit Protection Act 2026) covers **BDT 2,00,000 per depositor per
bank**, only on formal liquidation, against total sector deposits around BDT 20 lakh crore.

Implication for the product: any "which bank is healthiest" feature must show sourced,
dated figures and explicitly flag missing data, rather than compute a composite score or
issue a recommendation, especially since the weakest banks' self-reported numbers are the
least trustworthy. See prompts 02 and 03 for how this constraint shaped the build.

## Trust and adoption reasoning

People in Bangladesh are reasonably wary of financial apps (MLM apps, e-commerce Ponzi
collapses like Evaly). The realistic path to adoption is the existing TakaTalks
content-audience relationship, not the app's own security claims. Concrete implications,
already applied in `tools/tax-calculator/v3-trust-first-estimator.html`:

- No signup to use the calculator. Calculate client-side by default.
- Net wealth / surcharge fields hidden behind an explicit opt-in, not shown by default.
- Account creation deferred to the one moment it's actually needed (e.g. maturity
  reminders), framed honestly at that moment.
- A visible, literal claim: "calculated on your device, nothing sent to our server."
- "Estimate" framing throughout, not "file your return here."
- This trust mechanism should be reused for KhorochPati.ai rather than solved twice under
  two different brands, since SMS-based passive tracking is an even heavier trust ask.

## Other feature ideas raised

Built since these were first raised:

- ~~Take-home pay comparator for job offers~~ — built, `/salary`.
- ~~Freelancer-specific tax mode~~ — built, `/freelance` + the Sixth Schedule para (21)
  exemption in the calculator (see `todo/needs-us-both/freelance-tax-rule.md`).
- ~~Instrument comparison by after-tax real return~~ — built, `/instruments`; also the
  basis for the Phase 5 reinvestment suggestions' yield scoring.

Still not scheduled into a phase:

- Shareable "I could save X" result cards, no real identity/numbers attached.
- Annual "X days left to file" seasonal hook around the November deadline.
- Video-linked calculator widgets (embed a scoped calculator under a specific video, rather
  than sending viewers to the full app).
- WhatsApp-based reminders instead of push notifications (higher open rates in BD) — the
  notification infra already supports this (`src/lib/notify/`, Meta Cloud API, no-op until
  configured), it's just waiting on the WhatsApp Business verification in
  `todo/my-work/whatsapp-business-api-setup.md`, not on further product design.
- Anonymized peer benchmarking ("people in your bracket typically use X% of their rebate
  ceiling") — still genuinely needs real usage volume, unlike Phase 5's reinvestment
  suggestions, since this one's whole premise is cross-user comparison rather than a
  single person's own numbers.

## Known overlap to resolve later

TakaTalks's investment tracker (maturity detection, "did the interest arrive") and
KhorochPati.ai's passive SMS-based expense tracking are solving adjacent problems (reading
transaction data automatically). Worth deciding whether TakaTalks's tracker sits on top of
whatever pipe KhorochPati.ai builds, rather than building bank-SMS parsing twice under two
brands.

## Money habits and the financial-freedom roadmap (2026-10-05)

Two features the product owner asked for by voice note, built together because they are the
two ends of the same question — where the money leaks out, and what it is supposed to add up
to.

### `/habits` — money habit tracker & guide

The ask: track the micro-to-mini spends people repeat without noticing (subscriptions, mobile
data top-ups, food delivery, ride sharing, daily small spends, card purchases), and nudge
people toward better habits — including concrete suggestions like "a bigger internet bundle
would be cheaper than the packs you keep buying" or "your budget is holding, but consider
cooking at home more often".

Why it is a separate tool rather than part of `/tracker`: `/tracker` records discrete amounts
(an income that arrived, a deposit that matures on a date). A habit has no amount to record —
it has a unit cost and a frequency, and the number that matters is the product nobody computes
in their head.

**How the nudges stay on the math side of the line above.** The suggestions the owner
described are genuinely useful, but "switch to that package" or "that restaurant is cheaper"
would be the app shopping on someone's behalf with prices it cannot verify. So every
comparison is anchored to a number the person supplies themselves:

- the monthly cap is theirs, and OVER_CAP / NEAR_CAP only compare their spend to their limit
- BUNDLE_CHEAPER needs them to type what one month-long pack costs; the tool does the
  multiplication (`8 × ৳49 = ৳392` against a `৳299` bundle), it does not look the pack up
- SELF_SERVE_GAP needs them to type what the same thing costs done themselves, and offers
  swapping *half* the occurrences, not giving the habit up
- LOW_USE / UNUSED_SUBSCRIPTION divides their own cost by their own usage count

No operator, restaurant, app or bank is named anywhere in the output, and a test asserts it.
Headline saving takes the **largest** nudge per habit, never the sum, so two nudges describing
the same taka from different angles cannot inflate the figure. The identified saving is then
compounded at the same net DPS benchmark `/goals` uses, so the two tools agree.

**Persistence.** This is the first tool on the site that keeps state between visits — a habit
list that forgets is useless. It is kept in `localStorage` via an external store
(`src/lib/habits/store.ts`), the same `useSyncExternalStore` shape as the saved language, so
nothing reaches a server and the trust position holds. The banner on the page says so, and
says that clearing browser data clears the list.

**Not built:** scheduled email/WhatsApp nudges. The existing notification pipeline is tied to
a `User` row and verified contact details, so push reminders would mean an account, consent
plumbing and a cron job — a deliberate, separate decision rather than something to add
quietly to a no-signup client-side tool. Every nudge today is in-app.

### `/freedom` — financial freedom calculator & roadmap

The ask: go beyond the existing retirement number — let people set their own inflation rate,
model the life they actually want afterwards (stop entirely, light work, travel, move to the
village, stay home), count passive income they already have (flat rent, shop rent), show how
the corpus should be deployed (a safe floor versus a small business they could afford to lose),
and give a milestone timeline from their current age to their target age.

It is a new tool rather than an extension of `/goals`' `RETIREMENT_FIRE` preset because that
preset asks "what monthly DPS reaches a number you already picked", and all four of the things
above are about deriving the number itself.

Decisions worth remembering:

- **Inflation is counted twice**: it inflates the bill at the freedom age, and it erodes the
  return while the corpus is being spent. A negative real return is reported as negative, and
  the "never touch the principal" figure is withheld (`null`) rather than shown as a very large
  but misleading number.
- **Two numbers, not one**: a depleting corpus that lands at zero at the plan-until age (the
  headline, and what the roadmap targets) and a perpetual one. The depleting one is honest
  about the fact that most people do not need to fund eternity.
- **Light-work income only counts for the lifestyle that includes it**, so switching to "stop
  entirely" cannot silently keep crediting income the person just gave up.
- **Each passive source carries its own growth rate**, because a rent raised slower than
  inflation quietly shrinks as a share of the bill.
- **The allocation describes roles, not products**: liquid buffer, income floor, growth,
  venture. The carve order is the substance — buffer and floor first, so the venture slice can
  only be funded from genuine surplus, and it is capped at a fifth of the corpus however high
  the appetite slider goes. A total loss there still leaves every essential bill paid. No bank
  or fund is named; a test asserts it.
- **"Can I get there sooner" re-prices the number at every candidate age.** A later freedom
  costs more per month but funds fewer years, so comparing a projected balance against a number
  computed for a different age would quietly flatter the answer.
- **Coast age is measured against what they actually save**, not the required amount. On the
  required path the money is needed right up to the last month by construction, so coasting
  against it would always report the freedom age and tell them nothing.
