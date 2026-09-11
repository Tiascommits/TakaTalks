import { NextResponse } from "next/server";
import { isAdmin, getCurrentAdminUserId } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

/**
 * Approve (optionally correcting the value first) or reject one extracted
 * figure. Nothing reaches the public scorecard via the other path —
 * ExtractedFigure rows only render there when approved: true.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { numericValue, rawValue } = body ?? {};

  const data: Record<string, string | number | boolean | Date | null> = {
    approved: true,
    approvedAt: new Date(),
    approvedByAdminId: await getCurrentAdminUserId(),
  };
  if (numericValue !== undefined) data.numericValue = numericValue === null ? null : Number(numericValue);
  if (rawValue !== undefined) data.rawValue = String(rawValue);

  const figure = await prisma.extractedFigure.update({ where: { id }, data }).catch(() => null);
  if (!figure) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logAdminAction("bank-health.approve", "ExtractedFigure", id, data);
  return NextResponse.json({ figure });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.extractedFigure.delete({ where: { id } }).catch(() => null);
  await logAdminAction("bank-health.reject", "ExtractedFigure", id);
  return NextResponse.json({ ok: true });
}
