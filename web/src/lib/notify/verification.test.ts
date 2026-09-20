import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, sendWhatsAppTemplate } = vi.hoisted(() => ({
  prisma: {
    verificationToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
  sendWhatsAppTemplate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("./whatsapp", () => ({ isWhatsAppConfigured: () => true, sendWhatsAppTemplate }));
vi.mock("./email", () => ({ isEmailConfigured: () => true, sendEmail: vi.fn() }));

import { consumeVerificationToken, requestPhoneOtp } from "./verification";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("WHATSAPP_OTP_TEMPLATE_NAME", "otp_template");
  prisma.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
  prisma.verificationToken.create.mockResolvedValue({});
  sendWhatsAppTemplate.mockResolvedValue({ sent: true });
});

describe("requestPhoneOtp resend cooldown", () => {
  it("refuses a new OTP while one was issued for that phone in the last minute", async () => {
    prisma.verificationToken.findFirst.mockResolvedValue({ id: "recent" });
    const res = await requestPhoneOtp("user1", "+8801712345678");
    expect(res).toEqual({ ok: false, reason: "too_soon" });
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
    expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled(); // pending token (and its attempt count) kept
    expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
  });

  it("issues an OTP when none was requested recently", async () => {
    prisma.verificationToken.findFirst.mockResolvedValue(null);
    const res = await requestPhoneOtp("user1", "+8801712345678");
    expect(res).toEqual({ ok: true });
    expect(prisma.verificationToken.create).toHaveBeenCalledTimes(1);
  });
});

describe("consumeVerificationToken attempt gate", () => {
  it("spends an attempt (atomically, only while under the limit) before comparing a phone guess", async () => {
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.verificationToken.findUnique.mockResolvedValue(null);

    const res = await consumeVerificationToken("+8801712345678:123456");

    expect(res).toEqual({ ok: false, reason: "invalid" });
    expect(prisma.verificationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          destination: { equals: "+8801712345678", mode: "insensitive" },
          consumedAt: null,
          attempts: { lt: 5 },
        }),
        data: { attempts: { increment: 1 } },
      })
    );
  });

  it("returns too_many_attempts without ever looking the guess up once the budget is spent", async () => {
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.verificationToken.count.mockResolvedValue(1);

    const res = await consumeVerificationToken("+8801712345678:424242");

    expect(res).toEqual({ ok: false, reason: "too_many_attempts" });
    expect(prisma.verificationToken.findUnique).not.toHaveBeenCalled();
  });

  it("treats guesses at a phone with no pending token as plain invalid", async () => {
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.verificationToken.count.mockResolvedValue(0);
    prisma.verificationToken.findUnique.mockResolvedValue(null);

    expect(await consumeVerificationToken("123456", "+8801712345678")).toEqual({ ok: false, reason: "invalid" });
  });

  it("does not use the per-destination gate for a bare magic-link token", async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(null);
    await consumeVerificationToken("a".repeat(64));
    expect(prisma.verificationToken.updateMany).not.toHaveBeenCalled();
  });
});
