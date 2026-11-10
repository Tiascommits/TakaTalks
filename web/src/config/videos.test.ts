import { describe, expect, it } from "vitest";
import { TAX_RULES } from "./tax-rules-2025-26";
import { VIDEOS } from "./videos";

describe("video copy", () => {
  it("no longer sells the early-filing credit, which closed on 30 Sep 2026", () => {
    for (const v of VIDEOS) {
      const text = [v.title.en, v.title.bn, v.description.en, v.description.bn].join(" ");
      expect(text).not.toMatch(/incentive|25,000|২৫,০০০|বাঁচান/i);
    }
  });

  it("gives the no-extra-tax filing date from TAX_RULES", () => {
    const v = VIDEOS.find((x) => x.id === "save-25k-income-tax")!;
    expect(TAX_RULES.returnNoExtraTaxBy).toBe("2026-12-31");
    expect(v.description.en).toContain("31 December 2026");
    expect(v.description.bn).toContain("৩১ ডিসেম্বর");
  });
});
