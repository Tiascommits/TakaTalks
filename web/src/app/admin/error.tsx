"use client";

import Link from "next/link";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-wide text-muted mb-3">ADMIN</p>
        <h1 className="font-serif font-semibold text-2xl text-green-deep mb-3">
          Something went wrong loading this page
        </h1>
        <p className="text-sm text-[#444] mb-6">
          This is on our end, not something you did. Please try again in a moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-green-deep text-green-deep px-6 py-3 font-medium hover:bg-[#EFF6F1] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
