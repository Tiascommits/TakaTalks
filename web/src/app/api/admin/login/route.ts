import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const secret = body?.secret;

  if (typeof secret !== "string" || secret.length === 0) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 });
  }

  const ok = await setAdminCookie(secret);
  if (!ok) return NextResponse.json({ error: "Invalid secret" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
