import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns", () => ({ promises: { lookup }, default: { promises: { lookup } } }));

import { UnsafeUrlError, assertPublicUrl, fetchPublic, isPrivateAddress, readBodyCapped } from "./safe-fetch";

beforeEach(() => {
  lookup.mockReset();
  lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]); // a public address
});
afterEach(() => vi.unstubAllGlobals());

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1", "127.0.0.2", "127.255.255.255", "0.0.0.0", "10.1.2.3", "172.16.0.1", "172.31.255.255",
    "192.168.1.1", "169.254.169.254", "100.64.0.1", "100.127.255.255", "224.0.0.1", "255.255.255.255",
    "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "2001:db8::1",
    "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:10.0.0.1", "::ffff:a9fe:a9fe", "64:ff9b::7f00:1",
    "not-an-ip", "",
  ])("blocks %s", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each([
    "8.8.8.8", "1.1.1.1", "93.184.216.34", "172.15.255.255", "172.32.0.1", "100.63.255.255", "100.128.0.1",
    "2606:4700:4700::1111", "2001:4860:4860::8888", "::ffff:8.8.8.8",
  ])("allows %s", (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe("assertPublicUrl", () => {
  it.each([
    "file:///etc/passwd",
    "ftp://example.com/x.pdf",
    "http://user:pass@example.com/x.pdf",
    "http://[::1]/x.pdf", // the bracketed form the old string check missed
    "http://[::ffff:7f00:1]/x.pdf",
    "http://[fd00::1]/x.pdf",
    "http://127.0.0.1:8080/x.pdf",
    "http://127.0.0.2/x.pdf",
    "http://0.0.0.0/x.pdf",
    "http://2130706433/x.pdf", // decimal spelling of 127.0.0.1
    "http://0x7f.1/x.pdf",
    "http://169.254.169.254/latest/meta-data/",
    "http://localhost/x.pdf",
    "http://localhost./x.pdf",
    "http://foo.localhost/x.pdf",
    "http://printer.local/x.pdf",
    "not a url",
  ])("rejects %s", async (url) => {
    await expect(assertPublicUrl(url)).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("accepts a public IP literal and a name that resolves to public addresses", async () => {
    await expect(assertPublicUrl("http://8.8.8.8/x.pdf")).resolves.toBeInstanceOf(URL);
    await expect(assertPublicUrl("https://bank.example/report.pdf")).resolves.toBeInstanceOf(URL);
  });

  it("rejects a name if ANY resolved address is non-public", async () => {
    lookup.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.5", family: 4 },
    ]);
    await expect(assertPublicUrl("https://sneaky.example/x.pdf")).rejects.toThrow(/non-public/);
  });

  it("rejects a name that resolves to loopback (nip.io-style) and one that doesn't resolve", async () => {
    lookup.mockResolvedValue([{ address: "::1", family: 6 }]);
    await expect(assertPublicUrl("https://internal.example/x.pdf")).rejects.toBeInstanceOf(UnsafeUrlError);
    lookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertPublicUrl("https://nope.example/x.pdf")).rejects.toThrow(/did not resolve/);
  });
});

describe("fetchPublic", () => {
  it("refuses a redirect from a public host to an internal address", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data/" } })
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPublic("https://bank.example/report.pdf")).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // the internal URL was never requested
  });

  it("follows redirects by hand (relative Location too) and returns the final response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: "/moved/report.pdf" } }))
      .mockResolvedValueOnce(new Response("pdf-bytes", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPublic("https://bank.example/report.pdf");
    expect(await res.text()).toBe("pdf-bytes");
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://bank.example/moved/report.pdf");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });

  it("gives up after too many redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => new Response(null, { status: 302, headers: { location: "/loop" } }))
    );
    await expect(fetchPublic("https://bank.example/a", {}, { maxRedirects: 3 })).rejects.toThrow(/Too many redirects/);
  });

  it("does not follow a 3xx that has no Location header", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 304 })));
    const res = await fetchPublic("https://bank.example/a");
    expect(res.status).toBe(304);
  });
});

describe("readBodyCapped", () => {
  const streamOf = (...chunks: string[]) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
        controller.close();
      },
    });

  it("returns the body when it is under the cap", async () => {
    const buf = await readBodyCapped(new Response(streamOf("abc", "def")), 100);
    expect(buf.toString()).toBe("abcdef");
  });

  it("rejects on a declared Content-Length over the cap", async () => {
    const res = new Response(streamOf("x"), { headers: { "content-length": "999999999" } });
    await expect(readBodyCapped(res, 1024, "PDF")).rejects.toThrow(/PDF exceeds/);
  });

  it("rejects while streaming when there is no (or a lying) Content-Length", async () => {
    const big = "x".repeat(600);
    await expect(readBodyCapped(new Response(streamOf(big, big)), 1000)).rejects.toThrow(/exceeds/);
    const lying = new Response(streamOf(big, big), { headers: { "content-length": "10" } });
    await expect(readBodyCapped(lying, 1000)).rejects.toThrow(/exceeds/);
  });
});
