import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { ANONYMOUS_RETENTION_DAYS } from "@/config/retention";

/**
 * Daily cron (see vercel.json). Deletes anonymous accounts (no email, no
 * phone) not seen for ANONYMOUS_RETENTION_DAYS: nobody can reach them again
 * once their cookie is gone. Cascades in schema.prisma remove their entries,
 * tax profile, tokens, reminders and suggestions.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - ANONYMOUS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.user.deleteMany({
    where: { email: null, phone: null, lastSeenAt: { lt: cutoff } },
  });
  return NextResponse.json({ deleted: count });
}
