# TakaTalks: 11 values for a tax practitioner to confirm (Nov 2026)

TakaTalks (a free Bangladeshi tax and savings calculator) marks every value no primary source confirms with `owner-confirm:` in the code. Four were settled on 2026-11-01 from KPMG "Bangladesh Tax 2026" pp. 45-52 and NBR "FAQ- e-Return 2026" Q46(3). These 11 remain. For each one, write the answer and a citation (Act section, SRO, NBR circular or NSD/BB notice, with date). About 30 minutes each, half a day in all.

Practitioner: ____________________  Date: __________  Signature: __________

**1. Late-filing additional tax base** (`web/src/config/tax-rules-2025-26.ts`, `lateFilingExtraTax`)
Now: 2% (min ৳3,000) 1 Jan-31 Mar 2027, 5% (min ৳5,000) 1 Apr-30 Jun 2027, applied to tax payable after tax already deducted at source. Shows: `/calculator` result, "Filing later adds tax".
Q: Is "net payable tax" (নীট প্রদেয় কর) before or after TDS/advance tax? Does the ৳3,000/৳5,000 floor apply when nothing is payable?
Answer: ______________________________  Citation: ______________________________

**2. Mutual funds uncapped for this income year** (`tax-rules-2025-26.ts`, `instruments` → `mutual_fund`)
Now: mutual fund and unit fund investment counts for rebate with no cap. Shows: `/calculator` section 5 "Investment (rebate eligible)".
Q: Does the Finance Act 2026 uncapped rule cover investments made 1 Jul 2025-30 Jun 2026 (AY 2026-27), or only from 1 Jul 2026?
Answer: ______________________________  Citation: ______________________________

**3. Sanchayapatra lower rate above ৳7.5 lakh** (`web/src/lib/instruments/instruments.ts`, `SANCHAYA_TIER_SPLIT`)
Now: once total holding is above ৳7.5 lakh, the lower rate (e.g. Paribar 11.80% vs 11.93%) applies to the whole holding. Shows: `/instruments` matrix, `/reinvest`, `/tracker` projections.
Q: Does the lower rate apply to the whole holding or only to the amount above ৳7.5 lakh?
Answer: ______________________________  Citation: ______________________________

**4. Sanchayapatra source tax band** (`instruments.ts`, `sanchayaTds`)
Now: 5% source tax on profit when total holding is up to ৳5 lakh, 10% above. Shows: `/instruments` "after-tax yield".
Q: Is the 5% band up to ৳5 lakh or ৳10 lakh, and does it survive the Finance Act 2026 change to adjustable advance tax?
Answer: ______________________________  Citation: ______________________________

**5. Paribar Sanchayapatra individual cap** (`instruments.ts`, `paribar-sanchaya.individualCap`)
Now: ৳45 lakh. Shows: `/instruments` warning "Investment exceeds individual statutory limit".
Q: What is the current single-holder limit (45 lakh, or 1 crore including other Sanchayapatra)?
Answer: ______________________________  Citation: ______________________________

**6. Treasury bond / Sukuk yield and source tax** (`instruments.ts`, `treasury-bond-sukuk`)
Now: 11.85% yield, 5% source tax, labelled "Illustrative yield". Shows: `/instruments`, `/tracker`.
Q: What source tax applies to an individual's T-bond and Sukuk coupon in AY 2026-27? (Yield: we will cite a Bangladesh Bank auction result.)
Answer: ______________________________  Citation: ______________________________

**7. Commercial bank FDR rate** (`instruments.ts`, `bank-fdr-top`)
Now: 9.75%, labelled "Illustrative bank rate"; source tax 10% with proof of return, 15% without. Shows: `/instruments`, `/tracker`.
Q: Confirm 10%/15% FDR interest source tax for AY 2026-27. (Rate: we will cite a dated bank quote.)
Answer: ______________________________  Citation: ______________________________

**8. Mutual fund yield** (`instruments.ts`, `mutual-fund-unit`)
Now: 8.75% "indicative", 10%/15% source tax on dividend. Shows: `/instruments`, `/tracker`.
Q: Is 10% (with return) / 15% (without) the right source tax on an individual's mutual fund dividend?
Answer: ______________________________  Citation: ______________________________

**9. Loan preset rates** (`web/src/lib/loans/loans.ts`, `LOAN_PRESETS`)
Now: illustrative rates (home 10.5%, etc.) set 2026-09-13, shown next to the Bangladesh Bank average lending rate (11.83%, Aug 2026). Shows: `/loans` presets.
Q: Not a tax question. Owner decides: keep as labelled examples or replace with a dated bank quote.
Answer: ______________________________  Citation: ______________________________

**10. Excise duty bands on balances** (`loans.ts`, `calculateExciseDuty`)
Now: nil to ৳3 lakh; ৳150 to 5 lakh; ৳500 to 10 lakh; ৳3,000 to 50 lakh; ৳5,000 to 1 crore; ৳10,000 to 2 crore; ৳20,000 to 5 crore; ৳50,000 above. Shows: `/loans` "NBR Excise Duty".
Q: Confirm the ৳500, ৳5,000, ৳10,000 and ৳20,000 bands, and whether FY2026-27 raised the nil band to ৳4 lakh.
Answer: ______________________________  Citation: ______________________________

**11. Default inflation** (`web/src/config/inflation.ts`, `DEFAULT_INFLATION_PCT`)
Now: 8.5% a year. Shows: real yield on `/instruments`, `/freedom`, `/goals`, `/reinvest`.
Q: Not a tax question. Replace with the latest BBS point-to-point or 12-month average CPI, with month.
Answer: ______________________________  Citation: ______________________________

When a value is confirmed: change it only in the file named, replace its `owner-confirm:` comment with `source: <document, section/page, date>`, and add a worked-example test (`CODING_STANDARDS.md`, "Cite" and "Prove").
