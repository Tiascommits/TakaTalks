import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const existing = await prisma.reinvestSuggestion.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const data: Prisma.ReinvestSuggestionUpdateInput = {};
  if (typeof body?.seen === "boolean") {
    data.seen = body.seen;
    data.seenAt = body.seen ? new Date() : null;
  }
  if (typeof body?.dismissed === "boolean") {
    data.dismissed = body.dismissed;
    data.dismissedAt = body.dismissed ? new Date() : null;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.reinvestSuggestion.update({ where: { id }, data });
  return NextResponse.json({ suggestion: updated });
}
