/**
 * E2E tests need their own Postgres database, separate from the developer's
 * DATABASE_URL, so a test run can freely reset/drop data without touching
 * real dev data. Point this at a throwaway database (a free Neon branch
 * works well) via the environment, never reuse a dev or prod URL here.
 */
const url = process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error(
    "TEST_DATABASE_URL is not set. E2E tests need a dedicated Postgres " +
      "database URL (see web/README.md) — do not point it at your dev or " +
      "prod database, `prisma migrate reset` will wipe it on every run."
  );
}

export const TEST_DATABASE_URL = url;
