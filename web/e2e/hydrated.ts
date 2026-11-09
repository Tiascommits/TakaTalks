import type { Page } from "@playwright/test";

/**
 * page.goto, then wait until React has hydrated every input, select and button.
 * A value typed before hydration is wiped when React takes over the field, and a
 * click before it does nothing, so a test that acts straight after goto flakes.
 * shortcut: reads React's `__reactProps$…` DOM key (React internals); if a React
 * upgrade renames it this times out loudly, then switch to an app-side ready flag.
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => {
    const els = [...document.querySelectorAll("input, select, button")];
    return els.length > 0 && els.every((el) => Object.keys(el).some((k) => k.startsWith("__reactProps$")));
  });
}
