# ⚖️ TakaTalks Judge Agent

The **Judge Agent** is the autonomous gatekeeper, auditor, and quality assurance engine of the TakaTalks repository (`takatalks.com`).

While other agents in `stuff/` (`content_agent`, `rate_sentinel_agent`, etc.) focus on domain workflows, the Judge Agent runs autonomously on every git push to `main` (and on-demand in local environments) to enforce financial calculation accuracy, code health, privacy & security constraints, repository hygiene, and product integrity.

---

## 🎯 Mandate & Evaluation Pillars

The Judge Agent evaluates changes across **6 Core Pillars**:

| Pillar | Evaluation Scope | Enforcement Level |
|---|---|---|
| **1. Code Health & Types** | Runs `tsc --noEmit`, `eslint`, and `vitest`. Checks for zero TypeScript errors, zero lint warnings, and 100% test pass rate. | **Strict Blocking (Exit 1)** |
| **2. Financial & Tax Law Compliance** | Verifies NBR income tax slabs (5% to 30%), statutory salary exemption cap (৳4,50,000 / 1/3 fraction), city vs. rural minimum tax (৳5k/৳4k/৳3k), non-compounding Sanchayapatra modeling, and Car AIT Section 153 tables. | **Strict / Warning** |
| **3. Security, Auth & Privacy** | Audits session HMAC verification, zero plaintext secret storage, prevention of pre-verification account merging/takeover, and detection of accidental API key commits. | **Strict Blocking (Exit 1)** |
| **4. Repo Hygiene & Performance** | Flags large tracked files (>1MB), video binaries committed in git, stray OS `.DS_Store` files, unpaginated serverless cron queries, and database drift. | **Warning / Advisory** |
| **5. Copy & Cultural Integrity** | Flags unlocalized UI strings and confusing colloquial Banglish copy to preserve institutional financial authority. | **Advisory** |
| **6. Strategic AI Evaluation** | (Optional) Calls Google Gemini or OpenAI to provide a high-level strategic product and architectural critique of the commit diff. | **Advisory** |

---

## 🚀 How It Runs

### 1. Automatically on GitHub Actions (`.github/workflows/judge.yml`)
Triggered automatically on every push to `main`:
- Executes the full verification suite.
- Publishes a rich Markdown score table and report directly to GitHub Job Summaries (`$GITHUB_STEP_SUMMARY`).
- Leaves an automated audit comment on the commit via GitHub REST API.
- Stores `judge-report.md` as an actionable build artifact.

### 2. Locally Before Pushing
Run from the root or `web/` directory:
```bash
# From repository root:
node tools/judge/judge.mjs

# Or from web/:
npm run judge
```

### 3. Optional LLM Judge Activation
To enable AI-powered deep semantic critique on GitHub or locally, set:
```bash
export GEMINI_API_KEY="your-gemini-key"
# or
export OPENAI_API_KEY="your-openai-key"
```
If unset, the Judge Agent seamlessly falls back to the deterministic audit suite.

---

## 📁 Artifacts Produced

- **Console Output**: Real-time ANSI colored scorecard and breakdown.
- **`judge-report.md`**: Markdown report detailing commit author, changed files, scorecard, and prioritized findings.
- **GitHub Step Summary**: Rendered directly in GitHub Actions UI for team visibility.
