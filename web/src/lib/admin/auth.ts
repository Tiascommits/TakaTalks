import { cookies } from "next/headers";

const COOKIE_NAME = "taka_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Lightweight shared-secret gate for the internal admin pages (rate-scrape
 * trigger, BB aggregate entry, bank profile edits) — there's no user/role
 * system in this app yet, so this is a single ADMIN_SECRET env var rather
 * than real auth. Good enough for a solo-operator internal tool; revisit if
 * more than one person needs admin access.
 */
export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === secret;
}

export async function setAdminCookie(providedSecret: string): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || providedSecret !== secret) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return true;
}
