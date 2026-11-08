import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/tracker/session";
import { requestEmailLink, requestPhoneOtp } from "@/lib/notify/verification";
import { canonicalDestination, clientIp, overLimit, tooManyRequests } from "@/lib/rate-limit";
import { refuseCrossSite } from "@/lib/same-origin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{7,14}$/; // loose E.164 check

function resolveAppUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return new URL(request.url).origin;
}

/**
 * The one place an account is allowed to appear (see
 * docs/feature-spec-tax-calculator.md) — triggered from the "remind me"
 * toggle on an investment, not from any general signup wall.
 */
export async function POST(request: Request) {
  const refused = refuseCrossSite(request); // getOrCreateUserId below can set the session cookie
  if (refused) return refused;
  if (await overLimit("link", clientIp(request))) return tooManyRequests();
  const body = await request.json().catch(() => null);
  const channel = body?.channel;
  const destination = typeof body?.destination === "string" ? body.destination.trim() : "";

  if (channel !== "EMAIL" && channel !== "PHONE") {
    return NextResponse.json({ error: "channel must be EMAIL or PHONE" }, { status: 400 });
  }
  if (channel === "EMAIL" && !EMAIL_RE.test(destination)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (channel === "PHONE" && !PHONE_RE.test(destination)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  if (await overLimit("linkTo", canonicalDestination(channel, destination))) return tooManyRequests();

  const userId = await getOrCreateUserId();
  const result =
    channel === "EMAIL"
      ? await requestEmailLink(userId, destination, resolveAppUrl(request))
      : await requestPhoneOtp(userId, destination);

  if (!result.ok) {
    // Only fixed codes reach the caller; the provider's own message is logged in lib/notify.
    if (result.reason === "not_configured") return NextResponse.json({ error: "not_configured" }, { status: 503 });
    if (result.reason === "too_soon") return NextResponse.json({ error: "too_soon" }, { status: 429 });
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
