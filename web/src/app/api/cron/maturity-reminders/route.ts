import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { daysUntil } from "@/lib/tracker/derive";
import { channelsAvailableForUser, notifyMaturityReminder } from "@/lib/notify";

const REMINDER_WINDOWS_DAYS = [7, 1] as const;

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
      const results = await notifyMaturityReminder(inv.user, {
        label: inv.label,
        principalAmount: inv.principalAmount,
        maturityDate: inv.maturityDate,
      });

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
