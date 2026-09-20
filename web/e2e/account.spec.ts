import { test, expect } from "@playwright/test";

test.describe("Magic-link confirmation (/account/verify)", () => {
  test("has its own page title and is bilingual, following the EN/বাং toggle", async ({ page }) => {
    await page.goto("/account/verify");
    await expect(page).toHaveTitle(/লগইন নিশ্চিত করুন/);

    // Site default language is Bengali.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("লগইন নিশ্চিত করো");
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
    await page.goto("/account/verify?token=not-a-real-token");
    await page.getByRole("button", { name: /নিশ্চিত করো ও ট্র্যাকারে যাও/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "ভেরিফাই করা যায়নি" })).toBeVisible();
    await expect(page).toHaveURL(/\/account\/verify/);
  });
});
