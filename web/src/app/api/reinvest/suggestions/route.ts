import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserId } from "@/lib/tracker/session";
import { getReinvestContextForUser, logReinvestSuggestion } from "@/lib/reinvest/log";

/**
 * Persists a computed suggestion. Only called from tracker-integrated
 * flows (a matured/maturing investment's "see reinvestment idea" link, or
 * the maturity-reminder cron) — the generic /reinvest tool computes
 * client-side via the same pure function and never calls this, so idly
 * adjusting sliders on that page never creates an account. Using
 * getOrCreateUserId here mirrors how saving an income/investment entry
 * already works: a quiet anonymous cookie-user, not the "signup" moment
 * (that's still reserved for turning on email/WhatsApp reminders).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const reinvestAmount = body?.reinvestAmount;
  const horizonYears = body?.horizonYears;
  const hasPSR = typeof body?.hasPSR === "boolean" ? body.hasPSR : true;
  const inflationPct =
    typeof body?.inflationPct === "number" && Number.isFinite(body.inflationPct) ? body.inflationPct : 8.5;
  const investmentEntryId = typeof body?.investmentEntryId === "string" ? body.investmentEntryId : null;

  if (typeof reinvestAmount !== "number" || !Number.isFinite(reinvestAmount) || reinvestAmount <= 0) {
    return NextResponse.json({ error: "Invalid reinvestAmount" }, { status: 400 });
  }
  if (typeof horizonYears !== "number" || !Number.isFinite(horizonYears) || horizonYears <= 0) {
    return NextResponse.json({ error: "Invalid horizonYears" }, { status: 400 });
  }

  const userId = await getOrCreateUserId();

  if (investmentEntryId) {
    const inv = await prisma.investmentEntry.findUnique({ where: { id: investmentEntryId } });
    if (!inv || inv.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const ctx = await getReinvestContextForUser(userId);
  const { row, result } = await logReinvestSuggestion({
    userId,
    investmentEntryId,
    reinvestAmount,
    horizonYears,
    hasPSR,
    inflationPct,
    taxResult: ctx.taxResult,
    markSeen: true,
  });

  return NextResponse.json({ id: row.id, result }, { status: 201 });
}
