import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminUserCount, createAdminSession, hashPassword } from "@/lib/admin/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** One-time bootstrap: creates the first AdminUser, gated by ADMIN_SECRET. */
export async function POST(request: Request) {
  if ((await adminUserCount()) > 0) {
    return NextResponse.json({ error: "Already set up — use /admin/login" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const secret = body?.secret;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid admin secret" }, { status: 401 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 });
  }

  const admin = await prisma.adminUser.create({
    data: { email, passwordHash: hashPassword(password) },
  });
  await createAdminSession(admin.id);

  return NextResponse.json({ ok: true });
}
