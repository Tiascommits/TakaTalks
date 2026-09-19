import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/tracker/session";
import { getReinvestContextForUser } from "@/lib/reinvest/log";

/**
 * Read-only prefill for the /reinvest tool. Never creates a user (uses
 * getCurrentUserId, not getOrCreateUserId) — someone who's never touched
 * the tracker still gets a fully working, generic /reinvest tool, just
 * without a tax-rebate-headroom bonus in the scoring.
 */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({
      hasContext: false,
      taxResult: null,
      reinvestableCash: 0,
      defaultAmount: 100_000,
      defaultHorizonYears: 3,
    });
  }

  const ctx = await getReinvestContextForUser(userId);
  return NextResponse.json({ hasContext: ctx.taxResult !== null, ...ctx });
}
