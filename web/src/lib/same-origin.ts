import { NextResponse } from "next/server";

/**
 * For routes that set the session cookie. Refuses anything a page on another site could make a
 * browser send: a non-JSON body (an HTML form can't send application/json, and a cross-site fetch
 * with it needs a CORS preflight this app never answers), or a request the browser marks as
 * cross-site. Clients that send neither Origin nor Sec-Fetch-Site carry no victim's cookie, so
 * they pass. Returns the refusal, or null to go on.
 */
export function refuseCrossSite(request: Request): NextResponse | null {
  const type = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!type.startsWith("application/json")) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  if ((fetchSite !== null && fetchSite !== "same-origin") || (origin !== null && hostOf(origin) !== ownHost(request))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null; // "null" (sandboxed frames, some redirects) or junk
  }
}

/** The host the browser addressed. On Vercel the edge sets these headers; request.url can name an internal host behind a proxy. */
function ownHost(request: Request): string {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
}
