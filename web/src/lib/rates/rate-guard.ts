import { choice, noul } from "@typesafe-ai/sdk";
import { jevClient, type JevClient } from "@/lib/jev/client";
import type { ScrapedRate } from "./adapters/types";

/** Jev Task 2.2: below this, a rate goes to the admin digest (todo/system-one-jev.md). */
export const MIN_GUARD_CONFIDENCE = 0.85;

const RATE_TYPES = {
  retail_fdr: "A retail fixed deposit (FDR / term deposit) rate for individuals",
  dps: "A deposit pension scheme (DPS) / monthly savings scheme rate",
  loan_lending: "A lending or loan interest rate",
  corporate_deposit: "A deposit rate for corporate or institutional customers",
  promo_special: "A promotional, special-offer or campaign rate",
} as const;
const TENURES = { "3_months": null, "6_months": null, "1_year": null, multi_year: null, other: null } as const;
type Tenure = keyof typeof TENURES;

const EXPECTED_TYPE = { FDR: "retail_fdr", DPS: "dps" } as const;
const expectedTenure = (months: number): Tenure =>
  months === 3 ? "3_months" : months === 6 ? "6_months" : months === 12 ? "1_year" : months > 12 ? "multi_year" : "other";

/**
 * Jev Tasks 2.1–2.2: classify each scraped FDR/DPS rate and say why any of them
 * needs a human look, or null when none does, Jev is off, or the call fails.
 * Shadow mode (Boundary C, todo/needs-us-both/system-one-jev-policy-and-gates.md):
 * the caller still stores the rates and only records this note for the digest.
 */
export async function reviewScrapedRates(
  bankName: string,
  rates: ScrapedRate[],
  client: JevClient | null = jevClient()
): Promise<string | null> {
  const guarded = rates.filter((r) => r.instrument === "FDR" || r.instrument === "DPS");
  if (!client || guarded.length === 0) return null;
  try {
    const questions = Object.fromEntries(
      guarded.flatMap((r, i) => {
        const rate = { bank: bankName, instrument: r.instrument, termMonths: r.termMonths, ratePct: r.ratePct, ratePctMax: r.ratePctMax ?? null, source: r.source };
        return [
          [`type${i}`, choice({ question: "What kind of rate is this?", rate }, RATE_TYPES)],
          [`tenure${i}`, choice({ question: "Which tenure bracket is this rate for?", rate }, TENURES)],
          [`plausible${i}`, noul({ question: "Is this a plausible retail deposit rate for a Bangladeshi bank today (market range about 7%–13% a year)?", rate })],
        ];
      })
    );
    const { answers } = await client.systemOne({ state: `Deposit rates just scraped for ${bankName} in Bangladesh.`, questions });
    const issues = guarded.flatMap((r, i) => {
      const type = answers[`type${i}`] as { choice: string; confidence: number };
      const tenure = answers[`tenure${i}`] as { choice: string; confidence: number };
      const plausible = (answers[`plausible${i}`] as { noul: number }).noul;
      const why: string[] = [];
      if (type.choice !== EXPECTED_TYPE[r.instrument as "FDR" | "DPS"]) why.push(`classed ${type.choice}`);
      else if (type.confidence < MIN_GUARD_CONFIDENCE) why.push(`type confidence ${type.confidence.toFixed(2)}`);
      if (tenure.choice !== expectedTenure(r.termMonths)) why.push(`tenure ${tenure.choice}`);
      else if (tenure.confidence < MIN_GUARD_CONFIDENCE) why.push(`tenure confidence ${tenure.confidence.toFixed(2)}`);
      if (plausible < MIN_GUARD_CONFIDENCE) why.push(`plausible ${plausible.toFixed(2)}`);
      return why.length ? [`${r.instrument} ${r.termMonths}mo ${r.ratePct}%: ${why.join(", ")}`] : [];
    });
    return issues.length ? issues.join("; ") : null;
  } catch (err) {
    console.warn("[jev] rate guard failed, rates stored unchecked:", err instanceof Error ? err.message : err);
    return null;
  }
}
