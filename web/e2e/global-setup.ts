import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";

/**
 * E2E tests get their own SQLite file so a test run never pollutes (or gets
 * confused by) whatever the developer already has in prisma/dev.db. Playwright's
 * webServer is started with DATABASE_URL pointing at the same file (see
 * playwright.config.ts), so the app under test reads/writes this one.
 */
export default function globalSetup() {
  const testDbPath = path.resolve(__dirname, "../prisma/test.db");
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const p = testDbPath + suffix;
    if (existsSync(p)) rmSync(p);
  }

  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}
