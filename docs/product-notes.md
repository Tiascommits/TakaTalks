# Product notes — planning conversation summary

Running notes from the planning conversation with Claude, kept here so context isn't lost
once it drops out of chat history.

## Original vision (as first described)

One app under the Takatox brand, tied to money-management video content, covering:
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
  usage data to ground it in.

## The advice-vs-math line

"AI will tell people where to invest" is a real regulatory/liability risk (BSEC territory in
Bangladesh). The distinction kept throughout planning: maximizing a legally defined tax
rebate is deterministic math (safe, automatable), telling someone which bank or instrument
will perform better is advice (risky, kept explicitly out of scope, and any comparison
feature shows sourced data side by side rather than a verdict).

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
collapses like Evaly). The realistic path to adoption is the existing Takatox
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

## Other feature ideas raised, not yet scheduled into a phase

- Take-home pay comparator for job offers (different acquisition angle than tax filing).
- Shareable "I could save X" result cards, no real identity/numbers attached.
- Freelancer-specific tax mode (BD has ~600K+ freelancers, taxed differently, often unaware).
- Instrument comparison (Sanchayapatra vs DPS vs FD vs mutual fund) by after-tax real return,
  not headline rate.
- Annual "X days left to file" seasonal hook around the November deadline.
- Video-linked calculator widgets (embed a scoped calculator under a specific video, rather
  than sending viewers to the full app).
- WhatsApp-based reminders instead of push notifications (higher open rates in BD, and
  reuses existing WhatsApp workflow infrastructure already used for Tipsoi).
- Anonymized peer benchmarking ("people in your bracket typically use X% of their rebate
  ceiling"), needs real usage volume first, so phase 4+.

## Known overlap to resolve later

Takatox's investment tracker (maturity detection, "did the interest arrive") and
KhorochPati.ai's passive SMS-based expense tracking are solving adjacent problems (reading
transaction data automatically). Worth deciding whether Takatox's tracker sits on top of
whatever pipe KhorochPati.ai builds, rather than building bank-SMS parsing twice under two
brands.
