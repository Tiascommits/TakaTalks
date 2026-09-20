import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * Outbound fetches to URLs we did not write (e.g. PDF links scraped off a
 * bank's website) must not be steerable at our own network: loopback, private
 * ranges, link-local/cloud-metadata addresses and so on.
 *
 * `fetchPublic` validates the URL, resolves the hostname and requires EVERY
 * resolved address to be public, follows redirects by hand and re-validates
 * each hop, and `readBodyCapped` enforces a size limit while streaming.
 *
 * Known limit: the hostname is resolved here and again by `fetch`, so a DNS
 * server that answers differently the second time (rebinding) is not
 * prevented. Closing that needs a pinned-IP dispatcher, which isn't worth a
 * new dependency for an admin-configured, cron-only fetch.
 */
export class UnsafeUrlError extends Error {}

const IPV4_BLOCKED: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => acc * 256 + Number(octet), 0);
}

function isBlockedIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return IPV4_BLOCKED.some(([base, prefix]) => {
    const size = 2 ** (32 - prefix);
    const start = ipv4ToInt(base);
    return n >= start && n < start + size;
  });
}

/** Expands any valid IPv6 text form into its 8 16-bit groups. */
function ipv6ToGroups(ip: string): number[] | null {
  let s = ip.split("%")[0]; // drop zone id
  const embedded = s.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (embedded) {
    const o = embedded[2].split(".").map(Number);
    if (o.some((x) => x > 255)) return null;
    s = `${embedded[1]}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  let groups: string[];
  if (halves.length === 1) {
    groups = head;
  } else {
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return null;
    groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  }
  if (groups.length !== 8) return null;
  const nums = groups.map((g) => parseInt(g, 16));
  return nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff) ? nums : null;
}

function isBlockedIPv6(ip: string): boolean {
  const g = ipv6ToGroups(ip);
  if (!g) return true; // unparseable: refuse
  const [g0, g1, g2, g3, g4, g5, g6, g7] = g;

  // IPv4-mapped (::ffff:a.b.c.d): judge by the embedded IPv4 address.
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xffff) {
    return isBlockedIPv4(`${g6 >> 8}.${g6 & 255}.${g7 >> 8}.${g7 & 255}`);
  }
  // ::/96 covers "::" (unspecified), "::1" (loopback) and deprecated IPv4-compatible forms.
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0) return true;
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g0 === 0x2001 && g1 === 0x0db8) return true; // 2001:db8::/32 documentation
  if (g0 === 0x0064 && g1 === 0xff9b) return true; // 64:ff9b::/96 NAT64 (embeds IPv4)
  return false;
}

/** True for anything that isn't a plain public IP, including strings that aren't IPs at all. */
export function isPrivateAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedIPv4(ip);
  if (family === 6) return isBlockedIPv6(ip);
  return true;
}

/**
 * Throws UnsafeUrlError unless `rawUrl` is an http(s) URL without embedded
 * credentials whose host is a public IP, or a name resolving only to public IPs.
 * (WHATWG URL already normalises decimal/hex/octal IPv4 spellings to dotted form.)
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http(s) URLs are allowed");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!host) throw new UnsafeUrlError("URL has no host");

  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new UnsafeUrlError("URL points at a non-public address");
    return url;
  }

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new UnsafeUrlError("URL points at a non-public host");
  }
  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("Host did not resolve");
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new UnsafeUrlError("URL resolves to a non-public address");
  }
  return url;
}

/**
 * fetch() for untrusted URLs: validates the target, follows up to
 * `maxRedirects` redirects manually (each hop is validated again), and applies
 * one overall timeout.
 */
export async function fetchPublic(
  rawUrl: string,
  init: RequestInit = {},
  opts: { maxRedirects?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const maxRedirects = opts.maxRedirects ?? 5;
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 15_000);
  let current = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const checked = await assertPublicUrl(current);
    const res = await fetch(checked, { ...init, redirect: "manual", signal });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {});
      current = new URL(location, checked).toString();
      continue;
    }
    return res;
  }
  throw new UnsafeUrlError("Too many redirects");
}

/** Reads a response body, aborting as soon as it exceeds `maxBytes` (not just by Content-Length). */
export async function readBodyCapped(res: Response, maxBytes: number, label = "Response"): Promise<Buffer> {
  const tooBig = () => new Error(`${label} exceeds ${Math.round(maxBytes / (1024 * 1024))}MB safety limit`);
  const declared = res.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw tooBig();
  }
  if (!res.body) return Buffer.alloc(0);

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw tooBig();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
