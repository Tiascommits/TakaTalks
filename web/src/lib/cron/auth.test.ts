import { afterEach, describe, expect, it, vi } from "vitest";
import { isAuthorizedCronRequest } from "./auth";

const req = (authorization?: string) =>
  new Request("https://example.test/api/cron/rate-scrape", authorization ? { headers: { authorization } } : {});

afterEach(() => vi.unstubAllEnvs());

describe("isAuthorizedCronRequest", () => {
  it("accepts only the exact bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(req("Bearer s3cret"))).toBe(true);
    expect(isAuthorizedCronRequest(req("Bearer s3creX"))).toBe(false);
    expect(isAuthorizedCronRequest(req("Bearer s3cret-and-more"))).toBe(false);
    expect(isAuthorizedCronRequest(req())).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isAuthorizedCronRequest(req("Bearer "))).toBe(false);
  });
});
