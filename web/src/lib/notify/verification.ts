import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "./email";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "./whatsapp";

const EMAIL_TOKEN_TTL_MS = 15 * 60 * 1000;
const PHONE_OTP_TTL_MS = 10 * 60 * 1000;

function randomLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function randomOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * If `email` already belongs to a different user, the current anonymous
 * cookie-user's tracker data is merged into that account and the now-empty
 * anonymous user is dropped, rather than creating a duplicate. This is what
 * makes "log in with the email you used on your other device" work as
 * recovery, not just as a second empty account.
 */
async function resolveTargetUserIdForEmail(currentUserId: string, email: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing || existing.id === currentUserId) return currentUserId;
  return mergeIntoExistingUser(currentUserId, existing.id);
}

async function resolveTargetUserIdForPhone(currentUserId: string, phone: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (!existing || existing.id === currentUserId) return currentUserId;
  return mergeIntoExistingUser(currentUserId, existing.id);
}

async function mergeIntoExistingUser(fromUserId: string, intoUserId: string): Promise<string> {
  await prisma.$transaction([
    prisma.incomeEntry.updateMany({ where: { userId: fromUserId }, data: { userId: intoUserId } }),
    prisma.investmentEntry.updateMany({ where: { userId: fromUserId }, data: { userId: intoUserId } }),
  ]);

  const [fromProfile, intoProfile] = await Promise.all([
    prisma.taxProfile.findUnique({ where: { userId: fromUserId } }),
    prisma.taxProfile.findUnique({ where: { userId: intoUserId } }),
  ]);
  if (fromProfile && !intoProfile) {
    await prisma.taxProfile.update({ where: { userId: fromUserId }, data: { userId: intoUserId } });
  }

  await prisma.user.delete({ where: { id: fromUserId } }).catch(() => {});
  return intoUserId;
}

export type RequestResult = { ok: boolean; reason?: string };

/** Sends a magic-link email. Requires the email channel to be configured. */
export async function requestEmailLink(
  currentUserId: string,
  email: string,
  appUrl: string
): Promise<RequestResult> {
  if (!isEmailConfigured()) return { ok: false, reason: "not_configured" };

  const targetUserId = await resolveTargetUserIdForEmail(currentUserId, email);
  const token = randomLinkToken();
  await prisma.verificationToken.create({
    data: {
      userId: targetUserId,
      channel: "EMAIL",
      destination: email,
      token,
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  });

  const link = `${appUrl}/account/verify?token=${token}`;
  const { sent, reason } = await sendEmail({
    to: email,
    subject: "Your Takatox login link",
    text: `Click to confirm this email and turn on reminders: ${link}\n\nThis link expires in 15 minutes. If you didn't request this, ignore it.`,
  });
  return sent ? { ok: true } : { ok: false, reason };
}

/** Sends an OTP over WhatsApp. Requires the WhatsApp channel to be configured (see todo/my-work). */
export async function requestPhoneOtp(currentUserId: string, phone: string): Promise<RequestResult> {
  if (!isWhatsAppConfigured()) return { ok: false, reason: "not_configured" };
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (!templateName) return { ok: false, reason: "template_not_configured" };

  const targetUserId = await resolveTargetUserIdForPhone(currentUserId, phone);
  const code = randomOtpCode();
  await prisma.verificationToken.create({
    data: {
      userId: targetUserId,
      channel: "PHONE",
      destination: phone,
      token: code,
      expiresAt: new Date(Date.now() + PHONE_OTP_TTL_MS),
    },
  });

  const { sent, reason } = await sendWhatsAppTemplate({
    to: phone,
    templateName,
    bodyParams: [code],
  });
  return sent ? { ok: true } : { ok: false, reason };
}

export type VerifyResult = { ok: boolean; userId?: string; reason?: string };

/** Shared by both the magic-link click and OTP-code submission. */
export async function consumeVerificationToken(token: string): Promise<VerifyResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return { ok: false, reason: "invalid" };
  if (record.consumedAt) return { ok: false, reason: "already_used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    record.channel === "EMAIL"
      ? prisma.user.update({
          where: { id: record.userId },
          data: { email: record.destination, emailVerifiedAt: new Date() },
        })
      : prisma.user.update({
          where: { id: record.userId },
          data: { phone: record.destination, phoneVerifiedAt: new Date() },
        }),
  ]);

  return { ok: true, userId: record.userId };
}
