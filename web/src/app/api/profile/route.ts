import { NextResponse } from "next/server";
import { TaxpayerCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateUserId } from "@/lib/tracker/session";

const VALID_CATEGORIES = Object.values(TaxpayerCategory);

function nonNegativeInt(n: unknown, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function nonNegativeNumber(n: unknown, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ profile: null });

  const profile = await prisma.taxProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const { category, disabledChildren, firstTimeFiler, netWealth, multiCar, bigHouse } = body ?? {};

  const validCategory: TaxpayerCategory | undefined =
    typeof category === "string" && VALID_CATEGORIES.includes(category as TaxpayerCategory)
      ? (category as TaxpayerCategory)
      : undefined;
  const cleanDisabledChildren =
    disabledChildren !== undefined ? nonNegativeInt(disabledChildren, 0) : undefined;
  const cleanNetWealth = netWealth !== undefined ? nonNegativeNumber(netWealth, 0) : undefined;
  const cleanFirstTimeFiler = typeof firstTimeFiler === "boolean" ? firstTimeFiler : undefined;
  const cleanMultiCar = typeof multiCar === "boolean" ? multiCar : undefined;
  const cleanBigHouse = typeof bigHouse === "boolean" ? bigHouse : undefined;

  const userId = await getOrCreateUserId();
  const profile = await prisma.taxProfile.upsert({
    where: { userId },
    create: {
      userId,
      category: validCategory ?? "GENERAL",
      disabledChildren: cleanDisabledChildren ?? 0,
      firstTimeFiler: cleanFirstTimeFiler ?? false,
      netWealth: cleanNetWealth ?? 0,
      multiCar: cleanMultiCar ?? false,
      bigHouse: cleanBigHouse ?? false,
    },
    update: {
      ...(validCategory !== undefined ? { category: validCategory } : {}),
      ...(cleanDisabledChildren !== undefined ? { disabledChildren: cleanDisabledChildren } : {}),
      ...(cleanFirstTimeFiler !== undefined ? { firstTimeFiler: cleanFirstTimeFiler } : {}),
      ...(cleanNetWealth !== undefined ? { netWealth: cleanNetWealth } : {}),
      ...(cleanMultiCar !== undefined ? { multiCar: cleanMultiCar } : {}),
      ...(cleanBigHouse !== undefined ? { bigHouse: cleanBigHouse } : {}),
    },
  });
  return NextResponse.json({ profile });
}
