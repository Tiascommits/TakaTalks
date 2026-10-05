import { test, expect } from "@playwright/test";
import { VIZ_LIST } from "../src/lib/viz/registry";

test.describe("Visualizers (/viz)", () => {
  test("hub lists every visualizer", async ({ page }) => {
    await page.goto("/viz");
    for (const v of VIZ_LIST) await expect(page.locator(`a[href="/viz/${v.slug}"]`)).toBeVisible();
  });

  for (const v of VIZ_LIST) {
    test(`${v.slug} draws a poster without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(`/viz/${v.slug}`);
      const canvas = page.locator("canvas");
      await expect(canvas).toBeVisible();
      // The canvas has real pixels drawn (not blank).
      const painted = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL().length > 20_000);
      expect(painted).toBe(true);
      expect(errors).toEqual([]);
    });
  }

  test("download produces a PNG and state survives in the URL", async ({ page }) => {
    await page.goto("/viz/loading_car?vehicle=bike&saved=1000000&theme=rickshaw");
    await expect(page.getByRole("button", { name: /রিকশা আর্ট|Rickshaw Art/ })).toHaveAttribute("aria-pressed", "true");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Download picture|ছবি ডাউনলোড/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("takatalks-loading-car.png");
  });
});
