# Takatox Tax Calculator — Trust-First Feature Spec

Scope: the tax calculator module only (module 1 from earlier planning). This is the
highest-traffic, most shareable entry point into Takatox, so it gets built to the
lowest-friction, lowest-trust-barrier standard before anything else.

## Core principle

No signup, no server storage, no data leaves the device, unless the person explicitly
asks for something that requires it (a reminder). Everything else about the feature
list below serves this one rule.

## Feature list

1. **Zero signup to use the calculator.**
   No account, no login wall, no email capture before showing a result. Someone lands on
   the page, types numbers, sees their tax, and can leave. This is the single highest-value
   piece of the app and it must have the lowest possible friction.

2. **Fully client-side calculation.**
   All tax logic (slabs, exemptions, rebate, minimum tax, surcharge) runs in the browser,
   in JavaScript. Nothing is sent to any backend by default. No network request fires when
   someone types an income number.

3. **Net wealth / surcharge section is opt-in and visually separated.**
   Hidden by default behind a plain toggle: "Do you have significant assets or property?
   Check this if it applies to you." Most users don't hit the surcharge thresholds, so the
   default form should not look or feel like a wealth declaration. Only users who explicitly
   opt in see the net wealth, multiple-car, and large-property fields.

4. **Account only appears at the one moment it's actually needed: reminders.**
   If someone wants a maturity reminder for an investment (a feature outside this module,
   but the same rule applies going forward), that is the only point where we ask for
   anything to be saved, and we say exactly why: "Want us to remind you when this matures?
   We'll need to save this one detail." No general "create your financial profile" wall.

5. **Explicit, visible data-location statement.**
   Somewhere prominent on the calculator, not buried in a privacy policy: "Calculated on
   your device. Nothing is sent to our server." This is a claim we can actually make and
   back up with the architecture, so it should be said plainly, not hinted at.

6. **Estimate framing throughout, not filing framing.**
   Language is "estimate your tax," "see roughly where you stand," never "your tax return"
   or "file your taxes here." Lower stakes wording makes people more willing to enter
   real-ish numbers, and it's also just accurate, since this isn't an official record.

7. **Consistent trust posture across Takatox and KhorochPati.ai.**
   Whatever data-handling language and mechanism we use here should be reused for
   KhorochPati.ai rather than reinvented, since that app's SMS-based tracking is an even
   heavier trust ask. Don't solve "convince a Bangladeshi user to trust you with money data"
   twice under two different brands.

## Explicitly out of scope for this module

- Any account creation flow
- Any backend database write
- Any analytics that capture the actual numbers typed in (aggregate, anonymous usage counts
  are fine later; the income/investment figures themselves should not be logged)
