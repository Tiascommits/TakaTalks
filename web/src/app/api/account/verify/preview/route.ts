import { NextResponse } from "next/server";
import { previewVerificationToken } from "@/lib/notify/verification";

/**
 * Read-only: tells the confirmation screen whose (masked) email a magic link
 * belongs to. Never consumes the token and never sets a cookie.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";

  const result = await previewVerificationToken(token);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ destination: result.destination });
}
