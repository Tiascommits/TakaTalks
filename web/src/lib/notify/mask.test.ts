import { describe, expect, it } from "vitest";
import { maskDestination } from "./mask";

describe("maskDestination", () => {
  it("keeps the first letter and the domain of an email", () => {
    expect(maskDestination("alice@example.com")).toBe("a•••@example.com");
    expect(maskDestination(" Bob.Smith@mail.example.co.uk ")).toBe("B•••@mail.example.co.uk");
  });

  it("keeps only the last three digits of a phone number", () => {
    expect(maskDestination("+8801712345678")).toBe("•••678");
  });

  it("never returns the full value", () => {
    expect(maskDestination("ab@x.io")).not.toContain("ab@");
    expect(maskDestination("12")).toBe("•••12");
  });
});
