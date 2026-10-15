# Coding standards (judgement calls)

Reviewer: check the diff against these. `scripts/check.sh` covers the mechanical checks.

- Cite: every tax or rate constant (slabs, rebate caps, minimum tax, source-tax rates, Sanchayapatra and FDR rates, nisab, excise bands) cites a primary source (gazette, Act section, NBR, National Savings Directorate or Bangladesh Bank notice) with the date it was checked. A news or advisory-firm source alone needs an `owner-confirm:` comment. Why: the site promises Bangladesh's actual rules, and a wrong tax figure does more harm than a missing feature.
- Prove: every such constant has a test that reproduces a worked example from that source, or from a tax practitioner, to the taka. Why: the Oct 14 critique found a slab the Finance Act 2026 had abolished, and no test noticed.
- Date: never show a scraped or outside number (bank rate, metal price, bond yield) without its source and last-checked date beside it. A stale value is labelled stale, never shown as current. Why: people move money on these numbers.
- No verdicts: no composite "best bank" score, rank or badge. A sort order is labelled "not a verdict", and bank-health figures reach the public only after an admin approves them. Why: liability, and one wrong extraction would read as advice.
- Derive: tax, rebate, after-tax yield and EMI come from the engines in `web/src/lib/<domain>/`, never re-implemented in a component. Why: `/salary` and `/freelance` drifted from `/calculator` until round 1.
- Migrate: a column drop ships one release after the code stops using it, and a migration never runs from a preview build. Why: Vercel's instant rollback cannot undo a drop; the Oct 8 preview likely dropped `TaxProfile.firstTimeFiler` in production.
- Claim: the homepage, tool cards, metadata descriptions and READMEs describe only what works in production today. Empty data shows an honest empty state, never a placeholder number. Why: the critique found features advertised that were not live.
- Privacy: calculator inputs stay in the browser. Analytics are GoatCounter pageviews and named events, never a typed figure. Anything new sent or stored about a person updates `/privacy` in the same change. Why: the legal pages promise this.
- Guard: routes that touch user rows check the signed session's owner; admin and cron routes compare their secret in constant time; new POST routes get a rate limit (`web/src/lib/rate-limit.ts`). Why: round 1 closed an account-fixation path and unlimited login links.
- Escape: text from users or URL params renders as text, never HTML (`// safe-html: <reason>` only for constants). Why: one injected script could act as the visitor on every tracker and account route.
- Bilingual: every user-facing string goes through `t(en, bn)` with both languages filled in. Why: the toggle falls back silently and leaves mixed UI.
