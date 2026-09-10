import { NextResponse } from "next/server";
import { InstrumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateUserId } from "@/lib/tracker/session";

const VALID_INSTRUMENTS = Object.values(InstrumentType);

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
  const body = await request.json().catch(() => null);
  const { label, instrumentType, principalAmount, startDate, termMonths, expectedRatePct } =
    body ?? {};

  const validLabel = typeof label === "string" && label.trim().length > 0;
  const validInstrument =
    typeof instrumentType === "string" && VALID_INSTRUMENTS.includes(instrumentType as InstrumentType);
  const validPrincipal =
    typeof principalAmount === "number" && Number.isFinite(principalAmount) && principalAmount > 0;
  const start = new Date(startDate);
  const validStartDate = typeof startDate === "string" && !Number.isNaN(start.getTime());
  const validTerm =
    typeof termMonths === "number" && Number.isFinite(termMonths) && Number.isInteger(termMonths) && termMonths > 0;
  const validRate =
    typeof expectedRatePct === "number" && Number.isFinite(expectedRatePct) && expectedRatePct >= 0;

  if (!validLabel || !validInstrument || !validPrincipal || !validStartDate || !validTerm || !validRate) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const maturityDate = new Date(start);
  maturityDate.setMonth(maturityDate.getMonth() + termMonths);

  const userId = await getOrCreateUserId();
  const entry = await prisma.investmentEntry.create({
    data: {
      userId,
      label: label.trim(),
      instrumentType: instrumentType as InstrumentType,
      principalAmount,
      startDate: start,
      termMonths,
      expectedRatePct,
      maturityDate,
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
