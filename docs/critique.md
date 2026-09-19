# TakaTalks — Comprehensive Repository & Architecture Critique

**Date:** 2026-09-20  
**Scope:** Full repository review across `/web` (Next.js app), database models (Prisma), financial calculation engines (`src/lib/tax`, `src/lib/loans`, `src/lib/zakat`, `src/lib/freelance`, `src/lib/instruments`, `src/lib/salary`, `src/lib/reinvest`), scrapers, authentication, build pipelines, and documentation.

---

## Pill #0: Ghost Workspace Disorientation

Your active workspace is opened at `/Users/blackbird/INOVACE/TakaTalks`, which is an empty shell containing nothing except an orphaned `.next` Turbopack build cache. The actual repository with all source code, git history, and assets lives at:
```
/Users/blackbird/Everything/dev/INOVACE/TakaTalks
```
Any MCP server, automated CI runner, or agent looking at the project root sees zero source files and zero git history. The IDE root should be aligned with the actual repository.

---

## Pill #1: The "Trust-First / No Signup" Security Minefield

The repository advertises a "privacy-first, client-side, zero-signup" philosophy. In reality, the authentication and session architecture introduces severe security vulnerabilities.

### 1. Unsigned, Spoofable Cookie Session
In `src/lib/tracker/session.ts`:
```typescript
const id = store.get(COOKIE_NAME)?.value;
if (!id) return null;
const user = await prisma.user.findUnique({ where: { id } });
return user?.id ?? null;
```
The session cookie `taka_uid` holds a **raw, unsigned, unencrypted database CUID**. There is no HMAC signature, no secret key, and no token verification. Anyone who obtains or guesses another user's CUID can access their entire financial profile (salary, net wealth, investments, tax calculations).

### 2. Pre-Verification Data Hijacking & IDOR
In `src/lib/notify/verification.ts`:
```typescript
export async function requestEmailLink(currentUserId: string, email: string, appUrl: string) {
  const targetUserId = await resolveTargetUserIdForEmail(currentUserId, email);
  // ...
}
```
`resolveTargetUserIdForEmail` calls `mergeIntoExistingUser(currentUserId, existing.id)` **at the moment the magic link is requested**, before any link is clicked or verified.

**The exploit:** If Alice has an account, attacker Bob visits the site as an anonymous user and requests an email link for `alice@example.com`. Bob's income, investments, and tax profile are **immediately merged into Alice's account**, and Bob's user record is deleted—even if Alice never clicks the link.

### 3. Global OTP Collision & Trivial Account Takeover
In `prisma/schema.prisma`, `VerificationToken.token` has a `@unique` index.
- OTPs are generated as a 6-digit number (`src/lib/notify/verification.ts`).
- If two users request an OTP at the same time and the codes collide, Prisma throws a unique constraint error and crashes with a 500.
- In `src/app/api/account/verify/route.ts`, the `POST` endpoint takes `{ code: "123456" }` without requiring an email, phone, or user ID:
```typescript
const result = await consumeVerificationToken(token);
// ...
await setUserIdCookie(result.userId);
```
There is **zero rate limiting** on `/api/account/verify`. An attacker can iterate through 6-digit codes. The first active OTP code matched in the entire database will consume that token and log the attacker into that victim's account.

### 4. Plaintext Admin Secret in Cookies
In `src/lib/admin/auth.ts`, the legacy admin bootstrap stores the **raw, unhashed `ADMIN_SECRET` directly in a browser cookie**:
```typescript
store.set(LEGACY_COOKIE_NAME, secret, { ... });
```
Additionally, `providedSecret !== secret` uses non-constant-time string comparison, leaving it vulnerable to timing attacks.

---

## Pill #2: Financial Math Errors & Tax Inaccuracies

For a product whose sole value proposition is helping Bangladeshi citizens calculate their taxes and investments, the core domain calculations contain major flaws.

### 1. Missing Statutory 5% Tax Slab
In `src/config/tax-rules-2025-26.ts`:
```typescript
slabs: [
  { amt: 300000, rate: 0.1 },
  { amt: 400000, rate: 0.15 },
  { amt: 500000, rate: 0.2 },
  { amt: 2000000, rate: 0.25 },
  { amt: Infinity, rate: 0.3 },
]
```
Under the Bangladesh Finance Act, individual income tax slabs feature a **5% slab** on the first ৳1,00,000 above the tax-free ceiling before jumping to 10%. The engine completely omits the 5% tier and taxes that chunk at 10%, producing inflated tax liabilities for entry-level taxpayers.

