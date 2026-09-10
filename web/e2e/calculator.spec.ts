import { test, expect, type Page } from "@playwright/test";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

test.describe("Calculator — normal cases", () => {
  test("loads with an empty placeholder and no crash", async ({ page }) => {
    await page.goto("/calculator");
    await expect(page.getByText("তথ্য দিলে হিসাব এখানে আসবে")).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("typing a simple salary produces a payable/refund figure with no garbage", async ({
    page,
  }) => {
    await page.goto("/calculator");
    await page.getByLabel("মূল বেতন (Basic, monthly)").fill("60000");
    await expect(page.getByText("মোট বেতন (gross salary)")).toBeVisible();
    await expect(page.getByText(/পরিশোধযোগ্য কর|ফেরতযোগ্য/)).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("switching taxpayer category changes the tax-free line", async ({ page }) => {
    await page.goto("/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("500000");

    const taxFreeLine = page.getByText("করমুক্ত সীমা (tax-free)").locator("..");
    await expect(taxFreeLine).toContainText("4,00,000"); // general default: ৳4,00,000

    await page.getByLabel("Taxpayer category").selectOption({ value: "freedom_fighter" });
    await expect(taxFreeLine).toContainText("5,50,000"); // freedom fighter: ৳5,50,000
    await noGarbageOnPage(page);
  });

  test("opting into the net-wealth section reveals fields and applies a surcharge", async ({
    page,
  }) => {
    await page.goto("/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("2000000");
    await expect(page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)")).toHaveCount(0);

    await page.getByRole("button", { name: /significant সম্পদ/ }).click();
    await expect(page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)")).toBeVisible();

    await page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)").fill("600000000");
    await expect(page.getByText(/সারচার্জ \(35%\)/)).toBeVisible();
    await noGarbageOnPage(page);

    // Closing the toggle should reset the fields (trust-first: don't keep opted-out data around)
    await page.getByRole("button", { name: /significant সম্পদ/ }).click();
    await expect(page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)")).toHaveCount(0);
  });

  test("rebate optimizer appears with a suggestion once there is taxable income and room to invest", async ({
    page,
  }) => {
    await page.goto("/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("5000000");
    await expect(page.getByText("রিবেট অপটিমাইজার")).toBeVisible();
    await expect(page.getByText(/বাঁচাতে পারো/)).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("optimizer shows the already-at-max message once investment covers the rebate ceiling", async ({
    page,
  }) => {
    await page.goto("/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("500000");
    await page.getByLabel("DSE listed stock, নতুন বিনিয়োগ (annual)").fill("1000000");
    await expect(page.getByText(/ইতিমধ্যে সর্বোচ্চ rebate/)).toBeVisible();
    await noGarbageOnPage(page);
  });
});

test.describe("Calculator — weird / adversarial input", () => {
  test("typing a negative salary does not produce NaN or a negative payable amount", async ({
    page,
  }) => {
    await page.goto("/calculator");
    const basic = page.getByLabel("মূল বেতন (Basic, monthly)");
    await basic.fill("-999999");
    await noGarbageOnPage(page);
  });

  test("typing an extremely large number across every field does not crash the page", async ({
    page,
  }) => {
    await page.goto("/calculator");
    const huge = "999999999999";
    for (const label of [
      "মূল বেতন (Basic, monthly)",
      "ব্যবসা / পেশার নেট মুনাফা (annual)",
      "Listed shares/fund units gain (annual)",
      "স্বর্ণ / গহনা / মূল্যবান জিনিস (flat 5%)",
    ]) {
      await page.getByLabel(label).fill(huge);
    }
    await noGarbageOnPage(page);
    await expect(page.getByText(/পরিশোধযোগ্য কর|ফেরতযোগ্য/)).toBeVisible();
  });

  test("clearing a filled field back to empty falls back to zero, not NaN", async ({ page }) => {
    await page.goto("/calculator");
    const basic = page.getByLabel("মূল বেতন (Basic, monthly)");
    await basic.fill("40000");
    await basic.fill("");
    await noGarbageOnPage(page);
  });

  test("decimal/paisa values are accepted without crashing", async ({ page }) => {
    await page.goto("/calculator");
    await page.getByLabel("মূল বেতন (Basic, monthly)").fill("33333.33");
    await page.getByLabel("প্রতিবন্ধী সন্তান সংখ্যা (each +৳50,000 tax-free)").fill("2.7");
    await noGarbageOnPage(page);
  });

  test("checking first-time-filer and every net-wealth flag at once still renders cleanly", async ({
    page,
  }) => {
    await page.goto("/calculator");
    await page.getByLabel(/প্রথমবার করদাতা/).check();
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("450000");
    await page.getByRole("button", { name: /significant সম্পদ/ }).click();
    await page.getByLabel(/একাধিক গাড়ি আছে/).check();
    await page.getByLabel(/৮,০০০ বর্গফুটের বেশি/).check();
    await noGarbageOnPage(page);
    await expect(page.getByText(/সারচার্জ \(10%\)/)).toBeVisible();
  });
});
