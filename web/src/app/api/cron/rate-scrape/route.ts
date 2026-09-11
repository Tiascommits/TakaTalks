import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { runScrape } from "@/lib/rates/run-scrape";
import { getDigest } from "@/lib/rates/digest";
import { sendDigestEmail } from "@/lib/rates/send-digest";

/**
 * Daily cron (see vercel.json) — the automated counterpart to the admin
 * "Run scrape now" button (src/app/admin/rates), which stays for on-demand
 * triggers. Always emails the digest when there's anything worth a human
 * look, per prompts/02's "admin daily digest" requirement.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runScrape();
  const digest = await getDigest();
  const emailed = await sendDigestEmail(digest);

  return NextResponse.json({ summary, digestEmailed: emailed });
}
