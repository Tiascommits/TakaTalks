# Tax Watchdog: Monitoring & Change Detection

This document specifies the target official portals, keyword triggers, and parsing logic used by the **Tax Watchdog Agent** to detect statutory tax revisions.

---

## 1. Monitored Government & Regulatory Portals

The agent periodically scrapes and parses text and PDF documents from these authoritative domains:

1. **National Board of Revenue (NBR)**:
   - URL: `https://nbr.gov.bd/`
   - Section: *Income Tax > SROs & Circulars / Paripatro (পরিপত্র)*
2. **Ministry of Finance (MoF)**:
   - URL: `https://mof.gov.bd/`
   - Section: *Budget Documents > Finance Bill (অর্থ বিল) & Speech*
3. **Department of Printing and Publications (BG Press)**:
   - URL: `http://www.dpp.gov.bd/bgpress/`
   - Section: *Extraordinary Bangladesh Gazette (বাংলাদেশ গেজেট)*
4. **Bangladesh Bank Circulars**:
   - URL: `https://www.bb.org.bd/`
   - Section: *BRPD / Foreign Exchange circulars affecting remittance withholding or freelancer accounts*

---

## 2. Keyword & Regulatory Taxonomy

The agent runs natural language checks against newly uploaded notifications looking for these high-impact triggers:

| Target Area | Bengali Keywords | English Keywords | Impact on Codebase |
|---|---|---|---|
| **Tax-Free Thresholds** | করমুক্ত আয়ের সীমা, ব্যক্তি করদাতা, নারী ও প্রবীণ করদাতা | Tax-free ceiling, Individual threshold, female & 65+ | Updates `taxFreeLimits` by category in config |
| **Progressive Slabs** | করের হার, প্রথম, পরবর্তী, সর্বোচ্চ কর | Slab rates, next X lakh, top marginal rate (30%) | Updates `incomeSlabs` array |
| **Salary Exemption** | বেতন খাতের কর অব্যাহতি, এক-তৃতীয়াংশ, ৫ লাখ টাকা | Salary exemption, 1/3 gross, 500k ceiling | Updates `salaryExemption` logic |
| **Investment Rebates** | বিনিয়োগ কর রেয়াত, সঞ্চয়পত্র, ডিপিএস, অনুমোদিত তহবিল | Investment rebate, Schedule 2A, DPS 1.2L cap | Updates `rebateRules` & eligible instruments |
| **Net Wealth Surcharge** | সম্পদ সারচার্জ, নিট পরিসম্পদ, একাধিক মোটরগাড়ি | Net wealth surcharge tiers, 4 crore ceiling | Updates `surchargeTiers` |
| **Minimum Tax** | ন্যূনতম কর, ঢাকা ও চট্টগ্রাম সিটি কর্পোরেশন | Minimum tax, City Corporation, first-time filer | Updates `minimumTaxRules` |
| **Capital Gains** | মূলধনী লাভ, স্টক এক্সচেঞ্জে তালিকাভুক্ত শেয়ার | Capital gains, listed shares, 5-year holding | Updates `capitalGainsRules` |

---

## 3. Change Detection & Notification Payload

When the agent flags an SRO or Finance Act amendment:
1. It downloads the gazette PDF and hashes it for provenance.
2. It extracts the text surrounding the matched section.
3. It constructs a summary diff payload:

```json
{
  "event": "TAX_LAW_CHANGE_DETECTED",
  "source": "Bangladesh Gazette Extraordinary, Finance Act 2026",
  "documentUrl": "https://mof.gov.bd/budget/finance_act_2026.pdf",
  "detectedChanges": [
    {
      "parameter": "generalTaxFreeLimit",
      "oldValue": 350000,
      "newValue": 400000,
      "confidence": 0.96,
      "excerpt": "ব্যক্তি করদাতার মোট আয়ের প্রথম ৪,০০,০০০ (চার লক্ষ) টাকা পর্যন্ত করের হার শূন্য (০%) হইবে..."
    },
    {
      "parameter": "salaryExemptionMaxCap",
      "oldValue": 500000,
      "newValue": 550000,
      "confidence": 0.91,
      "excerpt": "মোট আয়ের এক-তৃতীয়াংশ বা ৫,৫০,০০০ (পাঁচ লক্ষ পঞ্চাশ হাজার) টাকার মধ্যে যাহা কম..."
    }
  ],
  "requiresAction": "DRAFT_CONFIG_UPDATE"
}
```
