import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "taka_uid";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // 2 years

/**
 * Key for the session-cookie HMAC. Prefers a dedicated SESSION_SECRET; falls
 * back to ADMIN_SECRET so existing deployments keep working. In production
 * there is no literal default: with neither set this throws, so a
 * misconfigured deploy fails on the first cookie read/write instead of
 * silently signing sessions with a key that is in the source tree.
 * (Evaluated per call, not at import, so `next build` doesn't need it.)
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is not set (and ADMIN_SECRET is not set as a fallback). Refusing to sign sessions in production."
    );
  }
  return "takatalks-dev-only-session-secret";
}

export function signUserId(userId: string): string {
  const secret = getSessionSecret();
  const signature = createHmac("sha256", secret).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

export function verifyAndExtractUserId(cookieValue: string): string | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [userId, candidateSig] = parts;
  const secret = getSessionSecret();
  const expectedSig = createHmac("sha256", secret).update(userId).digest("hex");
  const candidateBuf = Buffer.from(candidateSig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (candidateBuf.length !== expectedBuf.length || !timingSafeEqual(candidateBuf, expectedBuf)) {
    return null;
  }
  return userId;
}

/**
 * Read-only lookup — never creates a user. Verifies HMAC cookie signature
 * before querying the database, preventing CUID guessing or spoofing.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const id = verifyAndExtractUserId(raw);
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  return user?.id ?? null;
}

/**
 * Creates the anonymous user + signed cookie on first write.
 */
export async function getOrCreateUserId(): Promise<string> {
  const existing = await getCurrentUserId();
  if (existing) return existing;

  const user = await prisma.user.create({ data: {} });
  await setUserIdCookie(user.id);
  return user.id;
}

/**
 * Points this browser's cookie at an explicit user id with cryptographic signature.
 */
export async function setUserIdCookie(userId: string): Promise<void> {
  const store = await cookies();
  const signed = signUserId(userId);
  store.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}
