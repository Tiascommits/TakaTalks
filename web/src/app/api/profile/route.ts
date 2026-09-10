import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateUserId } from "@/lib/tracker/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ profile: null });

  const profile = await prisma.taxProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { category, disabledChildren, firstTimeFiler, netWealth, multiCar, bigHouse } = body ?? {};

  const userId = await getOrCreateUserId();
  const profile = await prisma.taxProfile.upsert({
    where: { userId },
    create: {
      userId,
      category: category ?? "GENERAL",
      disabledChildren: disabledChildren ?? 0,
      firstTimeFiler: firstTimeFiler ?? false,
      netWealth: netWealth ?? 0,
      multiCar: multiCar ?? false,
      bigHouse: bigHouse ?? false,
    },
    update: {
      ...(category !== undefined ? { category } : {}),
      ...(disabledChildren !== undefined ? { disabledChildren } : {}),
      ...(firstTimeFiler !== undefined ? { firstTimeFiler } : {}),
      ...(netWealth !== undefined ? { netWealth } : {}),
      ...(multiCar !== undefined ? { multiCar } : {}),
      ...(bigHouse !== undefined ? { bigHouse } : {}),
    },
  });
  return NextResponse.json({ profile });
}
