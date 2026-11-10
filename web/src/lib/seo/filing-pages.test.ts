import { describe, expect, it } from "vitest";
import { TAX_RULES, TAXPAYER_CATEGORIES } from "@/config/tax-rules-2025-26";
import { fmtTaka, toAsciiDigits } from "@/lib/format";
import { FILING_PAGES, fmtDate } from "./filing-pages";

// Every number a page may show, derived from TAX_RULES and TAXPAYER_CATEGORIES: amounts as
// fmtTaka prints them, rates as percents, dates as their day and year, labels as written.
function allowedNumbers(): Set<string> {
  const out = new Set<string>();
  const add = (s: string) => (s.match(/\d[\d,.]*\d|\d/g) ?? []).forEach((n) => out.add(n));
  const walk = (v: unknown): void => {
    if (typeof v === "number" && Number.isFinite(v)) {
      add(fmtTaka(v));
      add(String(Math.round(v * 1000) / 10));
    } else if (typeof v === "string") {
      add(toAsciiDigits(v));
      if (/^\d{4}-\d\d-\d\d$/.test(v)) add(fmtDate("en", v));
    } else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(TAX_RULES);
  walk(TAXPAYER_CATEGORIES);
  return out;
}

const allowed = allowedNumbers();
const numbersIn = (s: string) => toAsciiDigits(s).match(/\d[\d,.]*\d|\d/g) ?? [];

describe.each(FILING_PAGES)("filing page $id", (page) => {
  for (const lang of ["bn", "en"] as const) {
    const c = page[lang];
    const text = [c.title, c.description, c.h1, ...c.intro, ...c.points, ...c.faq.flatMap((f) => [f.q, f.a])].join(" \n ");

    it(`${lang}: every number comes from TAX_RULES`, () => {
      const stray = numbersIn(text).filter((n) => !allowed.has(n));
      expect(stray).toEqual([]);
    });

    it(`${lang}: has a title, a description under 160 characters and an FAQ`, () => {
      expect(c.title.length).toBeGreaterThan(10);
      expect(c.description.length).toBeLessThanOrEqual(160);
      expect(c.faq.length).toBeGreaterThanOrEqual(2);
      expect(page.sources.length).toBeGreaterThan(0);
    });
  }
});

describe("cited figures", () => {
  const all = (id: string) => {
    const p = FILING_PAGES.find((x) => x.id === id)!;
    return JSON.stringify([p.bn, p.en]);
  };
  it("deadline page shows returnNoExtraTaxBy, each late window and the first-return date", () => {
    const s = all("deadline");
    expect(s).toContain(fmtDate("en", TAX_RULES.returnNoExtraTaxBy));
    expect(s).toContain(fmtDate("bn", TAX_RULES.returnNoExtraTaxBy));
    expect(s).toContain(fmtDate("en", TAX_RULES.firstTimeFilerDueBy));
    for (const w of TAX_RULES.lateFilingExtraTax) expect(s).toContain(`${w.rate * 100}% of the payable tax, at least ${fmtTaka(w.min)}`);
  });
  it("tax-free page lists every category's limit", () => {
    const s = all("tax-free-limit");
    for (const c of TAXPAYER_CATEGORIES) expect(s).toContain(`${c.labelEn}: ${fmtTaka(c.taxFreeLimit)}`);
  });
  it("first-time page uses the new-taxpayer minimum and presets the calculator", () => {
    expect(all("first-time")).toContain(fmtTaka(TAX_RULES.minTaxNewTaxpayer));
    expect(FILING_PAGES.find((p) => p.id === "first-time")!.prefill).toEqual({ firstTimeFiler: true });
  });
  it("rebate page uses the three rebate limits", () => {
    const s = all("rebate");
    for (const v of [`${TAX_RULES.rebateRateOfIncome * 100}%`, `${TAX_RULES.rebateRateOfInvestment * 100}%`, fmtTaka(TAX_RULES.rebateCap)]) expect(s).toContain(v);
  });
  it("freelancer page uses the exemption end date", () => {
    expect(all("freelancer")).toContain(fmtDate("en", TAX_RULES.freelanceExemptionEnds));
  });
  it("first return is due 30 June after the income year ([KPMG26] p45)", () => {
    expect(TAX_RULES.firstTimeFilerDueBy).toBe("2027-06-30");
  });
  it("slugs are unique per language", () => {
    for (const lang of ["bn", "en"] as const) {
      const slugs = FILING_PAGES.map((p) => p[lang].slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});
