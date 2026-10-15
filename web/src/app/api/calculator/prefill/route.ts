import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { deriveTaxInputFromTracker } from "@/lib/tracker/derive-tax-input";

/**
 * Read-only prefill for /calculator from the person's tracker data, fetched by the
 * browser so the calculator page itself can be static. Never creates a user.
 */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ initial: null });

  const [income, investments, profile] = await Promise.all([
    prisma.incomeEntry.findMany({ where: { userId } }),
    prisma.investmentEntry.findMany({ where: { userId } }),
    prisma.taxProfile.findUnique({ where: { userId } }),
  ]);
  return NextResponse.json({ initial: deriveTaxInputFromTracker(income, investments, profile) });
}
