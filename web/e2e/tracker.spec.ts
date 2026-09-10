import { test, expect, type Page } from "@playwright/test";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

test.describe("Tracker — normal cases", () => {
  test("loads empty for a first-time visitor", async ({ page }) => {
    await page.goto("/tracker");
    await expect(page.getByText("এখনো কোনো আয়ের উৎস যোগ করোনি।")).toBeVisible();
    await expect(page.getByText("এখনো কোনো বিনিয়োগ যোগ করোনি।")).toBeVisible();
  });

  test("adding an income entry shows it in the list with formatted amount", async ({ page }) => {
    await page.goto("/tracker");
    await page.getByLabel("লেবেল").first().fill("মূল বেতন");
    await page.getByLabel("পরিমাণ (৳)").fill("50000");
    await page.getByRole("button", { name: "যোগ করো" }).first().click();

    await expect(page.getByText("মূল বেতন")).toBeVisible();
    await expect(page.getByText("৳50,000")).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("deleting an income entry removes it from the list", async ({ page }) => {
    await page.goto("/tracker");
    await page.getByLabel("লেবেল").first().fill("ফ্রিল্যান্স ইনকাম");
    await page.getByLabel("পরিমাণ (৳)").fill("15000");
    await page.getByRole("button", { name: "যোগ করো" }).first().click();
    await expect(page.getByText("ফ্রিল্যান্স ইনকাম")).toBeVisible();

    await page.getByRole("button", { name: "মুছুন" }).first().click();
    await expect(page.getByText("ফ্রিল্যান্স ইনকাম")).toHaveCount(0);
  });

  test("adding an investment shows it in the investment list and the maturity dashboard", async ({
    page,
  }) => {
    await page.goto("/tracker");
    const investmentForm = page.locator("section", { hasText: "বিনিয়োগ" }).last();

    await investmentForm.getByLabel("লেবেল").fill("সোনালী ব্যাংক FDR");
    await investmentForm.getByLabel("আসল (৳)").fill("100000");
    await investmentForm.getByLabel("মেয়াদ (মাস)").fill("1");
    await investmentForm.getByLabel("প্রত্যাশিত রেট (%)").fill("11.5");
    await investmentForm.getByRole("button", { name: "যোগ করো" }).click();

    // Shows up both in the investment list and (maturing within 90 days) the
    // maturity dashboard above it — expect at least one, not exactly one.
    await expect(page.getByText("সোনালী ব্যাংক FDR").first()).toBeVisible();
    await expect(page.getByText("মেয়াদপূর্তি ড্যাশবোর্ড")).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("confirming a matured investment's payout moves it to reinvestable cash", async ({
    page,
  }) => {
    await page.goto("/tracker");
    const investmentForm = page.locator("section", { hasText: "বিনিয়োগ" }).last();

    // Started years ago with a 1-month term => already matured today.
    await investmentForm.getByLabel("লেবেল").fill("পুরনো সঞ্চয়পত্র");
    await investmentForm.getByLabel("আসল (৳)").fill("100000");
    await investmentForm.getByLabel("শুরুর তারিখ").fill("2020-01-01");
    await investmentForm.getByLabel("মেয়াদ (মাস)").fill("1");
    await investmentForm.getByRole("button", { name: "যোগ করো" }).click();

    await expect(page.getByText("মেয়াদ শেষ, পেমেন্ট নিশ্চিত করো:")).toBeVisible();
    // Both the maturity panel's "matured" row and the plain investment list
    // show this label — disambiguate by the confirm-payout control, which
    // only the matured row has.
    const maturedRow = page
      .locator("li")
      .filter({ has: page.getByRole("button", { name: "পেমেন্ট নিশ্চিত করো" }) });
    await maturedRow.locator('input[type="number"]').fill("111500");
    await maturedRow.getByRole("button", { name: "পেমেন্ট নিশ্চিত করো" }).click();

    // Appears both in the reinvestable-cash summary and in the investment
    // list's "payout confirmed" badge — at least one occurrence is enough.
    await expect(page.getByText(/পুনঃবিনিয়োগযোগ্য নগদ/)).toBeVisible();
    await expect(page.getByText("৳1,11,500").first()).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("saving the tax profile persists across a reload", async ({ page }) => {
    await page.goto("/tracker");
    await page.getByLabel("প্রতিবন্ধী সন্তান সংখ্যা").fill("2");
    await page.getByLabel(/প্রথমবার করদাতা/).check();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/profile") && res.request().method() === "PUT"),
      page.getByRole("button", { name: "প্রোফাইল সেভ করো" }).click(),
    ]);

    await page.reload();
    await expect(page.getByLabel("প্রতিবন্ধী সন্তান সংখ্যা")).toHaveValue("2");
    await expect(page.getByLabel(/প্রথমবার করদাতা/)).toBeChecked();
  });
});

test.describe("Tracker — weird / adversarial input", () => {
  test("rejects a zero-amount income entry with an inline error, doesn't add it", async ({
    page,
  }) => {
    await page.goto("/tracker");
    await page.getByLabel("লেবেল").first().fill("শূন্য আয়");
    await page.getByLabel("পরিমাণ (৳)").fill("0");
    await page.getByRole("button", { name: "যোগ করো" }).first().click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByText("শূন্য আয়")).toHaveCount(0);
  });

  test("rejects a negative-amount income entry with an inline error", async ({ page }) => {
    await page.goto("/tracker");
    await page.getByLabel("লেবেল").first().fill("ঋণাত্মক আয়");
    await page.getByLabel("পরিমাণ (৳)").fill("-5000");
    await page.getByRole("button", { name: "যোগ করো" }).first().click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByText("ঋণাত্মক আয়")).toHaveCount(0);
  });

  test("rejects an income entry with no label", async ({ page }) => {
    await page.goto("/tracker");
    await page.getByLabel("পরিমাণ (৳)").fill("10000");
    await page.getByRole("button", { name: "যোগ করো" }).first().click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("rejects a negative-principal investment with an inline error", async ({ page }) => {
    await page.goto("/tracker");
    const investmentForm = page.locator("section", { hasText: "বিনিয়োগ" }).last();
    await investmentForm.getByLabel("লেবেল").fill("খারাপ বিনিয়োগ");
    await investmentForm.getByLabel("আসল (৳)").fill("-100000");
    await investmentForm.getByRole("button", { name: "যোগ করো" }).click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByText("খারাপ বিনিয়োগ")).toHaveCount(0);
  });

  test("rejects a zero-month term investment", async ({ page }) => {
    await page.goto("/tracker");
    const investmentForm = page.locator("section", { hasText: "বিনিয়োগ" }).last();
    await investmentForm.getByLabel("লেবেল").fill("শূন্য মেয়াদ");
    await investmentForm.getByLabel("আসল (৳)").fill("50000");
    await investmentForm.getByLabel("মেয়াদ (মাস)").fill("0");
    await investmentForm.getByRole("button", { name: "যোগ করো" }).click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByText("শূন্য মেয়াদ")).toHaveCount(0);
  });

  test("accepts an extremely large investment without crashing", async ({ page }) => {
    await page.goto("/tracker");
    const investmentForm = page.locator("section", { hasText: "বিনিয়োগ" }).last();
    await investmentForm.getByLabel("লেবেল").fill("বিশাল বিনিয়োগ");
    await investmentForm.getByLabel("আসল (৳)").fill("999999999999");
    await investmentForm.getByLabel("মেয়াদ (মাস)").fill("12");
    await investmentForm.getByRole("button", { name: "যোগ করো" }).click();

    await expect(page.getByText("বিশাল বিনিয়োগ")).toBeVisible();
    await noGarbageOnPage(page);
  });

  test("a brand-new visitor loading the tracker never silently creates an account", async ({
    page,
    context,
  }) => {
    await page.goto("/tracker");
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "taka_uid")).toBeUndefined();
  });
});
