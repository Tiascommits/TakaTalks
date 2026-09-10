# Lifecycle Agent: Reinvestment & Tracker Sync

This document outlines how the **Lifecycle Agent** handles payout confirmation, updates the user's reinvestable cash pool in `/tracker`, and seamlessly transitions them to the `/rates` comparison scorecard without issuing illegal investment advice.

---

## 1. Payout Confirmation Flow

When an investment matures, the expected interest might differ slightly from the actual received interest due to:
- Precise day-count conventions ($365$ vs $360$ days).
- Withholding tax rate applied by the bank (10% vs 15%).
- Bank account maintenance or ledger fees.

### UX Flow in `/tracker`:
1. When the user visits `/tracker` or taps their notification link, a banner appears:
   > *"Your ৳2,00,000 FDR with BRAC Bank matured on 15 Oct. Expected payout: ৳2,22,400. Did you receive this exact amount?"*
2. The user can either:
   - Tap **`[Confirm ৳2,22,400]`** (Instant 1-click confirmation).
   - Or tap **`[Edit Actual Amount]`** to adjust for any minor bank charges.

---

## 2. The "Reinvestable Cash" Pool

Once confirmed, the investment status changes from `ACTIVE` to `MATURED_CONFIRMED`.

```prisma
// Status transition in Prisma:
// InvestmentEntry.status: "ACTIVE" -> "MATURED" -> "CONFIRMED_PAYOUT"
```

The payout balance is immediately added to the user's visible **Reinvestable Cash** card:

```
+-------------------------------------------------------+
|  💰 Reinvestable Cash Available: ৳2,22,400             |
|  This money is currently unallocated.                 |
|                                                       |
|  [ Compare Fresh FDR Rates ]   [ Deploy to New DPS ]  |
+-------------------------------------------------------+
```

---

## 3. Guiding the Reinvestment Decision (The Safe Math Boundary)

As mandated by [`docs/product-notes.md`](file:///Users/blackbird/INOVACE/TakaTalks/docs/product-notes.md):
- The app must **NEVER** display an AI recommendation like: *"You should put this ৳2,22,400 into Bank ABC"*.
- Instead, clicking `[ Compare Fresh FDR Rates ]` sends the user to `/rates?amount=222400`:
  1. The scorecard automatically runs the after-tax calculations on that specific principal (৳2,22,400).
  2. The user sees exact after-tax annual profit projections across verified banks.
  3. The decision remains completely in the user's hands.

---

## 4. Automatic Tax Profile Synchronization

Any verified payout or new investment created from reinvested cash is automatically synced to the user's tax profile:
- New DPS/Sanchayapatra entries are instantly counted toward their current year's **Eligible Investment Rebate** in `/calculator`.
- The user never has to re-type investment numbers when tax filing season arrives in November.
