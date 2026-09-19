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

const attemptMap = new Map<string, { attempts: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attemptMap.get(key);
  if (!entry || entry.resetAt < now) {
    attemptMap.set(key, { attempts: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.attempts >= 5) {
    return false;
  }
  entry.attempts++;
  return true;
}

function clearRateLimit(key: string): void {
  attemptMap.delete(key);
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

  // Remove existing pending tokens for this email to avoid duplicates
  await prisma.verificationToken
    .deleteMany({
      where: { destination: email.trim().toLowerCase(), consumedAt: null },
    })
    .catch(() => {});

  const token = randomLinkToken();
  await prisma.verificationToken.create({
    data: {
      userId: currentUserId,
      channel: "EMAIL",
      destination: email.trim().toLowerCase(),
      token,
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  });

  const link = `${appUrl}/account/verify?token=${token}`;
  const { sent, reason } = await sendEmail({
    to: email.trim(),
    subject: "Your TakaTalks login link",
    text: `Click to confirm this email and turn on reminders: ${link}\n\nThis link expires in 15 minutes. If you didn't request this, ignore it.`,
  });
  return sent ? { ok: true } : { ok: false, reason };
}

/** Sends an OTP over WhatsApp. Requires the WhatsApp channel to be configured (see todo/my-work). */
export async function requestPhoneOtp(currentUserId: string, phone: string): Promise<RequestResult> {
  if (!isWhatsAppConfigured()) return { ok: false, reason: "not_configured" };
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (!templateName) return { ok: false, reason: "template_not_configured" };

  const cleanPhone = phone.trim();

  // Remove existing pending tokens for this phone to avoid collision
  await prisma.verificationToken
    .deleteMany({
      where: { destination: cleanPhone, consumedAt: null },
    })
    .catch(() => {});

  const code = randomOtpCode();
  // Token is destination-scoped to eliminate global OTP collisions and cross-account guessing
  const token = `${cleanPhone}:${code}`;
  await prisma.verificationToken.create({
    data: {
      userId: currentUserId,
      channel: "PHONE",
      destination: cleanPhone,
      token,
      expiresAt: new Date(Date.now() + PHONE_OTP_TTL_MS),
    },
  });

  const { sent, reason } = await sendWhatsAppTemplate({
    to: cleanPhone,
    templateName,
    bodyParams: [code],
  });
  return sent ? { ok: true } : { ok: false, reason };
}

export type VerifyResult = { ok: boolean; userId?: string; reason?: string };

/**
 * Shared by both the magic-link click and OTP-code submission.
 * Merges accounts safely ONLY after verification succeeds.
 */
export async function consumeVerificationToken(
  tokenOrCode: string,
  destination?: string
): Promise<VerifyResult> {
  const rateLimitKey = destination || tokenOrCode;
  if (!checkRateLimit(rateLimitKey)) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const cleanInput = tokenOrCode.trim();
  let record = await prisma.verificationToken.findUnique({ where: { token: cleanInput } });

  // If not found and destination is provided, check destination:code
  if (!record && destination) {
    const scopedToken = `${destination.trim()}:${cleanInput}`;
    record = await prisma.verificationToken.findUnique({ where: { token: scopedToken } });
  }

  if (!record) return { ok: false, reason: "invalid" };
  if (destination && record.destination.toLowerCase() !== destination.trim().toLowerCase()) {
    return { ok: false, reason: "invalid" };
  }
  if (record.consumedAt) return { ok: false, reason: "already_used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  clearRateLimit(rateLimitKey);

  // Mark token consumed
  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  // Safe deferred post-verification account merge
  const existingUser =
    record.channel === "EMAIL"
      ? await prisma.user.findUnique({ where: { email: record.destination } })
      : await prisma.user.findUnique({ where: { phone: record.destination } });

  let finalUserId = record.userId;
  if (existingUser && existingUser.id !== record.userId) {
    finalUserId = await mergeIntoExistingUser(record.userId, existingUser.id);
  }

  // Update verified timestamp on the confirmed user
  if (record.channel === "EMAIL") {
    await prisma.user.update({
      where: { id: finalUserId },
      data: { email: record.destination, emailVerifiedAt: new Date() },
    });
  } else {
    await prisma.user.update({
      where: { id: finalUserId },
      data: { phone: record.destination, phoneVerifiedAt: new Date() },
    });
  }

  return { ok: true, userId: finalUserId };
}
