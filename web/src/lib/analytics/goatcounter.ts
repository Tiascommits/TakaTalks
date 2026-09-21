/**
 * GoatCounter is a cookie-less, no-personal-data analytics service: it records a
 * pageview (path, referrer, browser, country) and nothing that identifies a person.
 * That is the only kind of analytics this project's trust posture allows — see
 * `docs/feature-spec-tax-calculator.md`, "Explicitly out of scope": aggregate,
 * anonymous counts are fine, the figures people type into the calculators are not.
 *
 * Analytics is off unless `NEXT_PUBLIC_GOATCOUNTER_CODE` is set, so local dev and
 * preview deployments don't report into the production stats by accident.
 */

/** A goatcounter.com subdomain: lowercase letters, digits and hyphens. */
const SITE_CODE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** A bare hostname, for a custom domain or a self-hosted instance. */
const HOSTNAME = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

/**
 * Turn the configured setting into the URL the counting script posts to, or `null`
 * when analytics should stay off.
 *
 * Accepts the three shapes someone is likely to paste in:
 * - `takatalks` — a goatcounter.com site code
 * - `stats.takatalks.com` — a custom domain or self-hosted host
 * - `https://stats.takatalks.com` — the same, as a URL
 *
 * A trailing `/count` or `/` is tolerated rather than doubled up.
 */
export function countEndpoint(setting: string | undefined | null): string | null {
  const raw = setting?.trim();
  if (!raw) return null;

  let host = raw.toLowerCase();

  if (host.startsWith("http://") || host.startsWith("https://")) {
    try {
      const url = new URL(host);
      host = url.host + url.pathname;
    } catch {
      return null;
    }
  }

  // Drop a trailing `/count` and any trailing slashes, so both a bare host and a
  // full endpoint URL normalise to the same thing.
  host = host.replace(/\/+$/, "").replace(/\/count$/, "").replace(/\/+$/, "");

  if (!host) return null;

  // Anything past the host (a path) is not something GoatCounter serves `/count` under.
  if (host.includes("/")) return null;

  if (host.includes(".")) {
    return HOSTNAME.test(host) ? `https://${host}/count` : null;
  }

  return SITE_CODE.test(host) ? `https://${host}.goatcounter.com/count` : null;
}
