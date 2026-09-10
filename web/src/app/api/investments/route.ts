import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateUserId } from "@/lib/tracker/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ entries: [] });

  const entries = await prisma.investmentEntry.findMany({
    where: { userId },
    orderBy: { maturityDate: "asc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { label, instrumentType, principalAmount, startDate, termMonths, expectedRatePct } =
    body ?? {};

  if (
    !label ||
    !instrumentType ||
    typeof principalAmount !== "number" ||
    !startDate ||
    typeof termMonths !== "number" ||
    typeof expectedRatePct !== "number"
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  const maturityDate = new Date(start);
  maturityDate.setMonth(maturityDate.getMonth() + termMonths);

  const userId = await getOrCreateUserId();
  const entry = await prisma.investmentEntry.create({
    data: {
      userId,
      label,
      instrumentType,
      principalAmount,
      startDate: start,
      termMonths,
      expectedRatePct,
      maturityDate,
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
