import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { daysUntil } from "@/lib/tracker/derive";
import { channelsAvailableForUser, notifyMaturityReminder } from "@/lib/notify";
import { getReinvestContextForUser, logReinvestSuggestion } from "@/lib/reinvest/log";

const REMINDER_WINDOWS_DAYS = [7, 1] as const;

function resolveAppUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return new URL(request.url).origin;
}

/**
 * Daily cron (see vercel.json). For each not-yet-matured, not-yet-confirmed
 * investment, sends a reminder once per window per channel — ReminderLog's
 * unique constraint is what actually prevents a double-send if this runs
 * more than once on the same day.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maxWindow = Math.max(...REMINDER_WINDOWS_DAYS);
  const investments = await prisma.investmentEntry.findMany({
    where: {
      payoutConfirmed: false,
      maturityDate: {
        gte: new Date(),
        lte: new Date(Date.now() + maxWindow * 24 * 60 * 60 * 1000),
      },
    },
    include: { user: true, reminderLogs: true },
  });

  let attempted = 0;
  let sent = 0;
  const appUrl = resolveAppUrl(request);
  // At most one ReinvestSuggestion row per investment per cron run, even if
  // both the 7-day and 1-day windows happen to fire in the same run.
  const reinvestLinkByInvestment = new Map<string, string>();

  for (const inv of investments) {
    const daysLeft = daysUntil(inv.maturityDate);
    const availableChannels = channelsAvailableForUser(inv.user);
    if (availableChannels.length === 0) continue;

    for (const window of REMINDER_WINDOWS_DAYS) {
      if (daysLeft > window) continue;

      const alreadySentChannels = new Set(
        inv.reminderLogs.filter((l) => l.windowDays === window).map((l) => l.channel)
      );
      const channelsToSend = availableChannels.filter((c) => !alreadySentChannels.has(c));
      if (channelsToSend.length === 0) continue;

      attempted++;

      // Pre-compute (and log) a reinvestment suggestion for this investment
      // so the reminder can link straight to it — see
      // src/lib/reinvest/log.ts and the "trigger point" note in
      // docs/product-notes.md's Phase 5 entry. Best-effort: a failure here
      // must never block the reminder itself from sending.
      let reinvestLink = reinvestLinkByInvestment.get(inv.id);
      if (!reinvestLink) {
        try {
          const ctx = await getReinvestContextForUser(inv.userId);
          await logReinvestSuggestion({
            userId: inv.userId,
            investmentEntryId: inv.id,
            reinvestAmount: inv.principalAmount,
            horizonYears: Math.max(0.5, inv.termMonths / 12),
            hasPSR: true,
            inflationPct: 8.5,
            taxResult: ctx.taxResult,
          });
          reinvestLink = `${appUrl}/reinvest?investmentEntryId=${inv.id}`;
          reinvestLinkByInvestment.set(inv.id, reinvestLink);
        } catch (err) {
          console.error("[cron/maturity-reminders] reinvest suggestion failed:", err);
        }
      }

      const results = await notifyMaturityReminder(
        inv.user,
        {
          label: inv.label,
          principalAmount: inv.principalAmount,
          maturityDate: inv.maturityDate,
        },
        { reinvestLink }
      );

      for (const result of results) {
        if (!channelsToSend.includes(result.channel)) continue;
        if (result.sent) sent++;
        // Log every attempt (sent or not) for this window+channel so a
        // channel that's misconfigured doesn't get retried every single
        // day — a human fixing it can just clear the log row if needed.
        await prisma.reminderLog
          .create({
            data: {
              investmentEntryId: inv.id,
              windowDays: window,
              channel: result.channel,
            },
          })
          .catch(() => {});
      }
    }
  }

  return NextResponse.json({ investmentsChecked: investments.length, attempted, sent });
}
