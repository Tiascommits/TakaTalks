# Repurpose Agent: Automation Workflow & Pipeline

This document explains how to trigger, run, and automate the **Repurpose Agent** using CLI scripts or AI subagent invocations.

---

## 1. Input-Output Execution Flow

The workflow is designed to run automatically whenever a new script is added or updated in `stuff/content_agent/`:

```bash
# Example command to run the repurpose workflow
node tools/repurpose-script.js --source stuff/content_agent/01_SCRIPTS_30S_RAPID_HOOKS.md --topic "1_lakh_salary"
```

### Generated File Directory Structure:
```
dist/social_content/
└── 2026-09-tax-rebate/
    ├── facebook_post.txt
    ├── linkedin_carousel.pdf (or .md slides)
    ├── whatsapp_digest.txt
    └── twitter_thread.md
```

---

## 2. LLM Transformation Prompt for Subagents

When using an AI subagent to execute the repurposing, use this prompt:

```markdown
You are the Social Media & Distribution Specialist for TakaTalks, a personal finance platform in Bangladesh.

Read the attached video script:
{source_script_markdown}

Your task:
1. Extract the core financial insight, numbers, and value proposition.
2. Produce four tailored platform versions following the exact templates in `stuff/repurpose_agent/TEMPLATES_AND_FORMATS.md`:
   - Version A: Long-form Facebook Banglish Post with authentic storytelling and comments CTA.
   - Version B: 6-Slide LinkedIn Carousel outline with concise text.
   - Version C: Compact, forward-friendly WhatsApp digest.
   - Version D: 4-tweet Twitter/X thread.
3. Preserve the privacy guarantees ("No signup, 100% on-device") and ensure no financial advice violations occur.
```

---

## 3. Quality Assurance Checklist Before Posting

Before publishing any repurposed asset:
- [ ] Are all financial numbers mathematically accurate and consistent with `src/config/tax-rules-2025-26.ts`?
- [ ] Does the post avoid ranking any bank as "best" or giving unregulated investment advice?
- [ ] Is the link to `takatalks.com` prominent and placed in the first comment (for Facebook) or body (for LinkedIn/WhatsApp)?
- [ ] Is the privacy reassurance ("Zero signup, calculates on your phone") included?
- [ ] Are Bengali characters rendering properly with no broken conjuncts (যুক্তাক্ষর)?
