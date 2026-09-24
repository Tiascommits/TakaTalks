#!/usr/bin/env node
/**
 * TakaTalks Autonomous Judge Agent
 * 
 * Runs a comprehensive repository, code, domain, security, and architectural critique.
 * Designed to execute automatically after every push to `main` via GitHub Actions,
 * and locally via `npm run judge` or `node tools/judge/judge.mjs`.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const WEB_DIR = path.resolve(REPO_ROOT, "web");

// ANSI color helpers for terminal output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(msg) {
  console.log(msg);
}

function header(title) {
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ⚖️  JUDGE AGENT: ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

function runCmd(cmd, cwd = REPO_ROOT, silent = false) {
  try {
    const stdout = execSync(cmd, {
      cwd,
      encoding: "utf8",
      stdio: silent ? "pipe" : "pipe",
    });
    return { ok: true, stdout, stderr: "", code: 0 };
  } catch (err) {
    return {
      ok: false,
      stdout: err.stdout || "",
      stderr: err.stderr || err.message,
      code: err.status || 1,
    };
  }
}

// -----------------------------------------------------------------------------
// 1. Commit and Diff Analysis
// -----------------------------------------------------------------------------
function analyzeGitState() {
  const commitHash = runCmd("git rev-parse HEAD").stdout.trim() || "unknown";
  const commitAuthor = runCmd("git log -1 --pretty=format:'%an <%ae>'").stdout.trim() || "unknown";
  const commitMsg = runCmd("git log -1 --pretty=format:'%B'").stdout.trim() || "unknown";
  const commitDate = runCmd("git log -1 --pretty=format:'%cd' --date=iso").stdout.trim() || new Date().toISOString();
  
  // Check changed files in the last commit
  let changedFiles = [];
  const diffFilesRes = runCmd("git diff-tree --no-commit-id --name-only -r HEAD");
  if (diffFilesRes.ok && diffFilesRes.stdout.trim()) {
    changedFiles = diffFilesRes.stdout.trim().split("\n").map(f => f.trim()).filter(Boolean);
  }

  // Stat summary of diff
  const diffStatRes = runCmd("git show --stat --oneline -1 HEAD");
  const diffStat = diffStatRes.ok ? diffStatRes.stdout.trim() : "";

  return {
    commitHash,
    commitAuthor,
    commitMsg,
    commitDate,
    changedFiles,
    diffStat,
  };
}

// -----------------------------------------------------------------------------
// 2. Code Quality & Verification Checks (TypeScript, ESLint, Vitest)
// -----------------------------------------------------------------------------
function runCodeChecks() {
  log(`${colors.blue}▶ Checking TypeScript types...${colors.reset}`);
  const tsRes = runCmd("npx tsc --noEmit", WEB_DIR, true);
  
  log(`${colors.blue}▶ Running ESLint...${colors.reset}`);
  const lintRes = runCmd("npm run lint", WEB_DIR, true);

  log(`${colors.blue}▶ Running Unit Tests (Vitest)...${colors.reset}`);
  const testRes = runCmd("npm test", WEB_DIR, true);

  // Extract test stats if available
  let passedTests = "All";
  const matchTests = testRes.stdout.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
  if (matchTests) {
    passedTests = `${matchTests[1]} / ${matchTests[2]}`;
  }

  return {
    ts: {
      ok: tsRes.ok,
      output: tsRes.ok ? "Clean (0 errors)" : (tsRes.stdout + "\n" + tsRes.stderr).trim(),
    },
    lint: {
      ok: lintRes.ok,
      output: lintRes.ok ? "Clean (0 errors, 0 warnings)" : (lintRes.stdout + "\n" + lintRes.stderr).trim(),
    },
    tests: {
      ok: testRes.ok,
      output: testRes.ok ? `Passed (${passedTests} tests passed)` : (testRes.stdout + "\n" + testRes.stderr).trim(),
    },
  };
}

// -----------------------------------------------------------------------------
// 3. Financial & Tax Rule Sanity Audit
// -----------------------------------------------------------------------------
function runFinancialAudit() {
  const issues = [];
  const taxConfigPath = path.join(WEB_DIR, "src/config/tax-rules-2025-26.ts");
  
  if (!fs.existsSync(taxConfigPath)) {
    issues.push({ severity: "ERROR", msg: "Tax configuration file missing: tax-rules-2025-26.ts" });
    return { ok: false, issues };
  }

  const taxConfigContent = fs.readFileSync(taxConfigPath, "utf8");

  // Check 1: 5% initial slab existence
  if (!taxConfigContent.includes("rate: 0.05") && !taxConfigContent.includes("rate: 0.05,")) {
    issues.push({
      severity: "ERROR",
      msg: "Missing statutory 5% tax slab in tax-rules-2025-26.ts (Finance Act requirement for entry-level bracket).",
    });
  }

  // Check 2: Salary exemption cap ৳4,50,000
  if (taxConfigContent.includes("salaryExemptionCap: 500000")) {
    issues.push({
      severity: "ERROR",
      msg: "Statutory salary exemption cap set to ৳5,00,000 instead of statutory ৳4,50,000 (Second Schedule, Part 1, Para 1).",
    });
  }

  // Check 3: Check minTaxFirstTime warning (discrepancy with statutory law)
  if (taxConfigContent.includes("minTaxFirstTime: 1000")) {
    issues.push({
      severity: "WARN",
      msg: "minTaxFirstTime is set to 1000. Under Bangladesh Income Tax Act 2023, there is no statutory ৳1,000 minimum tax for first-time filers (Dhaka/Ctg is ৳5,000, other cities ৳4,000, non-city ৳3,000). Filers risk NBR underpayment notices.",
    });
  }

  // Check 4: Check Sanchayapatra linear non-compounding flag
  const instrumentsPath = path.join(WEB_DIR, "src/lib/instruments/instruments.ts");
  if (fs.existsSync(instrumentsPath)) {
    const instContent = fs.readFileSync(instrumentsPath, "utf8");
    if (!instContent.includes("compounds: false") && instContent.includes("paribar-sanchaya")) {
      issues.push({
        severity: "ERROR",
        msg: "Sanchayapatra in instruments.ts is missing 'compounds: false'. Sanchayapatra profits are paid periodically and do not compound.",
      });
    }
  }

  // Check 5: Check Car AIT Section 153 Table
  const carTaxPath = path.join(WEB_DIR, "src/lib/cars/car-tax.ts");
  if (fs.existsSync(carTaxPath)) {
    const carContent = fs.readFileSync(carTaxPath, "utf8");
    if (!carContent.includes("Section 153") || !carContent.includes("baseAnnualAit: 25_000")) {
      issues.push({
        severity: "WARN",
        msg: "Car AIT tables may not align with Section 153 of Income Tax Act 2023.",
      });
    }
  }

  return {
    ok: issues.filter(i => i.severity === "ERROR").length === 0,
    issues,
  };
}

// -----------------------------------------------------------------------------
// 4. Security & Privacy Audit
// -----------------------------------------------------------------------------
function runSecurityAudit() {
  const issues = [];

  // Check 1: Session HMAC verification
  const sessionPath = path.join(WEB_DIR, "src/lib/tracker/session.ts");
  if (fs.existsSync(sessionPath)) {
    const sessionContent = fs.readFileSync(sessionPath, "utf8");
    if (!sessionContent.includes("createHmac") || !sessionContent.includes("timingSafeEqual")) {
      issues.push({
        severity: "ERROR",
        msg: "Session cookie handling in session.ts lacks cryptographic HMAC or constant-time comparison.",
      });
    }
    if (sessionContent.includes("takatalks-dev-only-session-secret") && !sessionContent.includes("NODE_ENV === \"production\"")) {
      issues.push({
        severity: "ERROR",
        msg: "Hardcoded session secret fallback allowed in production!",
      });
    }
  }

  // Check 2: Pre-verification merge vulnerability check
  const verifyPath = path.join(WEB_DIR, "src/lib/notify/verification.ts");
  if (fs.existsSync(verifyPath)) {
    const verifyContent = fs.readFileSync(verifyPath, "utf8");
    // Ensure merge is not performed in requestEmailLink
    const reqEmailIdx = verifyContent.indexOf("requestEmailLink");
    const mergeIdx = verifyContent.indexOf("mergeIntoExistingUser");
    if (reqEmailIdx !== -1 && mergeIdx !== -1) {
      // Check if merge is called inside requestEmailLink
      const reqEmailBody = verifyContent.slice(reqEmailIdx, verifyContent.indexOf("}", reqEmailIdx + 1500));
      if (reqEmailBody.includes("mergeIntoExistingUser")) {
        issues.push({
          severity: "ERROR",
          msg: "Pre-verification data hijacking vulnerability detected: mergeIntoExistingUser called during link request!",
        });
      }
    }
  }

  // Check 3: Check for accidental API secret commitments in tracked files
  const trackedFilesRes = runCmd("git ls-files", REPO_ROOT, true);
  if (trackedFilesRes.ok) {
    const files = trackedFilesRes.stdout.split("\n").filter(Boolean);
    const secretPatterns = [
      /re_[a-zA-Z0-9]{24,}/, // Resend API key
      /AIza[0-9A-Za-z-_]{35}/, // Google API key
      /sk-[a-zA-Z0-9]{32,}/, // OpenAI API key
      /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
    ];

    for (const f of files) {
      if (f.endsWith(".env") || f.endsWith(".pem") || f.endsWith(".key")) {
        issues.push({ severity: "ERROR", msg: `Sensitive file tracked in git: ${f}` });
      }
      // Check file content for secrets (excluding tests, docs, mock data)
      if (f.startsWith("web/src/") && (f.endsWith(".ts") || f.endsWith(".tsx"))) {
        const content = fs.readFileSync(path.join(REPO_ROOT, f), "utf8");
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            issues.push({ severity: "ERROR", msg: `Potential live API key detected in ${f}` });
          }
        }
      }
    }
  }

  return {
    ok: issues.filter(i => i.severity === "ERROR").length === 0,
    issues,
  };
}

// -----------------------------------------------------------------------------
// 5. Repo Hygiene, Bloat & Artifact Audit
// -----------------------------------------------------------------------------
function runRepoHygieneAudit() {
  const issues = [];

  // Check 1: Tracked files larger than 1MB
  const trackedFilesRes = runCmd("git ls-files", REPO_ROOT, true);
  if (trackedFilesRes.ok) {
    const files = trackedFilesRes.stdout.split("\n").filter(Boolean);
    for (const f of files) {
      const fullPath = path.join(REPO_ROOT, f);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.size > 1024 * 1024) {
          const mb = (stats.size / (1024 * 1024)).toFixed(2);
          issues.push({
            severity: "WARN",
            msg: `Large file tracked in git (${mb} MB): ${f}. Binary media should be hosted externally on a CDN/bucket.`,
          });
        }
        if (f.endsWith(".mp4") || f.endsWith(".mov") || f.endsWith(".avi")) {
          issues.push({
            severity: "WARN",
            msg: `Video file committed in git: ${f}. Video binaries bloat repository clone sizes.`,
          });
        }
        if (f.endsWith(".DS_Store")) {
          issues.push({
            severity: "WARN",
            msg: `OS artifact tracked in git: ${f}. Update .gitignore.`,
          });
        }
      }
    }
  }

  // Check 2: Cron query unbounded loop / pagination
  const cronPath = path.join(WEB_DIR, "src/app/api/cron/bank-health-check/route.ts");
  if (fs.existsSync(cronPath)) {
    const cronContent = fs.readFileSync(cronPath, "utf8");
    if (cronContent.includes("findMany({") && cronContent.includes("take: limit") && !cronContent.includes("orderBy")) {
      issues.push({
        severity: "WARN",
        msg: "Cron route 'bank-health-check' calls prisma.bank.findMany with 'take: limit' but no 'orderBy'. It will process the exact same bank repeatedly on every cron trigger.",
      });
    }
  }

  return {
    ok: issues.filter(i => i.severity === "ERROR").length === 0,
    issues,
  };
}

// -----------------------------------------------------------------------------
// 6. UI/UX & Copy Audit (Banglish vs Bengali, Missing Translations)
// -----------------------------------------------------------------------------
function runCopyAudit() {
  const issues = [];
  const componentsDir = path.join(WEB_DIR, "src/components");

  if (fs.existsSync(componentsDir)) {
    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
          const content = fs.readFileSync(full, "utf8");
          // Check for prominent colloquial Banglish phrases in user-facing JSX
          const banglishMatches = content.match(/"[^"]*\b(koro|dekhao|kono|tai|hobe|kothao|jonno)\b[^"]*"/gi);
          if (banglishMatches && banglishMatches.length > 0) {
            const sample = banglishMatches[0].slice(0, 50);
            issues.push({
              severity: "WARN",
              msg: `Phonetic Banglish detected in ${path.relative(REPO_ROOT, full)}: ${sample}... Recommend standardizing to formal Bengali script for financial credibility.`,
            });
          }
        }
      }
    }
    walk(componentsDir);
  }

  return {
    ok: true,
    issues,
  };
}

// -----------------------------------------------------------------------------
// 7. Optional LLM Judge Agent Call (Gemini / OpenAI API)
// -----------------------------------------------------------------------------
async function callOptionalLLMJudge(gitInfo, codeRes, finRes, secRes) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!geminiApiKey && !openaiApiKey) {
    return {
      evaluated: false,
      critique: "LLM Judge API key not configured in secrets (GEMINI_API_KEY or OPENAI_API_KEY). Deterministic judge audit completed successfully.",
    };
  }

  const prompt = `You are the Lead Principal Judge Agent for TakaTalks (takatalks.com), a privacy-first Bangladesh personal finance platform.
Evaluate the latest push to 'main':
Commit: ${gitInfo.commitHash}
Author: ${gitInfo.commitAuthor}
Message: ${gitInfo.commitMsg}
Changed files: ${gitInfo.changedFiles.join(", ")}
Diff Summary: ${gitInfo.diffStat}

Code verification status:
- TypeScript: ${codeRes.ts.ok ? "PASS" : "FAIL"}
- ESLint: ${codeRes.lint.ok ? "PASS" : "FAIL"}
- Tests: ${codeRes.tests.ok ? "PASS" : "FAIL"} (${codeRes.tests.output})
- Financial Audit: ${finRes.ok ? "PASS" : "WARN/FAIL"} (${finRes.issues.length} issues)
- Security Audit: ${secRes.ok ? "PASS" : "WARN/FAIL"} (${secRes.issues.length} issues)

Provide a sharp, 3-paragraph executive critique:
1. Product & Architecture: Are changes moving the product forward safely?
2. Financial Domain Compliance: Are Bangladesh tax/deposit/car calculations sound?
3. Strategic Next Move: What should the developer prioritize next?
Keep it direct, professional, and insightful.`;

  try {
    if (geminiApiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { evaluated: true, critique: text.trim() };
      }
    } else if (openaiApiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { evaluated: true, critique: text.trim() };
      }
    }
  } catch (err) {
    return { evaluated: false, critique: `LLM invocation failed: ${err.message}` };
  }

  return { evaluated: false, critique: "LLM response empty." };
}

// -----------------------------------------------------------------------------
// 8. Generate Markdown Report & GitHub Outputs
// -----------------------------------------------------------------------------
function generateMarkdownReport(gitInfo, codeRes, finRes, secRes, repoRes, copyRes, llmRes) {
  const allIssues = [
    ...finRes.issues.map(i => ({ category: "Financial Logic", ...i })),
    ...secRes.issues.map(i => ({ category: "Security & Auth", ...i })),
    ...repoRes.issues.map(i => ({ category: "Repo Hygiene", ...i })),
    ...copyRes.issues.map(i => ({ category: "Copy & UX", ...i })),
  ];

  const errorCount = allIssues.filter(i => i.severity === "ERROR").length +
    (!codeRes.ts.ok ? 1 : 0) +
    (!codeRes.lint.ok ? 1 : 0) +
    (!codeRes.tests.ok ? 1 : 0);

  const warnCount = allIssues.filter(i => i.severity === "WARN").length;

  const statusVerdict = errorCount === 0 ? (warnCount === 0 ? "PASSED (PERFECT)" : "PASSED (WITH WARNINGS)") : "FAILED";
  const badgeColor = errorCount === 0 ? (warnCount === 0 ? "brightgreen" : "yellow") : "red";

  let md = `# ⚖️ TakaTalks Judge Agent Report\n\n`;
  md += `**Verdict:** ![Status](https://img.shields.io/badge/Judge_Verdict-${encodeURIComponent(statusVerdict)}-${badgeColor})  \n`;
  md += `**Triggered By:** Commit [\`${gitInfo.commitHash.slice(0, 7)}\`](https://github.com/Tiascommits/TakaTalks/commit/${gitInfo.commitHash}) on branch \`main\`  \n`;
  md += `**Author:** ${gitInfo.commitAuthor}  \n`;
  md += `**Commit Message:** *${gitInfo.commitMsg.split("\n")[0]}*  \n`;
  md += `**Timestamp:** ${gitInfo.commitDate}  \n\n`;

  md += `---\n\n`;
  md += `## 📊 Automated Scorecard\n\n`;
  md += `| Evaluation Dimension | Status | Notes |\n`;
  md += `|---|---|---|\n`;
  md += `| **TypeScript Typecheck** | ${codeRes.ts.ok ? "✅ PASS" : "❌ FAIL"} | ${codeRes.ts.ok ? "0 errors" : "Type errors detected"} |\n`;
  md += `| **ESLint Code Quality** | ${codeRes.lint.ok ? "✅ PASS" : "❌ FAIL"} | ${codeRes.lint.ok ? "0 warnings, 0 errors" : "Lint issues detected"} |\n`;
  md += `| **Unit Test Suite (Vitest)** | ${codeRes.tests.ok ? "✅ PASS" : "❌ FAIL"} | ${codeRes.tests.output} |\n`;
  md += `| **Financial & NBR Tax Rules** | ${finRes.ok ? "✅ COMPLIANT" : "⚠️ ISSUES"} | ${finRes.issues.length} notices |\n`;
  md += `| **Security, Auth & Privacy** | ${secRes.ok ? "✅ SECURE" : "❌ VULNERABLE"} | ${secRes.issues.length} notices |\n`;
  md += `| **Repo Hygiene & Assets** | ${repoRes.ok ? "✅ CLEAN" : "⚠️ NOTICES"} | ${repoRes.issues.length} notices |\n`;
  md += `| **Copy & Localization** | ${copyRes.ok ? "ℹ️ CHECKED" : "⚠️ NOTICES"} | ${copyRes.issues.length} notices |\n\n`;

  if (llmRes.evaluated) {
    md += `## 🧠 Strategic AI Judge Evaluation\n\n`;
    md += `${llmRes.critique}\n\n`;
    md += `---\n\n`;
  }

  md += `## 🔍 Detailed Findings & Critique (${allIssues.length} Items)\n\n`;

  if (allIssues.length === 0 && codeRes.ts.ok && codeRes.lint.ok && codeRes.tests.ok) {
    md += `🎉 **Zero issues found!** All static checks, financial validations, security constraints, and hygiene rules passed cleanly.\n\n`;
  } else {
    md += `| Severity | Category | Finding / Recommendation |\n`;
    md += `|---|---|---|\n`;
    
    if (!codeRes.ts.ok) {
      md += `| 🚨 ERROR | TypeScript | Compilation failed. Run \`npx tsc --noEmit\` in \`web/\`. |\n`;
    }
    if (!codeRes.lint.ok) {
      md += `| 🚨 ERROR | ESLint | Linting failed. Run \`npm run lint\` in \`web/\`. |\n`;
    }
    if (!codeRes.tests.ok) {
      md += `| 🚨 ERROR | Vitest | Unit test failure. Run \`npm test\` in \`web/\`. |\n`;
    }

    for (const issue of allIssues) {
      const icon = issue.severity === "ERROR" ? "🚨 ERROR" : "⚠️ WARN";
      md += `| ${icon} | **${issue.category}** | ${issue.msg.replace(/\|/g, "\\|")} |\n`;
    }
    md += `\n`;
  }

  md += `## 📁 Push Diff Summary\n\n`;
  md += `**Files changed (${gitInfo.changedFiles.length}):**\n`;
  if (gitInfo.changedFiles.length > 0) {
    md += `\`\`\`\n${gitInfo.changedFiles.slice(0, 20).join("\n")}\n${gitInfo.changedFiles.length > 20 ? `...and ${gitInfo.changedFiles.length - 20} more files` : ""}\n\`\`\`\n\n`;
  } else {
    md += `*No files modified in current diff inspection.*\n\n`;
  }

  md += `---\n*Generated autonomously by TakaTalks Judge Agent.*`;
  return { md, statusVerdict, errorCount, warnCount };
}

// -----------------------------------------------------------------------------
// Main Execution
// -----------------------------------------------------------------------------
async function main() {
  header("INITIALIZING REPOSITORY AUDIT");

  log("1. Inspecting Git state...");
  const gitInfo = analyzeGitState();
  log(`   Commit: ${gitInfo.commitHash.slice(0, 7)} - ${gitInfo.commitMsg.split("\n")[0]}`);
  log(`   Author: ${gitInfo.commitAuthor}`);

  log("\n2. Executing Code Verification Checks...");
  const codeRes = runCodeChecks();
  log(`   TypeScript: ${codeRes.ts.ok ? "✅ PASS" : "❌ FAIL"}`);
  log(`   ESLint:     ${codeRes.lint.ok ? "✅ PASS" : "❌ FAIL"}`);
  log(`   Vitest:     ${codeRes.tests.ok ? "✅ PASS" : "❌ FAIL"} (${codeRes.tests.output})`);

  log("\n3. Auditing Financial & Tax Logic...");
  const finRes = runFinancialAudit();
  log(`   Financial Status: ${finRes.ok ? "✅ PASS" : "⚠️ ISSUES FOUND"} (${finRes.issues.length} notices)`);

  log("\n4. Auditing Security, Auth & Privacy...");
  const secRes = runSecurityAudit();
  log(`   Security Status:  ${secRes.ok ? "✅ SECURE" : "❌ VULNERABLE"} (${secRes.issues.length} notices)`);

  log("\n5. Auditing Repo Hygiene & File Assets...");
  const repoRes = runRepoHygieneAudit();
  log(`   Hygiene Status:   ${repoRes.ok ? "✅ CLEAN" : "⚠️ NOTICES"} (${repoRes.issues.length} notices)`);

  log("\n6. Auditing Copy & Localization...");
  const copyRes = runCopyAudit();
  log(`   Copy Status:      Checked (${copyRes.issues.length} notices)`);

  log("\n7. Invoking AI Judge Evaluation (if configured)...");
  const llmRes = await callOptionalLLMJudge(gitInfo, codeRes, finRes, secRes);
  if (llmRes.evaluated) {
    log("   AI Judge critique generated successfully.");
  } else {
    log(`   AI Judge: ${llmRes.critique}`);
  }

  log("\n8. Generating Final Critique Report...");
  const { md, statusVerdict, errorCount, warnCount } = generateMarkdownReport(
    gitInfo,
    codeRes,
    finRes,
    secRes,
    repoRes,
    copyRes,
    llmRes
  );

  // Write local report file
  const reportPath = path.join(REPO_ROOT, "judge-report.md");
  fs.writeFileSync(reportPath, md, "utf8");
  log(`   Saved report to: ${reportPath}`);

  // Write to GitHub Step Summary if running in GitHub Actions
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md, "utf8");
    log("   Wrote report to GitHub Step Summary.");
  }

  // Post GitHub commit comment if token and repo are available
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY && gitInfo.commitHash && gitInfo.commitHash !== "unknown") {
    try {
      const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${gitInfo.commitHash}/comments`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "User-Agent": "TakaTalks-Judge-Agent",
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: md }),
      });
      if (res.ok) {
        log("   Successfully posted critique comment to commit on GitHub.");
      } else {
        log(`   Commit comment notice: HTTP ${res.status}`);
      }
    } catch (e) {
      log(`   Could not post commit comment: ${e.message}`);
    }
  }

  // Print Summary to stdout
  console.log(`\n${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  JUDGE VERDICT: ${errorCount === 0 ? colors.green : colors.red}${statusVerdict}${colors.reset}`);
  console.log(`  Errors: ${errorCount} | Warnings: ${warnCount}`);
  console.log(`${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // If running in CI and critical errors exist, exit with code 1
  if (process.env.CI && errorCount > 0) {
    console.error(`${colors.red}Judge Agent found critical errors. Failing CI push step.${colors.reset}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Judge Agent encountered an unexpected runtime failure:", err);
  process.exit(1);
});
