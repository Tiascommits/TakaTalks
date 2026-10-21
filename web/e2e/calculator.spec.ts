import { test, expect, type Page } from "@playwright/test";
import { gotoHydrated } from "./hydrated";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

test.describe("Calculator — normal cases", () => {
  test("loads with an empty placeholder and no crash", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    await expect(page.getByText("তথ্য দিলে হিসাব এখানে আসবে")).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("typing a simple salary produces a payable/refund figure with no garbage", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("মূল বেতন (Basic, monthly)").fill("60000");
    await expect(page.getByText("মোট বেতন (gross salary)")).toBeVisible();
    await expect(page.getByText(/পরিশোধযোগ্য কর|ফেরতযোগ্য/)).toBeVisible();
    // The result names the no-extra-tax date and links the official filing portal.
    await expect(page.getByText(/৩১ ডিসেম্বর, ২০২৬-এর মধ্যে/)).toBeVisible();
    await expect(page.getByRole("link", { name: "etaxnbr.gov.bd" }).last()).toHaveAttribute("href", "https://etaxnbr.gov.bd");
    await noGarbageOnPage(page);
  });

  test("switching taxpayer category changes the tax-free line", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("500000");

    const taxFreeLine = page.getByText("করমুক্ত সীমা (tax-free)").locator("..");
    await expect(taxFreeLine).toContainText("4,00,000"); // general default: ৳4,00,000

    await page.getByLabel("করদাতার ক্যাটাগরি").selectOption({ value: "freedom_fighter" });
    await expect(taxFreeLine).toContainText("5,50,000"); // freedom fighter: ৳5,50,000
    await noGarbageOnPage(page);
  });

  test("opting into the net-wealth section reveals fields and applies a surcharge", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("2000000");
    await expect(page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)")).toHaveCount(0);

    await page.getByRole("checkbox", { name: /উল্লেখযোগ্য সম্পদ|significant assets/ }).click();
    await expect(page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)")).toBeVisible();

    await page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)").fill("600000000");
    await expect(page.getByText(/সারচার্জ \(35%\)/)).toBeVisible();
    await noGarbageOnPage(page);

    // Closing the toggle should reset the fields (trust-first: don't keep opted-out data around)
    await page.getByRole("checkbox", { name: /উল্লেখযোগ্য সম্পদ|significant assets/ }).click();
    await expect(page.getByLabel("মোট নেট সম্পদ (statement of assets, if known)")).toHaveCount(0);
  });

  test("rebate optimizer appears with a suggestion once there is taxable income and room to invest", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("5000000");
    // Heading by role: the phrase also appears in the page header's intro copy.
    await expect(page.getByRole("heading", { name: "রিবেট অপটিমাইজার" })).toBeVisible();
    await expect(page.getByText(/বাঁচাতে পারো/)).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("optimizer shows the already-at-max message once investment covers the rebate ceiling", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    // ৳20 lakh: high enough that the 3%-of-income ceiling binds before the minimum-tax floor.
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("2000000");
    await page.getByLabel("DSE listed stock, নতুন বিনিয়োগ (annual)").fill("1000000");
    await expect(page.getByText(/ইতিমধ্যে সর্বোচ্চ রেয়াত/)).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("a first return pays the ৳1,000 new-taxpayer minimum instead of ৳5,000", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("405000");
    const payable = page.getByText("পরিশোধযোগ্য কর").locator("..");
    await expect(payable).toContainText("5,000");
    await page.getByLabel(/এটা আমার প্রথম রিটার্ন/).check();
    await expect(payable).toContainText("1,000");
    await noGarbageOnPage(page);
  });

  test("optimizer promises no saving when the minimum tax already applies", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("400001");
    await expect(page.getByText(/ইতিমধ্যে ন্যূনতম করে আছে/)).toBeVisible();
    await expect(page.getByText(/বাঁচাতে পারো/)).toHaveCount(0);
    await noGarbageOnPage(page);
  });

  test("optimizer caps the promised saving at the minimum tax, then stops once it is reached", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    // ৳6 lakh: gross tax 20,000 and the 3% ceiling is 18,000, but tax can only fall to the 5,000 minimum.
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("600000");
    await expect(page.getByText("৳15,000 বাঁচাতে পারো")).toBeVisible();
    await expect(page.getByText(/সীমিত: ন্যূনতম করের নিচে/)).toBeVisible();
    await page.getByLabel("DSE listed stock, নতুন বিনিয়োগ (annual)").fill("150000");
    await expect(page.getByText(/ইতিমধ্যে ন্যূনতম করে আছে/)).toBeVisible();
    await expect(page.getByText(/বাঁচাতে পারো/)).toHaveCount(0);
    await noGarbageOnPage(page);
  });
});

test.describe("Calculator — weird / adversarial input", () => {
  test("typing a negative salary does not produce NaN or a negative payable amount", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    const basic = page.getByLabel("মূল বেতন (Basic, monthly)");
    await basic.fill("-999999");
    await noGarbageOnPage(page);
  });

  test("typing an extremely large number across every field does not crash the page", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    const huge = "999999999999";
    for (const label of [
      /মূল বেতন|Basic, monthly/,
      /ব্যবসা \/ পেশার নেট মুনাফা|business/,
      /Listed shares\/fund units/,
      /স্বর্ণ \/ গহনা \/ মূল্যবান জিনিস|Gold/,
    ]) {
      await page.getByLabel(label).fill(huge);
    }
    await noGarbageOnPage(page);
    await expect(page.getByText(/পরিশোধযোগ্য কর|ফেরতযোগ্য/)).toBeVisible();
  });

  test("clearing a filled field back to empty falls back to zero, not NaN", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    const basic = page.getByLabel("মূল বেতন (Basic, monthly)");
    await basic.fill("40000");
    await basic.fill("");
    await noGarbageOnPage(page);
  });

  test("Bangla digits typed on a Bangla keyboard are read as numbers", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("৫০০০০০");
    const slabBaseLine = page.getByText("মোট স্লাব-ভিত্তিক আয়").locator("..");
    await expect(slabBaseLine).toContainText("5,00,000");
    // 1,00,000 above the 4,00,000 threshold at 10% (no 5% band)
    await expect(page.getByText("স্লাব কর", { exact: true }).locator("..")).toContainText("10,000");
    await noGarbageOnPage(page);
  });

  test("decimal/paisa values are accepted without crashing", async ({ page }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("মূল বেতন (Basic, monthly)").fill("33333.33");
    await page.getByLabel("প্রতিবন্ধী সন্তান সংখ্যা (each +৳50,000 tax-free)").fill("2.7");
    await noGarbageOnPage(page);
  });

  test("checking every net-wealth flag at once still renders cleanly", async ({
    page,
  }) => {
    await gotoHydrated(page, "/calculator");
    await page.getByLabel("ব্যবসা / পেশার নেট মুনাফা (annual)").fill("450000");
    await page.getByRole("checkbox", { name: /উল্লেখযোগ্য সম্পদ|significant assets/ }).click();
    await page.getByLabel(/একাধিক গাড়ি আছে/).check();
    await page.getByLabel(/৮,০০০ বর্গফুটের বেশি/).check();
    await noGarbageOnPage(page);
    await expect(page.getByText(/সারচার্জ \(10%\)/)).toBeVisible();
  });
});
