import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const entry = await prisma.investmentEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const payoutAmount = body?.payoutAmount;
  if (typeof payoutAmount !== "number" || !Number.isFinite(payoutAmount) || payoutAmount < 0) {
    return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
  }

  const updated = await prisma.investmentEntry.update({
    where: { id },
    data: { payoutConfirmed: true, payoutAmount, payoutConfirmedAt: new Date() },
  });
  return NextResponse.json({ entry: updated });
}
