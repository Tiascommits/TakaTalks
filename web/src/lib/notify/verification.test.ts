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
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    incomeEntry: { updateMany: vi.fn() },
    investmentEntry: { updateMany: vi.fn() },
    reinvestSuggestion: { updateMany: vi.fn() },
    taxProfile: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
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

describe("consumeVerificationToken binds the address to the browser that verified it", () => {
  const VICTIM = "victim@example.com";
  const liveLink = (userId: string) => ({
    id: "tok1",
    userId,
    channel: "EMAIL",
    destination: VICTIM,
    consumedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const users: Record<string, object> = {
    anonVictim: { id: "anonVictim", emailVerifiedAt: null, phoneVerifiedAt: null },
    verifiedX: { id: "verifiedX", emailVerifiedAt: null, phoneVerifiedAt: new Date() },
    owner: { id: "owner", email: VICTIM, emailVerifiedAt: new Date(), phoneVerifiedAt: null },
  };

  beforeEach(() => {
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.create.mockResolvedValue({ id: "fresh" });
    prisma.user.update.mockResolvedValue({});
    prisma.user.delete.mockResolvedValue({});
    prisma.$transaction.mockResolvedValue([]);
    prisma.taxProfile.findUnique.mockResolvedValue(null);
  });

  function withUsers(ownerOfVictim: string | null) {
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) =>
      where.email ? (ownerOfVictim ? users[ownerOfVictim] : null) : (users[where.id ?? ""] ?? null)
    );
  }

  const touched = (id: string) =>
    [prisma.user.update, prisma.user.delete, prisma.incomeEntry.updateMany].some((fn) =>
      fn.mock.calls.some(([arg]) => JSON.stringify(arg).includes(`"${id}"`))
    );

  it("attack: a link the attacker requested for the victim's email never lands on the attacker's account", async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(liveLink("attacker"));
    withUsers(null);

    const res = await consumeVerificationToken("a".repeat(64), undefined, "anonVictim");

    expect(res.ok).toBe(true);
    expect(res.userId).not.toBe("attacker");
    expect(touched("attacker")).toBe(false); // no email, no merge, no data moved
    // The victim's browser moves to a fresh account that gets the email, and its old anonymous id is retired.
    expect(res.userId).toBe("fresh");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "fresh" },
      data: { email: VICTIM, emailVerifiedAt: expect.any(Date) },
    });
    expect(prisma.incomeEntry.updateMany).toHaveBeenCalledWith({ where: { userId: "anonVictim" }, data: { userId: "fresh" } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "anonVictim" } });
  });

  it("a browser with no account gets a fresh one", async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(liveLink("attacker"));
    withUsers(null);

    const res = await consumeVerificationToken("a".repeat(64), undefined, null);

    expect(res).toEqual({ ok: true, userId: "fresh" });
    expect(touched("attacker")).toBe(false);
  });

  it("merges the verifying browser's anonymous data into the address's existing owner", async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(liveLink("attacker"));
    withUsers("owner");

    const res = await consumeVerificationToken("a".repeat(64), undefined, "anonVictim");

    expect(res).toEqual({ ok: true, userId: "owner" });
    expect(prisma.incomeEntry.updateMany).toHaveBeenCalledWith({ where: { userId: "anonVictim" }, data: { userId: "owner" } });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(touched("attacker")).toBe(false);
  });

  it("adds the address to a browser that is already verified another way, without merging it away", async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(liveLink("verifiedX"));
    withUsers(null);

    const res = await consumeVerificationToken("a".repeat(64), undefined, "verifiedX");

    expect(res).toEqual({ ok: true, userId: "verifiedX" });
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("two concurrent clicks: only the one that atomically claims the token signs in", async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(liveLink("anonVictim"));
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 0 }); // the other click got there first
    withUsers(null);

    const res = await consumeVerificationToken("a".repeat(64), undefined, "anonVictim");

    expect(res).toEqual({ ok: false, reason: "already_used" });
    expect(prisma.verificationToken.updateMany).toHaveBeenCalledWith({
      where: { id: "tok1", consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
