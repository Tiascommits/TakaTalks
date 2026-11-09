import { describe, expect, it, vi } from "vitest";
import type { JevClient } from "@/lib/jev/client";
import type { ScrapedRate } from "./adapters/types";
import { reviewScrapedRates } from "./rate-guard";

const fdr = (termMonths: number, ratePct: number): ScrapedRate => ({ instrument: "FDR", termMonths, ratePct, method: "SCRAPED", source: "bb" });
type Answer = { type: string; tenure: string; confidence?: number; plausible?: number };

/** Answers `type{i}`, `tenure{i}` and `plausible{i}` for each rate, in order. */
function stubJev(perRate: Answer[]): JevClient {
  const answers = Object.fromEntries(
    perRate.flatMap((a, i) => [
      [`type${i}`, { choice: a.type, confidence: a.confidence ?? 0.95 }],
      [`tenure${i}`, { choice: a.tenure, confidence: 0.95 }],
      [`plausible${i}`, { noul: a.plausible ?? 0.95 }],
    ])
  );
  return { systemOne: vi.fn(async () => ({ answers })) } as unknown as JevClient;
}

describe("reviewScrapedRates (Jev Tasks 2.1–2.2)", () => {
  it("is off without a client", async () => {
    expect(await reviewScrapedRates("Bank X", [fdr(12, 9)], null)).toBeNull();
  });

  it("passes confident, matching deposit rates", async () => {
    expect(await reviewScrapedRates("Bank X", [fdr(3, 8.5), fdr(12, 9)], stubJev([{ type: "retail_fdr", tenure: "3_months" }, { type: "retail_fdr", tenure: "1_year" }]))).toBeNull();
  });

  it("flags a lending rate, a wrong tenure, low confidence and an implausible rate", async () => {
    const note = await reviewScrapedRates(
      "Bank X",
      [fdr(12, 14.5), fdr(6, 9), fdr(36, 10)],
      stubJev([
        { type: "loan_lending", tenure: "1_year", plausible: 0.2 },
        { type: "retail_fdr", tenure: "multi_year" },
        { type: "retail_fdr", tenure: "multi_year", confidence: 0.6 },
      ])
    );
    expect(note).toBe("FDR 12mo 14.5%: classed loan_lending, plausible 0.20; FDR 6mo 9%: tenure multi_year; FDR 36mo 10%: type confidence 0.60");
  });

  it("skips instruments it does not guard and falls back on an API error", async () => {
    const client = stubJev([]);
    expect(await reviewScrapedRates("Bank X", [{ ...fdr(12, 9), instrument: "SANCHAYAPATRA" }], client)).toBeNull();
    expect(client.systemOne).not.toHaveBeenCalled();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = { systemOne: vi.fn(async () => Promise.reject(new Error("429"))) } as unknown as JevClient;
    expect(await reviewScrapedRates("Bank X", [fdr(12, 9)], failing)).toBeNull();
  });
});
