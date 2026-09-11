import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { runScrape } from "@/lib/rates/run-scrape";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await runScrape();
  await logAdminAction("rates.run-scrape", "RunScrape", "manual-trigger", summary);
  return NextResponse.json({ summary });
}
