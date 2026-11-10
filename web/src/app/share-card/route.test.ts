import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { SHARE_URL, shareText } from "@/lib/share";

const req = (qs = "") => new Request(`https://www.takatalks.com/share-card${qs}`);

describe("share card", () => {
  it.each(["?basic=50000", "?income=1200000", "?salary=৫০০০০", "?x=1"])("refuses %s", async (qs) => {
    const res = GET(req(qs));
    expect(res.status).toBe(400);
  });

  it("draws a PNG without parameters", async () => {
    const res = GET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });

  it("shares a fixed link and message with no figures but the filing date", () => {
    expect(SHARE_URL).toBe("https://www.takatalks.com/calculator?src=share");
    expect(shareText("en")).toBe("I'm filing my tax return before 31 December · Work out your tax in 2 minutes");
    expect(shareText("bn")).toBe("আমি ৩১ ডিসেম্বরের আগে রিটার্ন দিচ্ছি · তোমার কর হিসাব করো ২ মিনিটে");
  });
});
