# Decision Gate: System One's Jev Policy and Boundaries

Status: **Open / Ready for Review (2026-10-05)**.  
Needs input from project owner before enabling live external API calls.

---

## 1. What Needs Agreement

We evaluated adding **System One's Jev** (by TypeSafe AI) to TakaTalks as an ultra-fast, non-autoregressive decision model (`Noul`, `Choice`, `Score`).

Before writing integration code, we need agreement on three key boundaries:

### Boundary A: The Advice-vs-Math Line (Non-Negotiable)
- **Rule**: Jev must NEVER be used to answer *"Which bank is safest?"*, *"Which bank should I deposit in?"*, or generate a composite bank health score.
- **Why**: Under BSEC and Bangladesh Bank regulations, this is regulated financial advice. Furthermore, Bangladesh's banking sector has documented balance-sheet distress (negative CRAR, high NPLs). Our stance has always been: show audited disclosures side-by-side with exact dates and let the user decide.
- **Permitted use**: Classifying document types (`annual_report` vs `credit_rating`), verifying whether an extracted rate is a deposit or a loan, and parsing SMS notifications.

### Boundary B: Privacy & On-Device Processing
- **Rule**: TakaTalks calculates taxes on-device ("Ask for less, not more"). A user's private financial statement or tax return numbers must NOT be transmitted to an external API.
- **Permitted use**: Jev will only be called server-side during backend cron jobs (crawling annual report URLs, parsing rate tables), or on anonymous on-ramp intent routing strings that contain no personally identifiable financial records.

### Boundary C: Shadow-Mode Rollout Before Auto-Publishing
- **Rule**: Any automated classification (e.g. rate anomaly guard, annual report PDF picking) must run in **shadow mode** alongside our existing regex/heuristics for at least 2 consecutive scrape cycles before taking over decisions.
- **Review**: Differences will be logged to `admin/digest.ts` so human admins can verify accuracy without downtime.

---

## 2. Decision Checklist

- [ ] Confirm `TYPESAFE_API_KEY` procurement and account setup on TypeSafe AI.
- [ ] Confirm Phase 1 priority: wire into `src/lib/bank-health/fetch-reports.ts` to replace brittle `pickAnnualReportLink` regex.
- [ ] Confirm whether SMS parsing should be shared with KhorochPati.ai or prototyped in TakaTalks tracker first.
