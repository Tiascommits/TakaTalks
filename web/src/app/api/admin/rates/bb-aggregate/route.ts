import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { label, ratePct, periodLabel, source } = body ?? {};

  const validLabel = typeof label === "string" && label.trim().length > 0;
  const validRate = typeof ratePct === "number" && Number.isFinite(ratePct) && ratePct >= 0;
  const validPeriod = typeof periodLabel === "string" && periodLabel.trim().length > 0;
  const validSource = typeof source === "string" && source.trim().length > 0;

  if (!validLabel || !validRate || !validPeriod || !validSource) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const entry = await prisma.bBAggregateRate.create({
    data: {
      label: label.trim(),
      ratePct,
      periodLabel: periodLabel.trim(),
      source: source.trim(),
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
