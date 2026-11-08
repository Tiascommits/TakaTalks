import { NextResponse } from "next/server";
import { getCurrentUserId, setUserIdCookie } from "@/lib/tracker/session";
import { consumeVerificationToken } from "@/lib/notify/verification";
import { clientIp, overLimit, tooManyRequests } from "@/lib/rate-limit";
import { refuseCrossSite } from "@/lib/same-origin";

/**
 * Direct browser GET navigation — redirects to the confirmation page
 * so automated email scanners/prefetchers do not consume the single-use token.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const redirectTo = new URL(token ? `/account/verify?token=${encodeURIComponent(token)}` : "/tracker", request.url);
  return NextResponse.redirect(redirectTo);
}

/**
 * Token verification handler:
 * - Phone OTP code entry (code + destination)
 * - Email magic-link confirmation (token)
 */
export async function POST(request: Request) {
  // A success sets the session cookie, so another site must not be able to submit this for a visitor.
  const refused = refuseCrossSite(request);
  if (refused) return refused;
  if (await overLimit("link", clientIp(request))) return tooManyRequests();
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const destination = typeof body?.destination === "string" ? body.destination.trim() : undefined;

  const targetTokenOrCode = token || code;
  if (!targetTokenOrCode) {
    return NextResponse.json({ error: "Missing token or code" }, { status: 400 });
  }

  const result = await consumeVerificationToken(targetTokenOrCode, destination, await getCurrentUserId());
  if (!result.ok || !result.userId) {
    const status = result.reason === "too_many_attempts" ? 429 : 400;
    return NextResponse.json({ error: result.reason ?? "invalid" }, { status });
  }

  await setUserIdCookie(result.userId);
  return NextResponse.json({ ok: true });
}
