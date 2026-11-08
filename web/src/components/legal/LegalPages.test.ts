import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const site = vi.hoisted(() => ({ OPERATOR_NAME: null as string | null, PRIVACY_EMAIL: null as string | null }));
vi.mock("@/config/site", () => site);
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ t: (en: string) => en }) }));

import { PrivacyNotice, TermsOfUse } from "./LegalPages";
import { SiteFooter } from "../SiteFooter";

const html = (c: () => React.ReactNode) => renderToStaticMarkup(createElement(c));

beforeEach(() => {
  site.OPERATOR_NAME = null;
  site.PRIVACY_EMAIL = null;
});

describe("legal pages contact and retention", () => {
  it("names the operator and a private mailto contact on /privacy, /terms and the footer once set", () => {
    site.OPERATOR_NAME = "Example Operator";
    site.PRIVACY_EMAIL = "privacy@example.com";
    for (const page of [PrivacyNotice, TermsOfUse, SiteFooter]) {
      const out = html(page);
      expect(out).toContain("Example Operator");
      expect(out).toContain('href="mailto:privacy@example.com"');
    }
    expect(html(PrivacyNotice)).toContain("data controller");
  });

  it("keeps GitHub issues for bugs, with the warning not to post personal data", () => {
    site.PRIVACY_EMAIL = "privacy@example.com";
    const out = html(PrivacyNotice);
    expect(out).toContain("Report bugs on");
    expect(out).toContain("don&#x27;t post personal or financial details");
  });

  it("shows no operator or mailto while unset", () => {
    for (const page of [PrivacyNotice, TermsOfUse, SiteFooter]) {
      const out = html(page);
      expect(out).not.toContain("mailto:");
      expect(out).not.toContain("Run by");
    }
    expect(html(PrivacyNotice)).toContain("Ask on");
  });

  it("states the anonymous-account retention period", () => {
    expect(html(PrivacyNotice)).toContain("after 180 days without use");
  });
});
