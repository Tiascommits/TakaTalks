import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "taka_uid";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // 2 years

/**
 * Read-only lookup — never creates a user. Use for GET requests so loading
 * the tracker before anyone has saved anything doesn't silently create an
 * account behind the scenes.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  return user?.id ?? null;
}

/**
 * Creates the anonymous user + cookie on first write, this is the one and
 * only "account creation" moment: the person saves an income/investment
 * entry and we start persisting for them, no email or password collected.
 */
export async function getOrCreateUserId(): Promise<string> {
  const existing = await getCurrentUserId();
  if (existing) return existing;

  const user = await prisma.user.create({ data: {} });
  const store = await cookies();
  store.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return user.id;
}

/**
 * Points this browser's cookie at an explicit user id — used after a
 * magic-link/OTP verification, which may resolve to a *different* user than
 * the one currently in the cookie (see lib/notify/verification.ts's merge
 * behavior when the email/phone already belongs to an existing account).
 */
export async function setUserIdCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}
