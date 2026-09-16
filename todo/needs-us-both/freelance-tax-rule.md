# Confirm the freelance / IT-enabled export-service income tax rule

Status: **done, 2026-09-16.** No longer needs anything from you — kept for the citation
trail. The calculator now applies the exemption, gated as described below.

## What the rule turned out to be

Not an SRO and not a concessional rate — it is in the Act itself:

> **Income Tax Act 2023, SIXTH SCHEDULE, PART I** ("Exclusion from the computation of
> total income"), **paragraph (21)**, as substituted by the Finance Act 2024 (Act No. V
> of 2024):
>
> "Any income derived from the following business of a person being a resident or a
> non-resident Bangladeshi individual for the period from July 1, 2024 to June 30, 2027,
> namely:— (a) AI based solution development; … **(q) IT Freelancing;** (r) call centre
> service; (s) document conversion, imaging and digital archiving:
>
> Provided that all income, expenditure and investment of the business shall be performed
> wholly through bank transfer from July 1, 2024;"

Source: NBR's own authentic English text of the Act, as published in the Bangladesh
Gazette (Extraordinary) of 16 October 2025 —
<https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf> (Sixth Schedule begins at the
page headed "THE SIXTH SCHEDULE / TAX EXEMPTIONS, REBATE AND CREDITS"; para 21 is on
p. 269 of 287 in that PDF). This is the statute from the regulator's own site, which is
the bar this file asked for — earlier drafts of the answer came from a BASIS explainer
and a Daily Star piece, which agree with it but are secondary.

Three things worth knowing, because they differ from what this file assumed:

- **It's 100%, not a reduced rate.** Part I of the Sixth Schedule excludes income from
  total income altogether, so `freelanceExemptionFraction` is 1, not a fraction.
- **Individuals only** — "a person being a resident or a non-resident Bangladeshi
  individual". Not companies.
- **It expires.** The window closes for income earned after **30 June 2027** unless
  extended again. `config/tax-rules-2025-26.ts` records the end date; a later tax-year
  config must re-check the Schedule rather than copy `true` forward.

## What was implemented

`freelanceConcessionalRuleConfirmed: true` / `freelanceExemptionFraction: 1` in
`config/tax-rules-2025-26.ts`, with the citation above inline.

The proviso is a real condition, so it is **not** applied to everyone who types a number
into the freelance field. `TaxCalculatorInput.freelanceBankTransferCompliant` (default
false) has to be asserted first, via a checkbox on the calculator — the same
never-assume-compliance pattern the `/freelance` hub already used for its banking-channel
box. Left unchecked, the income is taxed exactly as it was before.

`src/lib/freelance/freelance.ts` was already applying this exemption on its own, but
attributed it only to unnamed "NBR IT/ITES statutory income exemption provisions"; it now
cites paragraph (21) too.
