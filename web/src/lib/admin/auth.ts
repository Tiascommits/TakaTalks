import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "taka_admin_session";
const LEGACY_COOKIE_NAME = "taka_admin";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function adminUserCount(): Promise<number> {
  return prisma.adminUser.count();
}

export async function getCurrentAdminUserId(): Promise<string | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;
  const session = await prisma.adminSession.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.adminUserId;
}

/**
 * True once a real AdminSession exists, OR (bootstrap only) while no
 * AdminUser has been created yet and the legacy ADMIN_SECRET cookie is set —
 * see /admin/setup. The legacy path stops working the moment the first
 * AdminUser is created, by design (see prisma/schema.prisma's AdminUser doc
 * comment): ADMIN_SECRET is a one-time bootstrap, not ongoing auth.
 */
export async function isAdmin(): Promise<boolean> {
  if (await getCurrentAdminUserId()) return true;

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  if ((await adminUserCount()) > 0) return false;

  const store = await cookies();
  return store.get(LEGACY_COOKIE_NAME)?.value === secret;
}

export async function setLegacyAdminCookie(providedSecret: string): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || providedSecret !== secret) return false;
  if ((await adminUserCount()) > 0) return false; // bootstrap window closed

  const store = await cookies();
  store.set(LEGACY_COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60, // short-lived — just enough to complete /admin/setup
    path: "/",
  });
  return true;
}

export async function createAdminSession(adminUserId: string): Promise<void> {
  const session = await prisma.adminSession.create({
    data: { adminUserId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) await prisma.adminSession.delete({ where: { id: sessionId } }).catch(() => {});
  store.delete(SESSION_COOKIE_NAME);
}
