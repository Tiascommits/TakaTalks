import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { daysUntil } from "@/lib/tracker/derive";
import { channelsAvailableForUser, notifyMaturityReminder, type NotifyChannel } from "@/lib/notify";
import { getReinvestContextForUser, logReinvestSuggestion } from "@/lib/reinvest/log";
import { DEFAULT_INFLATION_PCT } from "@/config/inflation";

// Smallest first: an entry only gets the tightest window it is inside.
const REMINDER_WINDOWS_DAYS = [1, 7] as const;

function resolveAppUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return new URL(request.url).origin;
}

/**
 * Daily cron (see vercel.json). For each not-yet-matured, not-yet-confirmed
 * investment, sends at most one reminder per run: for the tightest window it
 * is inside, on each channel not yet logged for that window. The ReminderLog
 * row is inserted before sending, so its unique constraint stops a repeated
 * or overlapping run from sending twice.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maxWindow = Math.max(...REMINDER_WINDOWS_DAYS);
  // Start of today in Bangladesh Standard Time (BST = UTC+6) to avoid cutting off today's maturities
  const BST_OFFSET_MS = 6 * 60 * 60 * 1000;
  const nowBST = new Date(Date.now() + BST_OFFSET_MS);
  const startOfTodayBST = new Date(Date.UTC(nowBST.getUTCFullYear(), nowBST.getUTCMonth(), nowBST.getUTCDate()));
  const startOfToday = new Date(startOfTodayBST.getTime() - BST_OFFSET_MS);

  const investments = await prisma.investmentEntry.findMany({
    where: {
      payoutConfirmed: false,
      maturityDate: {
        gte: startOfToday,
        lte: new Date(Date.now() + (maxWindow + 1) * 24 * 60 * 60 * 1000),
      },
    },
    include: { user: true, reminderLogs: true },
  });

  let attempted = 0;
  let sent = 0;
  const appUrl = resolveAppUrl(request);

  for (const inv of investments) {
    const window = REMINDER_WINDOWS_DAYS.find((w) => daysUntil(inv.maturityDate) <= w);
    if (window === undefined) continue;

    // Claim each channel first. A failed send stays logged (not retried daily);
    // a human fixing the channel can clear the row.
    const channels: NotifyChannel[] = [];
    for (const channel of channelsAvailableForUser(inv.user)) {
      if (inv.reminderLogs.some((l) => l.windowDays === window && l.channel === channel)) continue;
      const claimed = await prisma.reminderLog
        .create({ data: { investmentEntryId: inv.id, windowDays: window, channel } })
        .then(() => true, () => false);
      if (claimed) channels.push(channel);
    }
    if (channels.length === 0) continue;

    attempted++;

    // Pre-compute (and log) a reinvestment suggestion for this investment
    // so the reminder can link straight to it — see
    // src/lib/reinvest/log.ts and the "trigger point" note in
    // docs/product-notes.md's Phase 5 entry. Best-effort: a failure here
    // must never block the reminder itself from sending.
    let reinvestLink: string | undefined;
    try {
      const ctx = await getReinvestContextForUser(inv.userId);
      await logReinvestSuggestion({
        userId: inv.userId,
        investmentEntryId: inv.id,
        reinvestAmount: inv.principalAmount,
        horizonYears: Math.max(0.5, inv.termMonths / 12),
        hasPSR: true,
        inflationPct: DEFAULT_INFLATION_PCT,
        taxResult: ctx.taxResult,
      });
      reinvestLink = `${appUrl}/reinvest?investmentEntryId=${inv.id}`;
    } catch (err) {
      console.error("[cron/maturity-reminders] reinvest suggestion failed:", err);
    }

    const results = await notifyMaturityReminder(
      inv.user,
      { label: inv.label, principalAmount: inv.principalAmount, maturityDate: inv.maturityDate },
      { reinvestLink, channels }
    );
    sent += results.filter((r) => r.sent).length;
  }

  return NextResponse.json({ investmentsChecked: investments.length, attempted, sent });
}
