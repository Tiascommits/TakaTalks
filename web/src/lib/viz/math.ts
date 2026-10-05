/**
 * Pure maths and formatting behind the shareable visualizers in /viz.
 * Kept free of canvas/DOM code so it can be unit-tested in node.
 */

export type Lang = "en" | "bn";

/** Longest horizon we'll simulate before calling a goal unreachable (100 years). */
const MAX_MONTHS = 1200;

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function progress(saved: number, target: number): number {
  if (!(target > 0)) return 0;
  return clamp01(saved / target);
}

/**
 * Months until `saved` (topped up by `monthly` each month, growing at
 * `annualReturnPct`) reaches `target`. 0 if already there, null if it never
 * gets there within 100 years.
 */
export function monthsToGoal(
  target: number,
  saved: number,
  monthly: number,
  annualReturnPct = 0
): number | null {
  if (saved >= target) return 0;
  const r = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  let balance = Math.max(0, saved);
  for (let m = 1; m <= MAX_MONTHS; m++) {
    balance = balance * (1 + r) + Math.max(0, monthly);
    if (balance >= target) return m;
  }
  return null;
}

/** Real (inflation-adjusted) return, in percent, via the Fisher equation. */
export function realReturnPct(nominalPct: number, inflationPct: number): number {
  return ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;
}

/** Corpus needed so that withdrawing `withdrawalPct` a year covers the expenses. */
export function freedomNumber(monthlyExpense: number, withdrawalPct: number): number {
  if (!(withdrawalPct > 0)) return 0;
  return (monthlyExpense * 12) / (withdrawalPct / 100);
}

/** What `amount` taka will buy, in today's taka, after `years` of inflation. */
export function purchasingPower(amount: number, inflationPct: number, years: number): number {
  return amount / Math.pow(1 + inflationPct / 100, years);
}

/**
 * Months to clear `balance` at `annualRatePct` (reducing balance, monthly
 * rest) paying `emi` a month. null if the EMI doesn't cover the interest.
 */
export function monthsToPayoff(balance: number, annualRatePct: number, emi: number): number | null {
  if (balance <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (emi <= balance * r) return null;
  let b = balance;
  for (let m = 1; m <= MAX_MONTHS; m++) {
    b = b * (1 + r) - emi;
    if (b <= 0.5) return m;
  }
  return null;
}

/** Sum of 1..n, times the per-box multiplier — the 100-box challenge total. */
export function boxChallengeTotal(boxes: number, multiplier: number): number {
  return ((boxes * (boxes + 1)) / 2) * multiplier;
}

/** A set of ticked box indices packed into a short URL-safe string (base-36 per 20 bits). */
export function encodeBits(ticked: Set<number>, size: number): string {
  const chunks: string[] = [];
  for (let start = 0; start < size; start += 20) {
    let v = 0;
    for (let i = 0; i < 20 && start + i < size; i++) if (ticked.has(start + i)) v |= 1 << i;
    chunks.push(v.toString(36));
  }
  return chunks.join(".");
}

export function decodeBits(s: string, size: number): Set<number> {
  const out = new Set<number>();
  if (!s || !/^[0-9a-z]+(\.[0-9a-z]+)*$/.test(s)) return out;
  s.split(".").forEach((chunk, ci) => {
    const v = parseInt(chunk, 36);
    if (!Number.isFinite(v)) return;
    for (let i = 0; i < 20; i++) {
      const idx = ci * 20 + i;
      if (idx < size && v & (1 << i)) out.add(idx);
    }
  });
  return out;
}

// ---------------------------------------------------------------- formatting

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function digits(s: string, lang: Lang): string {
  return lang === "bn" ? toBnDigits(s) : s;
}

/** Plain count with lakh-style grouping, e.g. 1,23,456 / ১,২৩,৪৫৬. */
export function fmtNum(n: number, lang: Lang, decimals = 0): string {
  const s = n.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
  return digits(s, lang);
}

/** Full taka amount with lakh grouping: ৳12,50,000. */
export function fmtTaka(n: number, lang: Lang): string {
  return (n < 0 ? "−" : "") + "৳" + fmtNum(Math.round(Math.abs(n)), lang);
}

/** Poster-friendly short taka: ৳12.5 lakh, ৳1.2 crore, ৳45,000. */
export function fmtTakaShort(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  const trim = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)).replace(/\.?0+$/, "");
  if (abs >= 1e7) return sign + "৳" + digits(trim(abs / 1e7), lang) + (lang === "bn" ? " কোটি" : " crore");
  if (abs >= 1e5) return sign + "৳" + digits(trim(abs / 1e5), lang) + (lang === "bn" ? " লাখ" : " lakh");
  return sign + fmtTaka(abs, lang);
}

export function fmtPct(p: number, lang: Lang): string {
  const v = p * 100;
  if (v > 0 && v < 0.1) return digits("<0.1", lang) + "%";
  const s = v > 0 && v < 1 ? v.toFixed(1) : Math.floor(v).toString();
  return digits(s, lang) + "%";
}

/** 27 → "2 yrs 3 mo" / "২ বছর ৩ মাস". */
export function fmtDuration(months: number, lang: Lang): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (lang === "bn") {
    if (y) parts.push(`${toBnDigits(String(y))} বছর`);
    if (m || !y) parts.push(`${toBnDigits(String(m))} মাস`);
  } else {
    if (y) parts.push(`${y} yr${y === 1 ? "" : "s"}`);
    if (m || !y) parts.push(`${m} mo`);
  }
  return parts.join(" ");
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_BN = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

/** Calendar month `months` from `from`, e.g. "Mar 2029". */
export function fmtMonthFromNow(months: number, lang: Lang, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + months, 1);
  const name = (lang === "bn" ? MONTHS_BN : MONTHS_EN)[d.getMonth()];
  return `${name} ${digits(String(d.getFullYear()), lang)}`;
}
