import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const body = await request.json();
  const { label, source, amount, frequency } = body ?? {};

  if (!label || !source || typeof amount !== "number" || !frequency) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const userId = await getOrCreateUserId();
  const entry = await prisma.incomeEntry.create({
    data: { userId, label, source, amount, frequency },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
