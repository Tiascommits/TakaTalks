import { test, expect, type Page } from "@playwright/test";

async function noGarbageOnPage(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN/);
  expect(text).not.toMatch(/Infinity/);
  expect(text).not.toMatch(/undefined/);
}

test.describe("Videos (/videos)", () => {
  test("loads cleanly, shows a shortform video, and shows the longform empty state", async ({ page }) => {
    await page.goto("/videos");
    await expect(page.getByText(/ভিডিও — টাকাটকস|Videos — TakaTalks/)).toBeVisible();
    await noGarbageOnPage(page);

    await expect(page.getByRole("heading", { name: /Shortform|শর্টফর্ম/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Longform|লংফর্ম/ })).toBeVisible();

    // The seeded Facebook short renders as an iframe.
    await expect(page.locator("iframe[src*='facebook.com/plugins/video.php']")).toBeVisible();

    // Longform has no real entries yet, so it should show the empty state, not a broken embed.
    await expect(page.getByText(/More long-form videos coming soon|আরও লংফর্ম ভিডিও শীঘ্রই আসছে/)).toBeVisible();
  });
});

test.describe("Homepage videos banner (/)", () => {
  test("links to the videos page", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/Watch the video, then run your own numbers|ভিডিও দেখুন, তারপর নিজের হিসাব করুন/).click();
    await expect(page).toHaveURL(/\/videos/);
  });
});
