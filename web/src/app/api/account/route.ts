import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearUserIdCookie, getCurrentUserId } from "@/lib/tracker/session";

/**
 * "Delete my data" on /account. Deleting the User cascades (see
 * prisma/schema.prisma) to its income and investment entries, their reminder
 * logs, the tax profile, verification tokens and reinvestment suggestions.
 */
export async function DELETE() {
  const userId = await getCurrentUserId();
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  await clearUserIdCookie();
  return NextResponse.json({ ok: true });
}
