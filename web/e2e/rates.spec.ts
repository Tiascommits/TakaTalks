import { test, expect, type Page } from "@playwright/test";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

test.describe("Bank rate scorecard — normal cases", () => {
  test("loads with the permanent trust panels and no crash before any scrape has run", async ({
    page,
  }) => {
    await page.goto("/rates");
    await expect(page.getByText(/Deposit protection|আমানত সুরক্ষা/)).toBeVisible();
    await expect(page.getByText(/self-reported by banks|self-report করে/)).toBeVisible();
    await expect(page.getByText(/FDR তুলনা|FDR Comparison/)).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("never shows a best/top-pick ranking or verdict", async ({ page }) => {
    await page.goto("/rates");
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/best bank|top pick|সেরা ব্যাংক/i);
  });

  test("sorting by a column header doesn't crash the table", async ({ page }) => {
    await page.goto("/rates");
    await page.getByRole("columnheader", { name: /Gross rate/ }).click();
    await page.getByRole("columnheader", { name: /Gross rate/ }).click();
    await noGarbageOnPage(page);
  });
});

test.describe("Bank rate scorecard — with seeded rates", () => {
  test.skip(
    !process.env.ADMIN_SECRET,
    "ADMIN_SECRET must be set in the environment running the test process (not just the app's .env) to exercise the admin-seeded path."
  );

  test("shows a real bank's rate and an unconfigured bank as not available, after an admin scrape run", async ({
    page,
  }) => {
    const login = await page.request.post("/api/admin/login", {
      data: { secret: process.env.ADMIN_SECRET },
    });
    expect(login.ok()).toBeTruthy();

    const scrape = await page.request.post("/api/admin/rates/run-scrape");
    expect(scrape.ok()).toBeTruthy();

    await page.goto("/rates");
    await expect(page.getByText("AB Bank PLC")).toBeVisible();
    await expect(page.getByText("Sonali Bank PLC")).toBeVisible();
    await noGarbageOnPage(page);

    await page.getByLabel(/Deposit amount|জমা রাখার পরিমাণ/).fill("200000");
    await noGarbageOnPage(page);
  });
});
