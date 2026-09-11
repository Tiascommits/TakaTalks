"use client";

import Link from "next/link";

export default function RatesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-wide text-muted mb-3">
          ব্যাংক রেট / BANK RATES
        </p>
        <h1 className="font-serif font-semibold text-2xl text-green-deep mb-3">
          রেট লোড করা যায়নি
          <br />
          <span className="text-lg">Couldn&apos;t load bank rates right now</span>
        </h1>
        <p className="text-sm text-[#444] mb-6">
          এটা আমাদের দিক থেকে সমস্যা, তোমার device না। একটু পরে আবার চেষ্টা করো।
          <br />
          This is on our end, not yours. Please try again in a moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors"
          >
            আবার চেষ্টা করো / Try again
          </button>
          <Link
            href="/"
            className="border border-green-deep text-green-deep px-6 py-3 font-medium hover:bg-[#EFF6F1] transition-colors"
          >
            হোমে ফিরে যাও / Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
