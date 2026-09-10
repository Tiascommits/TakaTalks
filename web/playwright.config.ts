import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Assumes `next build` has already produced .next (see package.json's
    // postbuild script, which is what normally invokes this suite) — do not
    // call `npm run build` here, that would recurse into this test run.
    // Runs against its own SQLite file (see global-setup.ts) so a test run
    // never touches the developer's real prisma/dev.db.
    command: "npm run start -- -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { DATABASE_URL: "file:./test.db" },
  },
});
