import { NextResponse } from "next/server";
import { IncomeFrequency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateUserId } from "@/lib/tracker/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ entries: [] });

  const entries = await prisma.incomeEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ entries });
}

const VALID_FREQUENCIES = Object.values(IncomeFrequency);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { label, source, amount, frequency } = body ?? {};

  const validLabel = typeof label === "string" && label.trim().length > 0;
  const validSource = typeof source === "string" && source.trim().length > 0;
  const validAmount = typeof amount === "number" && Number.isFinite(amount) && amount > 0;
  const validFrequency =
    typeof frequency === "string" && VALID_FREQUENCIES.includes(frequency as IncomeFrequency);

  if (!validLabel || !validSource || !validAmount || !validFrequency) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const userId = await getOrCreateUserId();
  const entry = await prisma.incomeEntry.create({
    data: {
      userId,
      label: label.trim(),
      source: source.trim(),
      amount,
      frequency: frequency as IncomeFrequency,
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
