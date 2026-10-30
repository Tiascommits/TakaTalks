import { beforeEach, describe, expect, it, vi } from "vitest";

const { pages, jev } = vi.hoisted(() => ({
  pages: [] as { num: number; text: string }[],
  jev: { client: null as { systemOne: ReturnType<typeof import("vitest").vi.fn> } | null },
}));
vi.mock("pdf-parse/worker", () => ({}));
vi.mock("pdf-parse", () => ({
  PDFParse: class {
    async getText() {
      return { pages, text: pages.map((p) => p.text).join("\n") };
    }
    async destroy() {}
  },
}));
vi.mock("@/lib/jev/client", () => ({ jevClient: () => jev.client }));

import { extractFiguresFromPdf } from "./extract-figures";

const carNote = async () => (await extractFiguresFromPdf(Buffer.from(""))).candidates.find((c) => c.field === "CAR")?.sourcePageOrNote;

describe("capital-adequacy gate (Jev Task 1.2, shadow mode)", () => {
  beforeEach(() => {
    pages.length = 0;
    pages.push({ num: 1, text: "Chairman's message" }, { num: 42, text: "Capital adequacy\nCRAR 15.20%" });
    jev.client = null;
  });

  it("notes the page the CAR figure came from when Jev is off", async () => {
    expect(await carNote()).toBe("p. 42");
  });

  it("adds Jev's probability for that page and keeps the figure", async () => {
    jev.client = { systemOne: vi.fn(async () => ({ answers: { is_audited_capital_adequacy_table: { type: "noul", noul: 0.123 } } })) };
    const { candidates } = await extractFiguresFromPdf(Buffer.from(""));
    const car = candidates.find((c) => c.field === "CAR");
    expect(car?.numericValue).toBe(15.2);
    expect(car?.sourcePageOrNote).toBe("p. 42; Jev audited capital-adequacy table: 0.12 (shadow)");
    expect(jev.client.systemOne.mock.calls[0][0].state).toContain("CRAR 15.20%");
  });

  it("falls back to the page alone when the Jev call fails", async () => {
    jev.client = { systemOne: vi.fn(async () => Promise.reject(new Error("timeout"))) };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await carNote()).toBe("p. 42");
  });
});
