import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const entry = await prisma.investmentEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.investmentEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
