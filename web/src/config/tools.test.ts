import { describe, expect, it } from "vitest";
import { TOOL_CATEGORIES, toolsInCategory } from "./tools";

const hrefs = (id: Parameters<typeof toolsInCategory>[0], ratesLive = true) =>
  toolsInCategory(id, ratesLive).map((t) => t.href);

describe("toolsInCategory", () => {
  it("leaves /rates out until some bank has rate data", () => {
    expect(hrefs("save", false)).not.toContain("/rates");
    expect(hrefs("save", true)).toContain("/rates");
  });

  it("keeps every other tool either way", () => {
    expect(hrefs("save", false)).toContain("/instruments");
    expect(toolsInCategory("tax", false)).toEqual(toolsInCategory("tax", true));
  });

  it("keeps the frozen side tools in the last group, More", () => {
    expect(TOOL_CATEGORIES.at(-1)?.id).toBe("more");
    expect(hrefs("more").sort()).toEqual(
      ["/cars", "/freedom", "/goals", "/habits", "/loans", "/viz"].sort()
    );
  });

  it("keeps the core tools primary", () => {
    const primary = TOOL_CATEGORIES.filter((c) => c.id !== "more").flatMap((c) => hrefs(c.id));
    for (const href of ["/calculator", "/tracker", "/salary", "/instruments", "/zakat", "/freelance", "/rates"]) {
      expect(primary).toContain(href);
    }
  });
});
