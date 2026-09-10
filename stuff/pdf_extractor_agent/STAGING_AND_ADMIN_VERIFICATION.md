# PDF Extractor: Staging & Admin Verification Workflow

This document specifies the human-in-the-loop review workflow, data staging tables, and audit safeguards ensuring no hallucinated or unverified bank metric is ever exposed on TakaTalks.

---

## 1. Staging Database Schema

All extraction results are initially saved with `status = "PENDING_VERIFICATION"`.

```prisma
model BankAnnualReportStaging {
  id                    String   @id @default(cuid())
  bankCode              String
  fiscalYear            Int
  reportingBasis        String   // "Solo" | "Consolidated"
  crarPercentage        Float?
  tier1CapitalPercentage Float?
  grossNplPercentage    Float?
  netNplPercentage      Float?
  provisionShortfallBDT Float?
  roaPercentage         Float?
  auditorName           String?
  auditorOpinion        String?
  sourcePdfUrl          String
  sourcePagesJson       Json
  rawExtractedJson      Json
  confidenceScore       Float
  status                String   @default("PENDING_VERIFICATION") // "PENDING_VERIFICATION" | "APPROVED" | "REJECTED" | "MODIFIED"
  verifiedByUserId      String?
  verifiedAt            DateTime?
  rejectionReason       String?
  createdAt             DateTime @default(now())
}
```

---

## 2. Admin Review UI Specification (`/admin/bank-reports`)

The admin interface provides a side-by-side comparison between the extracted data and the original PDF page snippet:

### Left Pane: Extracted Data Fields
- Editable form fields pre-filled by the extraction agent.
- Highlighting for abnormal metrics:
  - Red warning if `grossNplPercentage > 10.0%`.
  - Red warning if `crarPercentage < 12.5%` (below Basel III minimum).
  - Amber warning if `auditorOpinion != "Unqualified"`.
  - Amber badge if `confidenceScore < 0.85`.

### Right Pane: Embedded PDF Page Viewer
- Deep links to the exact PDF page listed in `sourcePagesJson` (`#page=142`).
- Allows the human admin to glance at Note 7.2 (Classification of loans) or Schedule of Capital Adequacy and confirm the numbers in 30 seconds.

### Actions:
- **`[Approve & Publish]`**: Moves the staged record into `BankHealthMetric` table and invalidates cache on `/rates`.
- **`[Modify & Approve]`**: Saves corrections, logs human editor ID, updates status to `MODIFIED`, and pushes to production.
- **`[Reject]`**: Marks record as `REJECTED`, requiring re-upload of official document or manual entry.

---

## 3. Public Scorecard Display Policy

Once approved, how is this data presented to public users on TakaTalks?

1. **Exact Sourced Attribution**:
   > *"Sourced from Audited Annual Report 2025 (Solo), Page 148, audited by A. Qasem & Co. Chartered Accountants. Approved on 14 May 2026."*
2. **Missing Data Transparency**:
   - If a bank has not released its annual report, or if NPL figures were not clearly certified by an auditor, TakaTalks NEVER displays an estimated guess. It displays:
     > *"⚠️ Audited 2025 Annual Report not publicly available or disputed. Figure omitted."*
3. **No Subjective Health Verdicts**:
   - TakaTalks never displays a badge like *"Safe Bank"* or *"Risky Bank"*.
   - It shows the numbers side by side with the **Bangladesh Bank Regulatory Minimums** (e.g. CRAR 12.5%, NPL < 5%) and allows users to make their own informed assessment.
