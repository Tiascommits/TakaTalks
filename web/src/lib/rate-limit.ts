import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signedCookieUserId } from "@/lib/tracker/session";

const MINUTE = 60_000;

/** Hits allowed per fixed window. Generous for a person, low enough to stop a script filling the database or the mail quota. */
const LIMITS = {
  write: { limit: 60, windowMs: 10 * MINUTE }, // tracker saves, per session user (per IP before the first save), see overWriteLimit
  writeIp: { limit: 600, windowMs: 10 * MINUTE }, // tracker saves, per IP: only a backstop, since anonymous sessions are free to mint
  link: { limit: 100, windowMs: 60 * MINUTE }, // login link / code requests, per IP: only a backstop, since one carrier IP (CGNAT) can front thousands of people
  linkTo: { limit: 3, windowMs: 15 * MINUTE }, // login link / code requests, per address: the real limit, stops one inbox or phone being flooded
  adminLogin: { limit: 10, windowMs: 15 * MINUTE }, // admin sign-in and setup, per IP
} as const;

/** On Vercel these headers are set by the edge, not the client, so they can't be spoofed there. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

/**
 * Whether a tracker save is over its limit. It counts against the user in the signed session
 * cookie, so people sharing one carrier IP (CGNAT) don't use up each other's budget; never a
 * body field or unsigned header. No valid session yet (the first save creates it) counts
 * against the IP. A high per-IP backstop stops one IP multiplying its budget with throwaway sessions.
 */
export async function overWriteLimit(request: Request): Promise<boolean> {
  const ip = clientIp(request);
  if (await overLimit("writeIp", ip)) return true;
  const userId = await signedCookieUserId();
  return overLimit("write", userId ? `user:${userId}` : ip);
}

/**
 * Counts one hit for `who` in `bucket` and says whether it went over the limit.
 * Kept in Postgres (RateLimit) because serverless instances share no memory;
 * the upsert is a single INSERT ... ON CONFLICT, so concurrent hits all count.
 */
export async function overLimit(bucket: keyof typeof LIMITS, who: string): Promise<boolean> {
  const { limit, windowMs } = LIMITS[bucket];
  const window = Math.floor(Date.now() / windowMs);
  const key = createHash("sha256").update(`${bucket}:${who}:${window}`).digest("hex");
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date((window + 1) * windowMs) },
    update: { count: { increment: 1 } },
  });
  // shortcut: expired rows are swept on ~1% of hits; move this to a cron if the table grows large.
  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  }
  return row.count > limit;
}

export function tooManyRequests() {
  return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
}
