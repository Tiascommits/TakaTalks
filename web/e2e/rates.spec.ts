import { test, expect, type Page } from "@playwright/test";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

// The first group needs the freshly reset database with no rates; the second
// one fills it with an admin scrape. Run in file order, never side by side.
test.describe.configure({ mode: "serial" });

test.describe("Bank rate scorecard — before any rates exist", () => {
  test("says rates are not collected yet instead of drawing an empty table", async ({ page }) => {
    await page.goto("/rates");
    await expect(page.getByText(/not being collected yet|এখনো সংগ্রহ করা হচ্ছে না/)).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await noGarbageOnPage(page);
  });

  test("is not advertised in the nav or on the homepage", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /সঞ্চয়|^Save$/ }).click();
    await expect(page.getByText(/ব্যাংক রেট ও স্বাস্থ্য স্কোরকার্ড|Bank Rates & Health/)).toHaveCount(0);

    const nav = page.getByRole("navigation");
    await nav.getByRole("button", { name: /টুলস|^Tools$/ }).click();
    await expect(nav.getByRole("link", { name: /সঞ্চয় স্কিম|Real Yields/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /ব্যাংক রেট|Bank Rates/ })).toHaveCount(0);
  });
});

test.describe("Bank rate scorecard — with seeded rates", () => {
  test.skip(
    !process.env.ADMIN_SECRET,
    "ADMIN_SECRET must be set in the environment running the test process (not just the app's .env) to exercise the admin-seeded path."
  );

  test("shows the table, trust panels and an unconfigured bank as not available, after an admin scrape run", async ({
    page,
  }) => {
    const setup = await page.request.post("/api/admin/setup", {
      data: {
        secret: process.env.ADMIN_SECRET,
        email: "e2e-admin@takatalks.com",
        password: "password12345",
      },
    });
    if (!setup.ok() && setup.status() === 409) {
      const login = await page.request.post("/api/admin/session", {
        data: {
          email: "e2e-admin@takatalks.com",
          password: "password12345",
        },
      });
      expect(login.ok()).toBeTruthy();
    } else {
      expect(setup.ok()).toBeTruthy();
    }

    const scrape = await page.request.post("/api/admin/rates/run-scrape");
    expect(scrape.ok()).toBeTruthy();

    await page.goto("/rates");
    await expect(page.getByText(/Deposit protection|আমানত সুরক্ষা/)).toBeVisible();
    await expect(page.getByText(/self-reported by banks|ব্যাংক নিজে প্রকাশ করে/)).toBeVisible();
    await expect(page.getByText("AB Bank PLC")).toBeVisible();
    await expect(page.getByText("Sonali Bank PLC")).toBeVisible();
    // Manual seed figures carry their source's date, never today's.
    await expect(page.getByText(/Source dated 31 Dec 2025|সূত্রের তারিখ 31 Dec 2025/).first()).toBeVisible();
    await noGarbageOnPage(page);

    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/best bank|top pick|সেরা ব্যাংক/i);

    const sortByRate = page.getByRole("button", { name: /Gross rate|মোট হার/ });
    await sortByRate.click();
    await expect(page.getByRole("columnheader", { name: /Gross rate|মোট হার/ })).toHaveAttribute("aria-sort", "ascending");
    await sortByRate.click();
    await expect(page.getByRole("columnheader", { name: /Gross rate|মোট হার/ })).toHaveAttribute("aria-sort", "descending");
    await page.getByLabel(/Deposit amount|জমা রাখার পরিমাণ/).fill("200000");
    await noGarbageOnPage(page);
  });
});
