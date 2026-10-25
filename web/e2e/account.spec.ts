import { randomBytes } from "node:crypto";
import { gotoHydrated } from "./hydrated";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TEST_DATABASE_URL } from "./test-db";

const prisma = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Magic-link confirmation (/account/verify)", () => {
  test("has its own page title and is bilingual, following the EN/বাং toggle", async ({ page }) => {
    await page.goto("/account/verify");
    await expect(page).toHaveTitle(/লগইন নিশ্চিত করুন/);

    // Site default language is Bengali.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("লগইন নিশ্চিত করুন");
    await expect(page.getByRole("alert").filter({ hasText: "ভেরিফিকেশন লিংক" })).toBeVisible();

    // The error is stored as a code, so it must re-render when the language changes.
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Confirm Your TakaTalks Login");
    await expect(page.getByRole("alert").filter({ hasText: "Missing or invalid verification link" })).toBeVisible();
  });

  test("is kept out of search indexes", async ({ page }) => {
    await page.goto("/account/verify?token=anything");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("an invalid token shows a specific failure message, not a crash", async ({ page }) => {
    await gotoHydrated(page, "/account/verify?token=not-a-real-token");
    await page.getByRole("button", { name: /নিশ্চিত করুন ও ট্র্যাকারে যান/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "ভেরিফাই করা যায়নি" })).toBeVisible();
    await expect(page).toHaveURL(/\/account\/verify/);
  });
});

test.describe("Delete my data (/account)", () => {
  test("after a confirm step, deletes every row the browser's account owns and signs it out", async ({ page, context }) => {
    await gotoHydrated(page, "/account");
    await expect(page.getByText("এই ব্রাউজারের জন্য কিছু সেভ করা নেই।")).toBeVisible();

    // Save through the app from inside the page, so the browser's cookie rules apply.
    const tag = randomBytes(4).toString("hex");
    const statuses = await page.evaluate(async (tag) => {
      const send = (path: string, method: string, body: unknown) =>
        fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.status);
      return [
        await send("/api/income", "POST", { label: `del ${tag}`, source: "salary", amount: 1000, frequency: "MONTHLY" }),
        await send("/api/investments", "POST", {
          label: `del ${tag}`,
          instrumentType: "DPS",
          principalAmount: 1000,
          startDate: "2026-01-01",
          termMonths: 12,
          expectedRatePct: 5,
        }),
        await send("/api/profile", "PUT", { disabledChildren: 1 }),
      ];
    }, tag);
    expect(statuses).toEqual([201, 201, 200]);

    const userId = (await prisma.incomeEntry.findFirstOrThrow({ where: { label: `del ${tag}` } })).userId;
    const investment = await prisma.investmentEntry.findFirstOrThrow({ where: { userId } });
    await prisma.reminderLog.create({ data: { investmentEntryId: investment.id, windowDays: 7, channel: "EMAIL" } });
    await prisma.verificationToken.create({
      data: { userId, channel: "EMAIL", destination: `del.${tag}@example.com`, token: `del-${tag}`, expiresAt: new Date(Date.now() + 60_000) },
    });

    await page.reload();
    await expect(page.getByTestId("saved-summary")).toContainText("আয়ের এন্ট্রি: 1");
    await page.getByRole("button", { name: "আমার ডেটা মুছে ফেলুন" }).click();
    expect(await prisma.user.count({ where: { id: userId } })).toBe(1); // nothing deleted before confirming
    await page.getByRole("button", { name: "হ্যাঁ, সব মুছে ফেলুন" }).click();
    await expect(page.getByRole("status").filter({ hasText: "আপনার ডেটা মুছে ফেলা হয়েছে" })).toBeVisible();

    expect(await prisma.user.count({ where: { id: userId } })).toBe(0);
    expect(await prisma.incomeEntry.count({ where: { userId } })).toBe(0);
    expect(await prisma.investmentEntry.count({ where: { userId } })).toBe(0);
    expect(await prisma.taxProfile.count({ where: { userId } })).toBe(0);
    expect(await prisma.verificationToken.count({ where: { userId } })).toBe(0);
    expect(await prisma.reminderLog.count({ where: { investmentEntryId: investment.id } })).toBe(0);
    expect((await context.cookies()).find((c) => c.name === "taka_uid")).toBeUndefined();
  });
});
