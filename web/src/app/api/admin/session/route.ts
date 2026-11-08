import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, overLimit, tooManyRequests } from "@/lib/rate-limit";
import { randomBytes } from "node:crypto";
import { clearAdminSession, createAdminSession, hashPassword, verifyPassword } from "@/lib/admin/auth";

// An unknown email is checked against this, so it costs the same scrypt time as a known one.
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"));

/** Email+password login, once at least one AdminUser exists. */
export async function POST(request: Request) {
  if (await overLimit("adminLogin", clientIp(request))) return tooManyRequests();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const passwordOk = verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
