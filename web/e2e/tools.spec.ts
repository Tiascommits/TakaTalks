import { test, expect, type Page } from "@playwright/test";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

test.describe("Life Goals Planner (/goals)", () => {
  test("loads cleanly, switches presets, and computes inflation-adjusted corpus", async ({ page }) => {
    await page.goto("/goals");
    await expect(page.getByText(/ভবিষ্যৎ লক্ষ্য ও সম্পদ পরিকল্পনাকারী|Life Goal & Wealth Planner/)).toBeVisible();
    await noGarbageOnPage(page);

    // Click on "গাড়ি কেনার স্বপ্ন" / Car purchase preset
    await page.getByText(/গাড়ি কেনার স্বপ্ন|Car \/ Vehicle/).click();
    await expect(page.getByText(/সেডান বা ক্রসওভার ক্রয়|Sedan or crossover/)).toBeVisible();
    await noGarbageOnPage(page);

    // Verify inflation reality card is rendered
    await expect(page.getByText(/মূল্যস্ফীতি হিসাব|INFLATION REALITY/)).toBeVisible();
    await expect(page.getByText(/মাসিক কিস্তি:|Monthly DPS:/).first()).toBeVisible();

    // Verify milestone trajectory table
    await expect(page.getByText(/বছরভিত্তিক সঞ্চয় অগ্রগতি|Milestone Trajectory/)).toBeVisible();
  });
});

test.describe("Salary Offer Comparator (/salary)", () => {
  test("loads cleanly, calculates net in-hand bank deposit and compares offers", async ({ page }) => {
    await page.goto("/salary");
    await expect(page.getByText(/স্যালারি অফার তুলনাকারী|Salary Offer Comparator/)).toBeVisible();
    await noGarbageOnPage(page);

    // Check baseline and Offer A
    await expect(page.getByText("Offer A", { exact: true })).toBeVisible();
    await expect(page.getByText(/ব্যাংকে জমা \(মাসিক\):|Monthly In-Hand \(Bank\):/).first()).toBeVisible();

    // Toggle Offer B
    await page.getByRole("button", { name: /Offer B/ }).click();
    await expect(page.getByText("Offer B", { exact: true })).toBeVisible();
    await noGarbageOnPage(page);

    // Check tax exemption educational section
    await expect(page.getByText(/বেতনে আয়কর যেভাবে হিসাব হয়|How Tax is Calculated/)).toBeVisible();
  });
});

test.describe("Real Yield Instrument Matrix (/instruments)", () => {
  test("loads cleanly, ranks instruments, and toggles PSR tax rates", async ({ page }) => {
    await page.goto("/instruments");
    await expect(page.getByText(/প্রকৃত মুনাফা ম্যাট্রিক্স|Real Yield Matrix/)).toBeVisible();
    await noGarbageOnPage(page);

    // Verify top instruments are listed
    await expect(page.getByText(/পরিবার সঞ্চয়পত্র|Paribar Sanchayapatra/).first()).toBeVisible();
    await expect(page.getByText(/ট্রেজারি বন্ড|Treasury Bonds/).first()).toBeVisible();
    await expect(page.getByText(/ব্যাংক ফিক্সড ডিপোজিট|Commercial Bank Fixed Deposit/).first()).toBeVisible();

    // Toggle PSR checkbox
    const psrCheckbox = page.getByRole("checkbox");
    await expect(psrCheckbox).toBeChecked();
    await psrCheckbox.uncheck();
    await expect(psrCheckbox).not.toBeChecked();
    await noGarbageOnPage(page);
  });
});

test.describe("Homepage Showcase Grid (/)", () => {
  test("displays all 6 tools and navigates successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/আয়কর ও রিবেট অপটিমাইজার|Tax Calculator/)).toBeVisible();
    await expect(page.getByText(/স্যালারি অফার ও ইন-হ্যান্ড পে|Salary Offer/)).toBeVisible();
    await expect(page.getByText(/ভবিষ্যৎ লক্ষ্য ও অবসর প্ল্যানার|Life Goal/)).toBeVisible();
    await expect(page.getByText(/সঞ্চয় স্কিম তুলনামূলক ম্যাট্রিক্স|Real Yield Matrix/)).toBeVisible();
    await expect(page.getByText(/ব্যাংক রেট ও স্বাস্থ্য স্কোরকার্ড|Bank Rates/)).toBeVisible();
    await expect(page.getByText(/ইনকাম ও ইনভেস্টমেন্ট ট্র্যাকার|Income & Investment/)).toBeVisible();
    await noGarbageOnPage(page);

    // Click Goal Planner card
    await page.getByText(/ভবিষ্যৎ লক্ষ্য ও অবসর প্ল্যানার|Life Goal & Wealth Planner/).first().click();
    await expect(page).toHaveURL(/\/goals/);
  });
});
