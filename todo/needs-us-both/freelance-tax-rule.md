# Confirm the freelance / IT-enabled export-service income tax rule

Status: blocking a feature, not the app. The calculator now has a dedicated "Freelance /
export IT service income" field (separate from generic "other income"), but it's taxed
identically to other income for now — no concessional rate is applied. A flag
(`freelanceConcessionalRuleConfirmed: false` in `config/tax-rules-2025-26.ts`) gates this
deliberately, because guessing a tax provision in a financial tool is worse than not having
the feature.

Bangladesh has had various incentive provisions over the years for freelance/IT-enabled
export-service income (e.g. income tax exemptions for IT/ITES export earnings, reduced
source tax on inward remittance for freelancers under certain thresholds) — but the specific,
currently-in-force provision for AY 2025-26 needs to be pinned down from an actual NBR
circular/SRO or a tax practitioner, not inferred.

## What's needed

- The specific NBR SRO/section number and its current terms (exemption %, income cap,
  documentation requirements — e.g. proof of inward foreign remittance) for AY 2025-26.
- Once supplied, drop the numbers into `config/tax-rules-2025-26.ts` next to the existing
  `freelanceConcessionalRuleConfirmed` flag and flip it to `true` — no other code changes
  needed, `calculate.ts` already branches on it.

This affects real numbers freelancers see when estimating their tax, so it should come from
a source you'd cite if a user asked "where does this come from," the same bar the rest of
`tax-rules-2025-26.ts` is held to.
