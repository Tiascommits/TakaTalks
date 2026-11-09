import { test, expect, type Page } from "@playwright/test";
import { gotoHydrated } from "./hydrated";

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

    // YouTube videos show a play button first and load the player on a tap.
    await expect(page.getByRole("button", { name: /Play video|ভিডিও চালান/ }).first()).toBeVisible();
  });
});

test.describe("Homepage video reel (/)", () => {
  test("shows the reel with a real embed and links through to the videos page", async ({ page }) => {
    await gotoHydrated(page, "/");
    // The reel shows the video's still; a tap swaps in the real player.
    await page.getByRole("button", { name: /Play video|ভিডিও চালান/ }).first().click();
    await expect(page.locator('iframe[src*="youtube-nocookie.com/embed/"]').first()).toBeVisible();

    // The reel's "see all" link, copy is "SEE ALL VIDEOS →" / "সব ভিডিও →".
    await page.getByRole("link", { name: /see all videos|সব ভিডিও/i }).first().click();
    await expect(page).toHaveURL(/\/videos/);
  });

  test("the hero's demo button also reaches the videos page", async ({ page }) => {
    await gotoHydrated(page, "/");
    await page.getByRole("link", { name: /Watch the demo|ডেমো দেখুন/ }).click();
    await expect(page).toHaveURL(/\/videos/);
  });
});
