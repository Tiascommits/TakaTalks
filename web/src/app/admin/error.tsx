"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-wide text-muted mb-3">ADMIN</p>
        <h1 className="font-serif font-semibold text-2xl text-green-deep mb-3">
          Something went wrong loading this page
        </h1>
        <p className="text-sm text-[#444] mb-6">
          This is a backend/data issue, not something you did. If it keeps happening, check
          the database migration status before filing a bug.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="bg-green-deep text-paper px-6 py-3 font-medium hover:bg-green transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
