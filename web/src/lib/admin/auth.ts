import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "taka_admin_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** The cookie holds a random token; the database holds only its hash, so a leaked row can't be replayed. */
function sessionIdFor(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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
  const session = await prisma.adminSession.findUnique({ where: { id: sessionIdFor(sessionId) } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.adminUserId;
}

/**
 * True only with a live AdminSession. Before the first AdminUser exists,
 * /admin/setup creates one (gated by ADMIN_SECRET), so no other path is needed.
 */
export async function isAdmin(): Promise<boolean> {
  return (await getCurrentAdminUserId()) !== null;
}

export async function createAdminSession(adminUserId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await prisma.adminSession.create({
    data: { id: sessionIdFor(token), adminUserId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // Vercel serves only HTTPS. Not NODE_ENV: e2e runs `next start` over plain http, where a Secure cookie is dropped.
    secure: process.env.VERCEL === "1",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) await prisma.adminSession.delete({ where: { id: sessionIdFor(sessionId) } }).catch(() => {});
  store.delete(SESSION_COOKIE_NAME);
}
