import { randomBytes } from "node:crypto";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
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

/** `requesterId` is the account that asked for the link; a new anonymous one if omitted. */
async function seedEmailLink(email: string, requesterId?: string) {
  const userId = requesterId ?? (await prisma.user.create({ data: {} })).id;
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId,
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

const income = (label: string) => ({ label, source: "salary", amount: 1000, frequency: "MONTHLY" });

/** Calls the API from inside the page, so the browser's cookie rules apply (an API request context drops Secure cookies on http://127.0.0.1). */
async function api(page: Page, path: string, body?: unknown) {
  return page.evaluate(
    async ([path, body]) => {
      const init = body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
      const res = await fetch(path, init);
      return { status: res.status, body: await res.json() };
    },
    [path, body] as const
  );
}

test.describe("Magic-link account fixation", () => {
  test("a link the attacker requested for the victim's email never shares the attacker's account", async ({
    page: victim,
    browser,
    baseURL,
  }) => {
    const attackerContext = await browser.newContext({ baseURL });
    const attacker = await attackerContext.newPage();
    await Promise.all([attacker.goto("/account/verify"), victim.goto("/account/verify")]);
    const email = `victim.${Date.now()}@example.com`;
    const tag = randomBytes(4).toString("hex");

    // 1. The attacker gets an anonymous account by saving something...
    expect((await api(attacker, "/api/income", income(`attacker ${tag}`))).status).toBe(201);
    const attackerId = (await prisma.incomeEntry.findFirstOrThrow({ where: { label: `attacker ${tag}` } })).userId;
    // 2. ...and asks for a login link to the victim's email (seeded: email sending is off in tests).
    const token = await seedEmailLink(email, attackerId);

    // 3. The victim, who already saved something anonymously, confirms the genuine link.
    expect((await api(victim, "/api/income", income(`victim before ${tag}`))).status).toBe(201);
    expect((await api(victim, "/api/account/verify", { token })).status).toBe(200);

    const owner = await prisma.user.findUniqueOrThrow({ where: { email }, include: { incomeEntries: true } });
    expect(owner.id).not.toBe(attackerId);
    expect(owner.incomeEntries.map((e) => e.label)).toEqual([`victim before ${tag}`]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: attackerId } })).email).toBeNull();

    // 4. What the victim saves next stays invisible to the attacker.
    expect((await api(victim, "/api/income", income(`victim after ${tag}`))).status).toBe(201);
    const seen = (await api(attacker, "/api/income")).body.entries.map((e: { label: string }) => e.label);
    expect(seen).toEqual([`attacker ${tag}`]);
    await attackerContext.close();
  });
});
