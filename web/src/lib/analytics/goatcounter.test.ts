import { describe, expect, it } from "vitest";
import { countEndpoint } from "./goatcounter";

describe("countEndpoint", () => {
  it("is off when nothing is configured", () => {
    expect(countEndpoint(undefined)).toBeNull();
    expect(countEndpoint(null)).toBeNull();
    expect(countEndpoint("")).toBeNull();
    expect(countEndpoint("   ")).toBeNull();
  });

  it("expands a bare site code to its goatcounter.com endpoint", () => {
    expect(countEndpoint("takatalks")).toBe("https://takatalks.goatcounter.com/count");
    expect(countEndpoint("taka-talks-2")).toBe("https://taka-talks-2.goatcounter.com/count");
  });

  it("trims and lowercases what was pasted in", () => {
    expect(countEndpoint("  TakaTalks \n")).toBe("https://takatalks.goatcounter.com/count");
  });

  it("treats anything with a dot as a custom or self-hosted host", () => {
    expect(countEndpoint("stats.takatalks.com")).toBe("https://stats.takatalks.com/count");
    expect(countEndpoint("https://stats.takatalks.com")).toBe("https://stats.takatalks.com/count");
    expect(countEndpoint("http://stats.takatalks.com")).toBe("https://stats.takatalks.com/count");
  });

  it("does not double up a trailing /count or slash", () => {
    expect(countEndpoint("https://stats.takatalks.com/count")).toBe(
      "https://stats.takatalks.com/count",
    );
    expect(countEndpoint("https://stats.takatalks.com/")).toBe(
      "https://stats.takatalks.com/count",
    );
    expect(countEndpoint("takatalks.goatcounter.com/count/")).toBe(
      "https://takatalks.goatcounter.com/count",
    );
  });

  it("refuses anything that would not be a plain host", () => {
    // Deeper paths aren't a GoatCounter endpoint...
    expect(countEndpoint("https://example.com/some/path")).toBeNull();
    // ...and neither is a value carrying characters that don't belong in a hostname.
    expect(countEndpoint("taka talks")).toBeNull();
    expect(countEndpoint("taka_talks")).toBeNull();
    expect(countEndpoint("evil.com/count?x=1")).toBeNull();
    expect(countEndpoint('"><script>alert(1)</script>')).toBeNull();
    expect(countEndpoint("javascript:alert(1)")).toBeNull();
    expect(countEndpoint("-takatalks")).toBeNull();
  });
});
