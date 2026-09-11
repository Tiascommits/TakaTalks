import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAdminSession, createAdminSession, verifyPassword } from "@/lib/admin/auth";

/** Email+password login, once at least one AdminUser exists. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
