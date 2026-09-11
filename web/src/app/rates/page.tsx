import { getCurrentFdrRates, getLatestBBAggregateRate } from "@/lib/rates/current-rates";
import { RateScorecard } from "@/components/rates/RateScorecard";

export const metadata = {
  title: "ব্যাংক রেট তুলনা — Takatox",
};

// Rates change (and staleness flags depend on the latest scrape attempt),
// so this must never be served from a build-time snapshot — see the
// project's "never show stale data as if it's current" rule.
export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const [rows, bbAggregate] = await Promise.all([
    getCurrentFdrRates(),
    getLatestBBAggregateRate(),
  ]);

  return (
    <>
      <header className="bg-green-deep text-paper px-5 pt-6.5 pb-5 border-b-4 border-gold">
        <div className="max-w-[1160px] mx-auto">
          <p className="font-mono text-[11.5px] tracking-wide text-[#C9D9CB] mb-1.5">
            BANK FDR COMPARISON — SOURCED DATA, NOT A RECOMMENDATION
          </p>
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1.5">
            ব্যাংক FDR রেট তুলনা
          </h1>
          <p className="max-w-[700px] text-sm text-[#DCE6DD]">
            কয়েকটা bank er published FDR rate পাশাপাশি দেখায়, after-tax return calculate করে
            দেখায়। কোনো bank ba scheme &quot;best&quot; বলে না — কোনটা নেবে সেটা তোমার সিদ্ধান্ত।
          </p>
        </div>
      </header>

      <RateScorecard
        rows={JSON.parse(JSON.stringify(rows))}
        bbAggregate={bbAggregate ? JSON.parse(JSON.stringify(bbAggregate)) : null}
      />
    </>
  );
}
