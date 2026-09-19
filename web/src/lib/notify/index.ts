import type { User } from "@prisma/client";
import { fmtTaka } from "@/lib/format";
import { sendEmail, isEmailConfigured } from "./email";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "./whatsapp";

export type NotifyChannel = "EMAIL" | "PHONE";
export type NotifyResult = { channel: NotifyChannel; sent: boolean; reason?: string };

/**
 * A channel only counts as available when it's both verified for this user
 * AND configured on the server — never offer (in UI) or attempt (in a cron)
 * a channel that can't actually deliver. Mirrors the "not available, never
 * guessed" pattern used throughout src/lib/rates.
 */
export function channelsAvailableForUser(
  user: Pick<User, "email" | "emailVerifiedAt" | "phone" | "phoneVerifiedAt">
): NotifyChannel[] {
  const channels: NotifyChannel[] = [];
  if (user.email && user.emailVerifiedAt && isEmailConfigured()) channels.push("EMAIL");
  if (user.phone && user.phoneVerifiedAt && isWhatsAppConfigured()) channels.push("PHONE");
  return channels;
}

/**
 * Sends a maturity reminder to every available channel for this user (not
 * just the first one) — see src/app/api/cron/maturity-reminders/route.ts,
 * which records one ReminderLog row per channel actually sent so a later
 * run never double-sends for the same window.
 */
export async function notifyMaturityReminder(
  user: Pick<User, "id" | "email" | "emailVerifiedAt" | "phone" | "phoneVerifiedAt">,
  investment: { label: string; principalAmount: number; maturityDate: Date },
  // Link to a pre-computed reinvestment suggestion for this investment (see
  // src/lib/reinvest/log.ts and /reinvest). Only added to the free-form
  // email body — the WhatsApp template is pre-approved by Meta with a fixed
  // param count, so it's left unchanged rather than risking a broken send.
  opts?: { reinvestLink?: string }
): Promise<NotifyResult[]> {
  const channels = channelsAvailableForUser(user);
  const dateLabel = investment.maturityDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const results: NotifyResult[] = [];

  if (channels.includes("EMAIL") && user.email) {
    const reinvestLine = opts?.reinvestLink
      ? `\n\nWe've put together a reinvestment suggestion (by category, not a specific bank) for when this matures: ${opts.reinvestLink}`
      : "";
    const { sent, reason } = await sendEmail({
      to: user.email,
      subject: `TakaTalks: "${investment.label}" matures ${dateLabel}`,
      text: `Your investment "${investment.label}" (${fmtTaka(
        investment.principalAmount
      )}) matures on ${dateLabel}. Log in to TakaTalks to confirm the payout once it arrives.${reinvestLine}`,
    });
    results.push({ channel: "EMAIL", sent, reason });
  }

  if (channels.includes("PHONE") && user.phone) {
    const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE_NAME;
    if (!templateName) {
      results.push({ channel: "PHONE", sent: false, reason: "template_not_configured" });
    } else {
      const { sent, reason } = await sendWhatsAppTemplate({
        to: user.phone,
        templateName,
        bodyParams: [investment.label, dateLabel],
      });
      results.push({ channel: "PHONE", sent, reason });
    }
  }

  return results;
}