### 2. Hardcoded, Non-Compliant Minimum Tax
In `src/config/tax-rules-2025-26.ts`:
```typescript
minTaxFirstTime: 1000,
minTaxRegular: 5000,
```
Under the Bangladesh Income Tax Act 2023, minimum tax is determined by **geography**:
- Dhaka & Chattogram City Corporation: **৳5,000**
- Other City Corporations: **৳4,000**
- Non-City Corporation areas (Districts / Rural Upazilas): **৳3,000**

There is no location selector; a rural taxpayer is billed the Dhaka City rate. Furthermore, the `minTaxFirstTime: 1000` rule is not an NBR statutory category.

### 3. Statutory Salary Exemption Discrepancy
In `src/lib/salary/salary.ts`:
`Statutory Employment Exemption: min(1/3 of total employment receipts, ৳4,50,000)`
Yet line 139 uses `TAX_RULES.salaryExemptionCap`, which is hardcoded in `src/config/tax-rules-2025-26.ts` to **`500000` (৳5,00,000)**. Under the Income Tax Act 2023 (Second Schedule, Part 1, Para 1), the statutory ceiling is ৳4,50,000. The config violates the law and contradicts the code's own comment.

### 4. The Basic Calculator Misinforms Salaried Users
`/tax_basic_calculation` uses `calculateBasicTax` (`src/lib/tax/basic.ts`), applying slab tax directly to total gross income without deducting the 1/3 statutory salary exemption. 
- A salaried individual earning ৳4,50,000 has an exempt ৳1,50,000, leaving ৳3,00,000 taxable—resulting in **৳0 tax**.
- This tool tells them their taxable income is ৳4,50,000 and calculates an erroneous tax bill.

### 5. Sanchayapatra Does Not Compound
In `src/lib/instruments/instruments.ts`:
```typescript
const totalMaturityValue = Math.round(
  safeAmount * Math.pow(1 + netRateDecimal, safeYears)
);
```
National Savings Certificates (*Paribar Sanchayapatra*, *3-Month Profit*, *Pensioner*) **do not compound annually**. Profits are disbursed monthly or quarterly straight to the investor's bank account and cannot be auto-reinvested within the scheme. Modeling Sanchayapatra as annual compound growth artificially inflates long-term projections by hundreds of thousands of taka.

### 6. Mutual Funds Are Not 8.75% Fixed-Income Bonds
In `src/lib/instruments/instruments.ts`, Open-End Mutual Funds are hardcoded with a fixed `baseRatePct: 8.75` and projected as compounding annually. Open-end funds in Bangladesh have fluctuating NAVs, volatile equity market exposure, and carry no principal guarantee. Projecting them alongside sovereign Treasury Bonds as a guaranteed 8.75% yield is misleading financial advice.

### 7. Currency Stored as Binary Float
In `prisma/schema.prisma`:
`amount Float`, `principalAmount Float`, `netWealth Float` all map to Postgres `double precision`. Financial data should never use IEEE 754 floating-point arithmetic. Use `Decimal(18, 2)` or integer poisha to prevent precision loss.

---

## Pill #3: Fragile Data Scraping & Serverless Bombs

The bank rate and health monitoring architecture has scalability and reliability issues.

### 1. Only 3 Banks Are Scraped
Despite the UI presenting a comprehensive banking scorecard, only **3 banks** (`AB`, `National Bank`, `IFIC`) have scrapers. Every other bank displays hardcoded mock seed data from early 2026.

### 2. The 400-Page PDF Regex Lottery
In `src/lib/bank-health/extract-figures.ts`:
```typescript
{ re: /\b(?:CRAR|CAR)\b[^%\n]{0,30}?(\d{1,2}(?:\.\d+)?)\s*%/i, confidence: 0.85 }
```
Running this regex across an entire 400-page bank annual report takes the **first regex match in the entire text buffer**. That match could be from the chairman's opening letter or a footnote. Furthermore, for balance sheet values (`TOTAL_DEPOSITS`), it ignores denominations (Crore vs. Million vs. Thousand BDT).

### 3. Serverless Out-Of-Memory / Timeout in Cron
`src/app/api/cron/bank-health-check/route.ts` iterates over all active banks sequentially in a single incoming HTTP request:
1. Fetches the page.
2. Downloads a 50–150MB PDF buffer into memory.
3. Parses it using `pdf-parse`.
4. Executes regex extraction.

On Vercel serverless functions (with a 10–60 second execution limit and memory limits), downloading and parsing multiple 100MB PDFs sequentially will trigger a function timeout or crash via OOM.

---

## Pill #4: Broken Build Pipelines & Test Suite Gaps

