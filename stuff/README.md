# TakaTalks Multi-Agent Ecosystem

This directory contains the operational specifications, prompt protocols, calculation formulas, and automation workflows for the specialized AI and pipeline agents powering **TakaTalks** (`takatalks.com`).

---

## 🗺️ Agent Directory & Architecture

```
stuff/
├── content_agent/          # 🎬 Video creation playbook, 30s/60s/3min scripts, viral hook vault
├── rate_sentinel_agent/    # 🏦 Bank deposit rate scraper, staleness detector, after-tax yield engine
├── pdf_extractor_agent/    # 📑 Audited bank report PDF extractor (CAR, NPL, ROA) + admin staging
├── tax_watchdog_agent/     # ⚖️ NBR gazette & budget monitor, tax config updates, Vitest harness
├── repurpose_agent/        # 🔁 Multi-channel repurposing (Facebook Banglish posts, LinkedIn carousels)
├── community_agent/        # 💬 Comment triage, advice-vs-math compliance guardrails, FAQ scripts
└── lifecycle_agent/        # 🔔 Maturity alerts (30/60/90 days), lazy money leaks, reinvestment sync
```

---

## 🎯 Summary of Each Agent

| Agent | Directory | Role & Mandate | Key Tools / Code Hook |
|---|---|---|---|
| **Content Agent** | [`content_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/content_agent/) | Crafts high-converting 30s, 60s, and 3min video scripts promoting TakaTalks' zero-signup tax calculator and bank comparison tools. | `01_SCRIPTS_30S_RAPID_HOOKS.md`, `05_CONTENT_CALENDAR_AND_HOOK_VAULT.md` |
| **Rate Sentinel** | [`rate_sentinel_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/rate_sentinel_agent/) | Scrapes and monitors commercial bank FDR/DPS rates daily; flags stale data; calculates true after-tax return (10% vs 15% TDS). | `web/src/app/rates`, `web/src/lib/rates/` |
| **PDF Extractor** | [`pdf_extractor_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/pdf_extractor_agent/) | Extracts audited Basel III indicators (CRAR, NPL %, Provisions) from bank annual report PDFs with human-in-the-loop admin verification. | `prompts/03-annual-report-extraction.md` |
| **Tax Watchdog** | [`tax_watchdog_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/tax_watchdog_agent/) | Monitors NBR SROs and annual national budgets; drafts PRs for `tax-rules.ts`; generates Vitest edge cases. | `web/src/config/tax-rules-2025-26.ts`, `web/src/lib/tax/*.test.ts` |
| **Repurpose Agent**| [`repurpose_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/repurpose_agent/) | Automatically converts video scripts into high-performing Facebook Banglish posts, LinkedIn carousels, and WhatsApp digests. | `TEMPLATES_AND_FORMATS.md`, `AUTOMATION_WORKFLOW.md` |
| **Community Agent**| [`community_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/community_agent/) | Triages user comments on YouTube/FB; calculates salary tax math live; strictly upholds the BSEC advice-vs-math regulatory guardrails. | `GUARDRAILS_AND_COMPLIANCE_POLICY.md`, `RESPONSE_TEMPLATES_AND_FAQ.md` |
| **Lifecycle Agent**| [`lifecycle_agent/`](file:///Users/blackbird/INOVACE/TakaTalks/stuff/lifecycle_agent/) | Monitors investment maturity dates (90, 60, 30, 7 days); sends WhatsApp/Email alerts; eliminates the "Lazy Money Leak". | `web/src/app/tracker`, `MATURITY_NOTIFICATION_SYSTEM.md` |

---

## 🔒 Foundational Principles Shared by All Agents

1. **Deterministic Math over Regulated Advice**: Calculating legal tax rebates and statutory after-tax deposit returns is deterministic math. Recommending specific banks, stocks, or funds is financial advice and strictly prohibited.
2. **Never Silently Show Stale Data**: Every extracted or displayed rate must carry an explicit source and verification timestamp.
3. **Privacy First**: Tools calculate on-device (client-side in JS) by default. Never capture phone numbers or emails unless explicitly needed for a user-requested reminder.
