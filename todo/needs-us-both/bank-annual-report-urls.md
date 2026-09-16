# Supply annual-report / DSE URLs per bank (Module 5: bank-health disclosure)

Status: **done for 7 of the 9 configured banks, 2026-09-16.** The URLs are in
`src/config/banks.ts` and get upserted onto the `Bank` rows by `runScrape`, so Module 5
has real sources now. Two banks genuinely have no usable page — see below. Nothing here
needs you unless you want to chase those two.

Every URL was verified live, never derived from a pattern (prompts/03):

- each `annualReportPageUrl` was fetched and confirmed to serve the bank's own annual
  report as a PDF link in its **server-rendered** HTML, which is what
  `src/lib/bank-health/fetch-reports.ts` needs;
- each `dseCompanyUrl` was checked against DSE's own listed-company index and its
  "Company Name:" field confirmed to be that bank.

## Configured banks

| Bank | annualReportPageUrl | dseCompanyUrl |
|---|---|---|
| AB Bank PLC | `abbl.com/investor-relations/` | `…name=ABBANK` |
| Midland Bank PLC | `midlandbankbd.net/annual-report` | `…name=MIDLANDBNK` |
| One Bank PLC | `onebank.com.bd/home/financial/annual-reports` | `…name=ONEBANKPLC` |
| National Bank PLC | `nblbd.com/investors-relations/annual-report` — see TLS note | `…name=NBL` |
| The City Bank PLC | **none usable** — see below | `…name=CITYBANK` |
| IFIC Bank PLC | `ificbank.com.bd/annual-report` | `…name=IFIC` |
| Sonali Bank PLC | **none exists** — see below | not DSE-listed (wholly state-owned) |
| Eastern Bank PLC | `ebl.com.bd/annual-reports` | `…name=EBL` |
| Standard Chartered Bank | `sc.com/bd/important-information/` | not DSE-listed (branch operation) |

Verified end-to-end: 6 of the 7 banks with a URL resolve to their current **2025** annual
report and the PDF fetches successfully.

### The two gaps

- **The City Bank PLC** — `citybankplc.com` is a client-rendered Next.js app. Neither
  `/reports` nor `/p/investor-relation` contains any report data in its server HTML (zero
  PDF links, and nothing in the RSC payload either), so the fetch-based pipeline has
  nothing to read. Fixing it needs either a headless-browser fetch for this one bank, or
  the direct report URLs pasted in by hand at `/admin/banks/[id]`. Note the bank also
  moved domain: the old `thecitybank.com` now redirects to `citybankplc.com`.
- **Sonali Bank PLC** — publishes no annual-report listing page at all. The reports exist
  only as direct PDFs under `sonalibank.com.bd/PDF_file/` (whose directory index is
  disabled), and the home page links just the current audited financial statement among
  unrelated PDFs. Would need a specific PDF URL supplied by hand each year.

### TLS note on National Bank

The URL is correct and serves annual reports for 2015-2024, but `nblbd.com` presents an
incomplete TLS chain (it omits the intermediate certificate), so Node's `fetch` rejects it
with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` where browsers and curl succeed. It is recorded
anyway, deliberately: the monthly check then logs a visible `fetch_error` for the bank in
`/admin/bank-health`, rather than the bank looking like it was never configured. If you
want it working, the options are a custom CA bundle that includes the intermediate, or
asking the bank to fix its chain.

## Not-yet-configured banks

BRAC Bank, Dutch-Bangla Bank and Islami Bank Bangladesh are not in `config/banks.ts` (see
`confirm-new-bank-list.md` — they were left out for lack of a scrapeable *rate* source).
Their annual-report pages were verified in the same pass, so if you do add them, these are
ready and each resolves to its 2025 report:

| Bank | annualReportPageUrl | dseCompanyUrl |
|---|---|---|
| BRAC Bank PLC | `bracbank.com/en/page/annual-report-2025` (per-year page; the IR hub is JS-rendered) | `…name=BRACBANK` |
| Dutch-Bangla Bank PLC | `dutchbanglabank.com/investor-relations/financial-statements.html` | `…name=DUTCHBANGL` |
| Islami Bank Bangladesh PLC | `islamibankbd.com/annual-report` | `…name=ISLAMIBANK` |

`dseCompanyUrl` values are all `https://www.dsebd.org/displayCompany.php?name=<CODE>`.

## Picking the right document needed fixing too

Supplying the URLs wasn't sufficient on its own. The old selection rule — first PDF on the
page, or any `href` containing "annual" — chose the **wrong document on 5 of the verified
pages**: AB Bank's investor page yielded a 2014 credit-rating letter, Standard Chartered's
a reward-points leaflet, EBL's a standalone directors' report. `pickAnnualReportLink` now
scores candidates, penalises the documents that sit next to annual reports (credit
ratings, Basel III disclosures, quarterly and ESG reports), breaks ties on the newest bare
4-digit year so an upload timestamp can't read as one, and returns null instead of
guessing. Every case above is a regression test in `fetch-reports.test.ts`.
