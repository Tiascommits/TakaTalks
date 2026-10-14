import {
  getCurrentFdrRates,
  getLatestBBAggregateRate,
  getApprovedBankHealthFigures,
} from "@/lib/rates/current-rates";
import { RateScorecard } from "@/components/rates/RateScorecard";
import { BankHealthPanel } from "@/components/rates/BankHealthPanel";
import { RatesHeader } from "@/components/rates/RatesHeader";
import { RatesEmptyState } from "@/components/rates/RatesEmptyState";

export const metadata = {
  title: "ব্যাংক রেট তুলনা — TakaTalks",
};

// Rates change (and staleness flags depend on the latest scrape attempt),
// so this must never be served from a build-time snapshot — see the
// project's "never show stale data as if it's current" rule.
export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const [rows, bbAggregate, bankHealthRows] = await Promise.all([
    getCurrentFdrRates(),
    getLatestBBAggregateRate(),
    getApprovedBankHealthFigures(),
  ]);

  // No bank has a rate yet (the scrape has never succeeded): say so plainly
  // instead of drawing an empty table. Flips back on its own once data lands.
  const hasRates = rows.some((r) => r.ratePct !== null);

  return (
    <>
      <RatesHeader />

      {hasRates ? (
        <RateScorecard
          rows={JSON.parse(JSON.stringify(rows))}
          bbAggregate={bbAggregate ? JSON.parse(JSON.stringify(bbAggregate)) : null}
        />
      ) : (
        <RatesEmptyState />
      )}

      {/* Same rule for bank health: only figures an admin has approved, else nothing. */}
      {bankHealthRows.some((r) => r.figures.length > 0) && (
        <div className="w-full max-w-[1160px] mx-auto px-5 mb-16">
          <BankHealthPanel rows={JSON.parse(JSON.stringify(bankHealthRows))} />
        </div>
      )}
    </>
  );
}
