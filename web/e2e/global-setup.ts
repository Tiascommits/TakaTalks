import { execSync } from "child_process";
import path from "path";
import { TEST_DATABASE_URL } from "./test-db";

/**
 * E2E tests run against their own Postgres database (TEST_DATABASE_URL) so a
 * test run never pollutes (or gets confused by) whatever the developer's
 * DATABASE_URL points at. Playwright's webServer is started with the same
 * URL (see playwright.config.ts), so the app under test reads/writes this
 * one. `migrate reset` drops and recreates it fresh on every run.
 */
export default function globalSetup() {
  execSync("npx prisma migrate reset --force --skip-generate --skip-seed", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
