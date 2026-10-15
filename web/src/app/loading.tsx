/** Shown while a database-backed page (tracker, rates, reinvest, account) is on its way. */
export default function Loading() {
  return (
    <div role="status" className="flex-1 flex items-center justify-center px-5 py-16">
      <p className="text-sm text-muted animate-pulse">লোড হচ্ছে… · Loading…</p>
    </div>
  );
}
