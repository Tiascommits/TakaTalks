import { ImageResponse } from "next/og";
import { SHARE_URL, filingDayMonth } from "@/lib/share";

// The share card for /calculator (its og:image). It shows no figures and takes no input:
// any query parameter is refused, so no one can mint a card that carries an income.
// English only: Satori, which draws it, cannot shape Bangla script (see app/opengraph-image.tsx).
export function GET(request: Request) {
  if (new URL(request.url).search) return new Response("This card takes no parameters.", { status: 400 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          background: "#f6f3ec",
          borderBottom: "16px solid #07352a",
        }}
      >
        {/* Satori leaves a space-wide gap between sibling spans; the margin pulls "Talks" back. */}
        <div style={{ display: "flex", fontSize: 48, letterSpacing: -1 }}>
          <span style={{ color: "#07352a" }}>Taka</span>
          <span style={{ color: "#b98a2e", marginLeft: -11 }}>Talks</span>
        </div>
        <div style={{ fontSize: 76, color: "#07352a", marginTop: 24, lineHeight: 1.1 }}>
          {`I'm filing my tax return before ${filingDayMonth("en-GB")}`}
        </div>
        <div style={{ fontSize: 40, color: "#1b1b18", marginTop: 24 }}>Work out your tax in 2 minutes. No signup.</div>
        <div style={{ fontSize: 32, color: "#7a7566", marginTop: 36 }}>{SHARE_URL.replace(/^https:\/\/(www\.)?/, "")}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, s-maxage=86400" } },
  );
}
