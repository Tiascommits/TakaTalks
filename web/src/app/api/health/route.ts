import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FDR_TERMS_MONTHS } from "@/config/rate-monitoring";

/** Hours since `at`, to one decimal, or null when it has never happened. */
function ageHours(at: Date | null, now: number): number | null {
  return at ? Math.round((now - at.getTime()) / 360_000) / 10 : null;
}

/**
 * Public probe for uptime monitors and the post-deploy smoke test
 * (`scripts/smoke.mjs`). Counts and ages only: no secrets, no user rows.
 */
export async function GET() {
  try {
    const [banksWithFdrRates, rate, check] = await Promise.all([
      prisma.bank.count({
        where: {
          active: true,
          rateSnapshots: { some: { instrument: "FDR", termMonths: { in: [...FDR_TERMS_MONTHS] } } },
        },
      }),
      prisma.rateSnapshot.aggregate({ _max: { scrapedAt: true } }),
      prisma.annualReportCheckLog.aggregate({ _max: { checkedAt: true } }),
    ]);
    const now = Date.now();
    return NextResponse.json({
      dbReachable: true,
      banksWithFdrRates,
      rateSnapshotAgeHours: ageHours(rate._max.scrapedAt, now),
      bankHealthCheckAgeHours: ageHours(check._max.checkedAt, now),
    });
  } catch (err) {
    // Logged server-side only: a connection error can name the database host.
    console.error("[api/health] database check failed:", err);
    return NextResponse.json({ dbReachable: false }, { status: 503 });
  }
}
