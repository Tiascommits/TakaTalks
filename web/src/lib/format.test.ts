import { describe, expect, it } from "vitest";
import { cleanNumberText, toAsciiDigits } from "./format";

describe("toAsciiDigits", () => {
  it("maps every Bangla digit to its ASCII digit", () => {
    expect(toAsciiDigits("০১২৩৪৫৬৭৮৯")).toBe("0123456789");
  });

  it("leaves ASCII digits and other characters alone", () => {
    expect(toAsciiDigits("৳1,২3.৫")).toBe("৳1,23.5");
  });
});

describe("cleanNumberText", () => {
  it("keeps Bangla digits typed on a Bangla keyboard", () => {
    expect(cleanNumberText("১২৩৪৫")).toBe("12345");
    expect(parseFloat(cleanNumberText("৪,০০,০০১"))).toBe(400001);
  });

  it("keeps decimals and a leading minus, drops grouping and the taka sign", () => {
    expect(cleanNumberText("৳33,333.33")).toBe("33333.33");
    expect(cleanNumberText(" -৯৯৯")).toBe("-999");
  });

  it("returns an empty string when nothing numeric was typed", () => {
    expect(cleanNumberText("abc")).toBe("");
  });
});
