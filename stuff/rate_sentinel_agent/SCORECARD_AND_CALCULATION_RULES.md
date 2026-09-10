# Rate Sentinel: Scorecard & Calculation Rules

This document governs how the Rate Sentinel Agent and the `/rates` page calculate and present bank deposit returns to users.

---

## 1. The Real Net Return Problem

In Bangladesh, banks advertise **Headline Gross Rates** (e.g. 10.5%). However, what actually hits a depositor's account is significantly lower due to:
1. **Withholding Tax / Tax Deducted at Source (TDS)**:
   - Depositors **with a TIN / Proof of Return Submission**: **10% TDS**.
   - Depositors **without a TIN / Proof of Return Submission**: **15% TDS**.
2. **Compounding Frequency**:
   - Compounded monthly, quarterly, semi-annually, or simple interest at maturity.
3. **Excise Duty**:
   - Bank balances above ৳1,00,000 are subject to government excise duty at year-end.

---

## 2. Deterministic Calculation Formula

For an investment principal $P$ over a tenor of $T$ years at an annual gross rate $r$:

### Step 1: Gross Return Calculation
If interest compounds $n$ times per year ($n=12$ for monthly, $n=4$ for quarterly, $n=1$ for annual):
$$A_{gross} = P \times \left(1 + \frac{r}{n}\right)^{n \times T}$$
$$\text{Gross Interest Earned } (I_{gross}) = A_{gross} - P$$

If simple interest at maturity:
$$I_{gross} = P \times r \times T$$

### Step 2: TDS Withholding Tax Deduction
$$\text{TDS Rate } (\tau) = \begin{cases} 0.10 & \text{if user has TIN / Return Acknowledgment} \\ 0.15 & \text{if no TIN / Return Acknowledgment} \end{cases}$$
$$\text{Tax Deducted } (TDS) = I_{gross} \times \tau$$

### Step 3: Net Return & Effective Net Annual Yield
$$\text{Net Payout } (A_{net}) = P + I_{gross} - TDS$$
$$\text{Effective Net Annual Yield } (r_{net}) = \left(\frac{A_{net}}{P}\right)^{\frac{1}{T}} - 1$$

### Example Calculation:
- **Principal ($P$)**: ৳1,00,000
- **Tenor ($T$)**: 1 Year
- **Headline Rate ($r$)**: 11.0% (Quarterly Compounding, $n=4$)
- **Gross Payout**: $100,000 \times (1 + 0.11/4)^4 = ৳111,462$ (Gross Interest = ৳11,462)
- **TDS Deduction (10% with TIN)**: $11,462 \times 0.10 = ৳1,146$
- **Net Profit**: $11,462 - 1,146 = ৳10,316$
- **True After-Tax Yield**: **10.32%** (If without TIN, 15% TDS cuts it down to **9.74%**!)

---

## 3. Scorecard Presentation & Neutrality Rules

### The "No Verdict" Policy
1. **Never Rank as "Best" or "Worst"**: The scorecard defaults to sorting by *Tenor* or alphabetical *Bank Name*. Users can sort by net return if they wish, but the app never labels a bank as "Recommended" or "#1".
2. **Side-by-Side Context**:
   - Always show the **Bangladesh Bank Weighted Average Rate** as a horizontal reference line or comparative stat.
   - Display a persistent disclaimer banner:
     > *"These rates are compiled from publicly available bank circulars and updated daily. After-tax return is an estimate based on statutory TDS rules. Takatox does not endorse or recommend any bank."*
3. **No Surcharges or Commission Links**:
   - There are zero affiliate or commission links to open bank accounts. Every bank link goes directly to the public institutional website of that bank.
