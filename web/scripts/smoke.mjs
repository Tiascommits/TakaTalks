#!/usr/bin/env node
// Post-deploy smoke test: GETs the key pages and /api/health on a deployed site
// and exits 1 on any non-200 or missing key text. GET only, so safe on production.
//   node scripts/smoke.mjs https://www.takatalks.com
// VERCEL_AUTOMATION_BYPASS_SECRET, when set, gets past Vercel Deployment Protection.

const base = process.argv[2]?.replace(/\/+$/, "");
if (!base || !/^https?:\/\//.test(base)) {
  console.error("usage: node scripts/smoke.mjs <base-url>");
  process.exit(2);
}

// Key text is the start of each page's <title> (its `metadata` export) plus the
// share-card tag, so copy changes in page bodies don't break the check.
const OG = 'property="og:image"';
const CHECKS = [
  ["/", ["TakaTalks", OG]],
  ["/calculator", ["আয়কর এস্টিমেটর", OG]],
  ["/tax_basic_calculation", ["বেসিক ইনকাম ট্যাক্স হিসাব", OG]],
  ["/salary", ["স্যালারি অফার তুলনাকারী ও ইন-হ্যান্ড পে", OG]],
  ["/freelance", ["ফ্রিল্যান্স ট্যাক্স ও রেমিট্যান্স ক্যালকুলেটর", OG]],
  ["/zakat", ["Zakat Calculator Bangladesh", OG]],
  ["/loans", ["Home EMI Calculator", OG]],
  ["/instruments", ["প্রকৃত মুনাফা ম্যাট্রিক্স", OG]],
  ["/goals", ["লাইফ গোল ও ওয়েলথ প্ল্যানার", OG]],
  ["/rates", ["ব্যাংক রেট তুলনা", OG]],
  ["/tracker", ["ইনকাম / ইনভেস্টমেন্ট ট্র্যাকার", OG]],
  ["/privacy", ["গোপনীয়তা নীতি", OG]],
  ["/terms", ["ব্যবহারের শর্তাবলি", OG]],
  ["/api/health", ['"dbReachable":true']],
  ["/opengraph-image", ["PNG"]], // the PNG file signature
];

const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = secret ? { "x-vercel-protection-bypass": secret } : {};

let failures = 0;
for (const [path, needles] of CHECKS) {
  let problem = "";
  try {
    const res = await fetch(base + path, { headers, signal: AbortSignal.timeout(30_000) });
    const body = await res.text();
    const missing = needles.filter((n) => !body.includes(n));
    if (res.status !== 200) problem = `HTTP ${res.status}`;
    else if (missing.length) problem = `missing ${missing.join(", ")}`;
    if (path === "/api/health" && body.startsWith("{")) {
      console.log(`     health: ${body.slice(0, 300)}`);
      // Not a failure: rates stay empty until the owner runs the first scrape.
      if (!problem && JSON.parse(body).banksWithFdrRates === 0) console.log("::warning::no bank has an FDR rate yet");
    }
  } catch (err) {
    problem = err instanceof Error ? err.message : String(err);
  }
  console.log(`${problem ? "FAIL" : "ok  "} ${path}${problem ? ` (${problem})` : ""}`);
  if (problem) failures++;
}
console.log(failures ? `${failures} of ${CHECKS.length} checks failed on ${base}` : `all ${CHECKS.length} checks passed on ${base}`);
process.exit(failures ? 1 : 0);
