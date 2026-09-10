import { defineConfig, devices } from "@playwright/test";
import { TEST_DATABASE_URL } from "./e2e/test-db";

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
    // Runs against its own Postgres database (see global-setup.ts and
    // e2e/test-db.ts) so a test run never touches the developer's real
    // dev/prod database.
    command: "npm run start -- -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { DATABASE_URL: TEST_DATABASE_URL },
  },
});
