/**
 * Shared guard for the /api/cron/* routes. Vercel Cron sends
 * `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set
 * on the project — see https://vercel.com/docs/cron-jobs/manage-cron-jobs.
 * Without CRON_SECRET set, these routes refuse everything rather than
 * running unauthenticated (the admin "run now" buttons are the manual path).
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
