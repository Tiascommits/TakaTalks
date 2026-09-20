import { randomBytes } from "node:crypto";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TEST_DATABASE_URL } from "./test-db";

/**
 * Phone OTPs can't be requested through the app here (WhatsApp isn't
 * configured), so a pending OTP is seeded straight into the test database,
 * then guessed at through the real HTTP route. Every test uses its own phone.
 */
const prisma = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
test.afterAll(async () => {
  await prisma.$disconnect();
});

const uniquePhone = () => `+8801${Math.floor(Math.random() * 1e9).toString().padStart(9, "0")}`;

async function seedOtp(phone: string, code: string) {
  const user = await prisma.user.create({ data: {} });
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      channel: "PHONE",
      destination: phone,
      token: `${phone}:${code}`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
}

async function guess(request: APIRequestContext, phone: string, code: string) {
  const res = await request.post("/api/account/verify", { data: { token: `${phone}:${code}` } });
  return { status: res.status(), body: await res.json() };
}

test.describe("Phone OTP guessing limit (/api/account/verify)", () => {
  test("stops after 5 wrong guesses, even when the next guess is the right code", async ({ request }) => {
    const phone = uniquePhone();
    await seedOtp(phone, "424242");

    for (let i = 0; i < 5; i++) {
      const wrong = await guess(request, phone, `00000${i}`);
      expect(wrong.status).toBe(400);
      expect(wrong.body.error).toBe("invalid");
    }

    const correctButLate = await guess(request, phone, "424242");
    expect(correctButLate.status).toBe(429);
    expect(correctButLate.body.error).toBe("too_many_attempts");

    const token = await prisma.verificationToken.findUnique({ where: { token: `${phone}:424242` } });
    expect(token?.attempts).toBe(5);
    expect(token?.consumedAt).toBeNull(); // the account was not verified
  });

  test("concurrent guesses can't overshoot the limit", async ({ request }) => {
    const phone = uniquePhone();
    await seedOtp(phone, "424242");

    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => guess(request, phone, `1${String(i).padStart(5, "0")}`)));
    const evaluated = results.filter((r) => r.status === 400).length;
    const blocked = results.filter((r) => r.status === 429).length;

    expect(evaluated).toBe(5);
    expect(blocked).toBe(25);
  });

  test("the {code, destination} form draws on the same budget as the scoped-token form", async ({ request }) => {
    const phone = uniquePhone();
    await seedOtp(phone, "424242");

    for (let i = 0; i < 3; i++) await guess(request, phone, `00000${i}`);
    for (let i = 0; i < 2; i++) {
      const res = await request.post("/api/account/verify", { data: { code: `99999${i}`, destination: phone } });
      expect(res.status()).toBe(400);
    }

    const sixth = await request.post("/api/account/verify", { data: { code: "424242", destination: phone } });
    expect(sixth.status()).toBe(429);
  });

  test("the correct code still works within the budget", async ({ request }) => {
    const phone = uniquePhone();
    await seedOtp(phone, "424242");

    expect((await guess(request, phone, "000000")).status).toBe(400);
    expect((await guess(request, phone, "000001")).status).toBe(400);
    const ok = await guess(request, phone, "424242");
    expect(ok.status).toBe(200);
    expect(ok.body.ok).toBe(true);
  });

  test("guessing at a phone with no pending OTP is just 'invalid' and spends nothing", async ({ request }) => {
    const phone = uniquePhone();
    for (let i = 0; i < 8; i++) {
      const res = await guess(request, phone, `00000${i}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid");
    }
  });
});

async function seedEmailLink(email: string) {
  const user = await prisma.user.create({ data: {} });
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      channel: "EMAIL",
      destination: email,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  return token;
}

test.describe("Magic-link confirmation screen", () => {
  test("shows a masked target, and confirming signs in and lands on the tracker", async ({ page }) => {
    const token = await seedEmailLink(`alice.${Date.now()}@example.com`);
    await page.goto(`/account/verify?token=${token}`);

    const target = page.getByTestId("verify-target");
    await expect(target).toContainText("a•••@example.com");
    await expect(target).not.toContainText("alice."); // the address itself is never shown

    await page.getByRole("button", { name: /নিশ্চিত করো ও ট্র্যাকারে যাও/ }).click();
    await expect(page).toHaveURL(/\/tracker\?linked=1/);
  });

  test("previewing does not consume the link", async ({ request }) => {
    const token = await seedEmailLink(`bob.${Date.now()}@example.com`);
    for (let i = 0; i < 3; i++) {
      const res = await request.post("/api/account/verify/preview", { data: { token } });
      expect(res.status()).toBe(200);
      expect((await res.json()).destination).toMatch(/^b•••@example\.com$/);
    }
    const row = await prisma.verificationToken.findUnique({ where: { token } });
    expect(row?.consumedAt).toBeNull();
  });

  test("preview refuses phone OTP tokens, so it can't be used to check guesses", async ({ request }) => {
    const phone = uniquePhone();
    await seedOtp(phone, "424242");

    const right = await request.post("/api/account/verify/preview", { data: { token: `${phone}:424242` } });
    const wrong = await request.post("/api/account/verify/preview", { data: { token: `${phone}:000000` } });
    expect(right.status()).toBe(400);
    expect(wrong.status()).toBe(400);
    expect(await right.json()).toEqual(await wrong.json()); // indistinguishable
  });

  test("an unknown token shows no target, and the confirm button is still offered", async ({ page }) => {
    await page.goto("/account/verify?token=not-a-real-token");
    await expect(page.getByRole("button", { name: /নিশ্চিত করো ও ট্র্যাকারে যাও/ })).toBeVisible();
    await expect(page.getByTestId("verify-target")).toHaveCount(0);
  });
});
