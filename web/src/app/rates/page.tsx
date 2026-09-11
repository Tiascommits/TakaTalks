import {
  getCurrentFdrRates,
  getLatestBBAggregateRate,
  getApprovedBankHealthFigures,
} from "@/lib/rates/current-rates";
import { RateScorecard } from "@/components/rates/RateScorecard";
import { BankHealthPanel } from "@/components/rates/BankHealthPanel";
import { RatesHeader } from "@/components/rates/RatesHeader";

export const metadata = {
  title: "ব্যাংক রেট তুলনা — Takatox",
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

  return (
    <>
      <RatesHeader />

      <RateScorecard
        rows={JSON.parse(JSON.stringify(rows))}
        bbAggregate={bbAggregate ? JSON.parse(JSON.stringify(bbAggregate)) : null}
      />

      <div className="max-w-[1160px] mx-auto px-5 mb-16">
        <BankHealthPanel rows={JSON.parse(JSON.stringify(bankHealthRows))} />
      </div>
    </>
  );
}
