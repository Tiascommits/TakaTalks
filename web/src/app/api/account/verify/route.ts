import { NextResponse } from "next/server";
import { setUserIdCookie } from "@/lib/tracker/session";
import { consumeVerificationToken } from "@/lib/notify/verification";

/** Email magic-link click — a plain browser GET navigation. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const redirectTo = new URL("/tracker", request.url);

  if (!token) {
    redirectTo.searchParams.set("linkError", "missing_token");
    return NextResponse.redirect(redirectTo);
  }

  const result = await consumeVerificationToken(token);
  if (!result.ok || !result.userId) {
    redirectTo.searchParams.set("linkError", result.reason ?? "invalid");
    return NextResponse.redirect(redirectTo);
  }

  await setUserIdCookie(result.userId);
  redirectTo.searchParams.set("linked", "1");
  return NextResponse.redirect(redirectTo);
}

/** Phone OTP code entry — submitted from a form via fetch. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.code === "string" ? body.code.trim() : "";
  if (!token) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const result = await consumeVerificationToken(token);
  if (!result.ok || !result.userId) {
    return NextResponse.json({ error: result.reason ?? "invalid" }, { status: 400 });
  }

  await setUserIdCookie(result.userId);
  return NextResponse.json({ ok: true });
}
