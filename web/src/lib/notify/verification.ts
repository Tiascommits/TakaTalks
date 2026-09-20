import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "./email";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "./whatsapp";
import { attemptDestination } from "./attempt-key";
import { maskDestination } from "./mask";

const EMAIL_TOKEN_TTL_MS = 15 * 60 * 1000;
const PHONE_OTP_TTL_MS = 10 * 60 * 1000;
/** Guesses allowed against one pending OTP, and the wait before another OTP can be requested for the same phone. */
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

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

  // Without a cooldown, "request a fresh OTP, spend its guesses, repeat" would reset
  // the attempt budget each time and undo the limit in consumeVerificationToken.
  const recent = await prisma.verificationToken.findFirst({
    where: {
      channel: "PHONE",
      destination: cleanPhone,
      createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    },
  });
  if (recent) return { ok: false, reason: "too_soon" };

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
  // OTP guesses (anything aimed at a phone/email) spend one of the pending token's
  // attempts BEFORE the guess is compared. The increment is a single atomic UPDATE
  // guarded by `attempts < MAX`, so concurrent guesses can't overshoot the limit, and
  // it lives in the database so it holds across serverless instances (attempt-key.ts
  // explains why the bucket is the destination, not the guess).
  const pendingDestination = attemptDestination(tokenOrCode, destination);
  const pendingFilter = {
    destination: { equals: pendingDestination ?? "", mode: "insensitive" as const },
    consumedAt: null,
    expiresAt: { gt: new Date() },
  };
  let rateLimitKey: string | null = null;
  if (pendingDestination) {
    const gate = await prisma.verificationToken.updateMany({
      where: { ...pendingFilter, attempts: { lt: MAX_OTP_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (gate.count === 0) {
      const exhausted = await prisma.verificationToken.count({
        where: { ...pendingFilter, attempts: { gte: MAX_OTP_ATTEMPTS } },
      });
      if (exhausted > 0) return { ok: false, reason: "too_many_attempts" };
      // No pending token for that destination: fall through to a plain "invalid".
    }
  } else {
    // Bare magic-link token: 256 random bits, so only a cheap per-process guard.
    rateLimitKey = `token:${tokenOrCode.trim()}`;
    if (!checkRateLimit(rateLimitKey)) {
      return { ok: false, reason: "too_many_attempts" };
    }
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

  if (rateLimitKey) clearRateLimit(rateLimitKey);

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

export type PreviewResult = { ok: true; destination: string } | { ok: false; reason: string };

/**
 * Who a magic link will sign in, masked, WITHOUT consuming it — shown on the
 * confirmation screen so someone who was handed another person's link can
 * tell it isn't theirs. Email links only: a phone token is `"<phone>:<code>"`,
 * and answering "is this a live token?" for those would be a guess-checking
 * oracle that bypasses the OTP attempt limit in consumeVerificationToken.
 */
export async function previewVerificationToken(token: string): Promise<PreviewResult> {
  const clean = token.trim();
  if (!clean || clean.includes(":")) return { ok: false, reason: "invalid" };

  const record = await prisma.verificationToken.findUnique({ where: { token: clean } });
  if (!record || record.channel !== "EMAIL") return { ok: false, reason: "invalid" };
  if (record.consumedAt) return { ok: false, reason: "already_used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, destination: maskDestination(record.destination) };
}
