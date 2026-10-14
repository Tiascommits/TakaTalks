import { describe, expect, it } from "vitest";
import { toolsInCategory } from "./tools";

describe("toolsInCategory", () => {
  it("leaves /rates out until some bank has rate data", () => {
    expect(toolsInCategory("save", false).map((t) => t.href)).not.toContain("/rates");
    expect(toolsInCategory("save", true).map((t) => t.href)).toContain("/rates");
  });

  it("keeps every other tool either way", () => {
    expect(toolsInCategory("save", false).map((t) => t.href)).toContain("/instruments");
    expect(toolsInCategory("tax", false)).toEqual(toolsInCategory("tax", true));
  });
});