### 1. `postbuild` Crashes Without a Dedicated Postgres Instance
In `web/package.json`:
`"postbuild": "npm run test:e2e"`
In `web/e2e/test-db.ts`:
```typescript
if (!url) {
  throw new Error("TEST_DATABASE_URL is not set. E2E tests need a dedicated Postgres database URL...");
}
```
Whenever `npm run build` runs, npm automatically executes `postbuild`. If a developer or a standard CI pipeline runs `npm run build` without a live Postgres server reachable at `TEST_DATABASE_URL`, **the build fails immediately**.

### 2. E2E Tests Asserting Retired Facebook Embeds
`e2e/videos.spec.ts` explicitly asserts:
`await expect(page.locator("iframe[src*='facebook.com/plugins/video.php']")).toBeVisible();`
However, `src/config/videos.ts` was switched to `platform: "local"` with self-hosted MP4 files. As recorded in QA reports, the Playwright suite fails on video specs because the tests check for Facebook iframes that no longer exist.

### 3. 21MB+ of Binary Video in Git
Committed directly into git:
- `web/public/videos/same-income-different-tax.mp4` (~11MB)
- `web/public/videos/tax-slabs-explained.mp4` (~10MB)
- Additional raw video files under `Published stuff/`

Binary video files bloat clone sizes and should be served from an object store (e.g., Cloudflare R2, S3) via CDN.

---

## Pill #5: Brand Credibility & "Banglish" Copy

The app mixes formal Bengali script, English, and romanized Banglish within identical contexts.

Examples in user-facing components:
- `src/components/calculator/TrustBanner.tsx`:
  `"এই হিসাব তোমার device-এ হয়, কোথাও পাঠানো হয় না। No signup, no account, kono data server-e jay na।"`
- `src/components/calculator/TrustBanner.tsx`:
  `"Ei ta ekটা estimate tool, official filing na। Rules budget e change hoy, tai kichu cap simplified. Actual return filing er jonno etaxnbr.gov.bd use koro ba tax practitioner dekhao।"`
- `src/components/calculator/CalculatorForm.tsx`:
  `"Ei ekটা rough estimate, official record na, ar kothao save hoy na। Per-instrument sub-caps simplified। Real filing er age sob officially verify koro।"`
- `src/components/calculator/CalculatorHeader.tsx`:
  `"Type kore dekho tomar tax roughly koto hote pare... estimate kore dekhায়..."`

A personal finance application dealing with sensitive income and taxation must project institutional authority. Mixing colloquial phonetic Banglish with formal Bengali text undermines professional trust.

---

## Pill #6: "AI" Reinvestment Marketing vs. Reality

Roadmap item Phase 5 is marketed as:
> *"Phase 5: AI reinvestment suggestions"*

In `src/lib/reinvest/suggest.ts`:
```typescript
const REALYIELD_WEIGHT = 6;
const REBATE_WEIGHT = 10;
const HORIZON_FIT_BONUS = 8;
const HORIZON_MISMATCH_PENALTY_LOCKED = 6;
```
This is a standard linear arithmetic formula that calculates weighted points across 4 hardcoded categories. Presenting basic rule-based arithmetic as "AI" is misleading and risks user skepticism.

---

## Priority Action Plan

1. **Move Workspace Mount**: Relocate the IDE root to `/Users/blackbird/Everything/dev/INOVACE/TakaTalks`. Delete the empty `/Users/blackbird/INOVACE/TakaTalks` folder to prevent confusion.
2. **Harden Authentication**:
   - Cryptographically sign the `taka_uid` session cookie (or adopt a standard session library like Iron Session/Lucia/Auth.js).
   - Require phone number/email validation on `POST /api/account/verify` and implement per-IP/per-target rate limiting.
   - Stop pre-verification data merging in `resolveTargetUserIdForEmail`.
3. **Correct Tax Logic**:
   - Reintroduce the statutory **5% tax slab** on the first ৳1,00,000 above the tax-free limit.
   - Adjust `salaryExemptionCap` to ৳4,50,000.
   - Add a location selector for minimum tax (৳5,000 / ৳4,00,000 / ৳3,000).
   - Deduct the 1/3 statutory employment exemption in the basic calculator.
4. **Fix Sanchayapatra & Instrument Modeling**:
   - Remove annual compounding from Sanchayapatra calculations.
   - Clarify that open-end mutual funds are market-linked and do not provide a fixed 8.75% compound return.
5. **Decouple PDF Processing from Web Requests**:
   - Move PDF report fetching and parsing out of the serverless cron handler into background workers or queue tasks.
6. **Clean Up Language**:
   - Standardize all strings to formal, grammatically correct Bengali script instead of mixed romanized Banglish.
