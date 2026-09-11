# Supply annual-report / DSE URLs per bank (Module 5: bank-health disclosure)

Status: blocking Module 5's data, not its code. The extraction pipeline, admin review
screen, and scorecard panel are all built and will run — but they show "not disclosed /
not extracted" for every bank until a real page URL exists for it, per the project's own
rule (prompts/03): the correct annual-report-listing page per bank has to be supplied
manually, never guessed from a URL pattern, because every bank's site is structured
differently.

Two URL fields exist per bank on the `Bank` model, editable from `/admin/banks/[id]`:
- `annualReportPageUrl` — the bank's investor-relations / annual-report listing page.
- `dseCompanyUrl` — its Dhaka Stock Exchange company page, if listed (DSE's filing format
  is more consistent across banks than each bank's own site, so prefer this when available).

## Banks needing a URL

| Bank | annualReportPageUrl | dseCompanyUrl |
|---|---|---|
| AB Bank PLC | | |
| Midland Bank PLC | | |
| One Bank PLC | | |
| National Bank PLC | | |
| The City Bank PLC | | |
| IFIC Bank PLC | | |
| Sonali Bank PLC | | |
| Eastern Bank PLC | | |
| Standard Chartered Bank | | |
| BRAC Bank PLC | | |
| Dutch-Bangla Bank PLC | | |
| Islami Bank Bangladesh PLC | | |

Fill in whichever you can find/verify (even a partial list is useful — the pipeline treats
each bank independently) and either paste them back or enter them directly via
`/admin/banks/[id]` once that page is live. Start with 1-2 banks as a pilot if you want to
sanity-check the extraction quality before doing the whole list — PDF layouts vary enough
that first-pass extraction accuracy will vary per bank, which is why every extracted figure
requires manual approval before it's shown publicly.
