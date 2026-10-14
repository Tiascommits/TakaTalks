import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

// The site-wide share card for Facebook, WhatsApp and Messenger. Built once at
// build time. English only: the bundled font has no Bangla glyphs, and the
// logo already carries the ৳.
export const alt = "TakaTalks: tax and money tools for Bangladesh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logo = `data:image/png;base64,${await readFile(join(process.cwd(), "public/logo-mark.png"), "base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 88px",
          background: "#f6f3ec",
          borderBottom: "16px solid #07352a",
        }}
      >
        <img src={logo} width={300} height={300} alt="" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Satori leaves a space-wide gap between sibling spans; the margin pulls "Talks" back. */}
          <div style={{ display: "flex", fontSize: 104, letterSpacing: -2 }}>
            <span style={{ color: "#07352a" }}>Taka</span>
            <span style={{ color: "#b98a2e", marginLeft: -24 }}>Talks</span>
          </div>
          <div style={{ fontSize: 40, color: "#1b1b18", marginTop: 8 }}>Everything financial, plainly told.</div>
          <div style={{ fontSize: 30, color: "#7a7566", marginTop: 28 }}>
            Income tax calculator, rebate optimizer and savings tools for Bangladesh
          </div>
        </div>
      </div>
    ),
    size,
  );
}
