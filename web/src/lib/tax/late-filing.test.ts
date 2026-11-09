import { describe, expect, it } from "vitest";
import { lateFilingExtraTax } from "./late-filing";

// NBR "FAQ- e-Return" 2026, Q46(3): 1 Jan-31 Mar 2% of net payable tax (min 3,000);
// 1 Apr-30 Jun 5% (min 5,000).
describe("lateFilingExtraTax", () => {
  it("৳5,00,000 payable: 2% = ৳10,000, then 5% = ৳25,000", () => {
    expect(lateFilingExtraTax(500000)).toEqual([
      { until: "2027-03-31", amount: 10000 },
      { until: "2027-06-30", amount: 25000 },
    ]);
  });

  it("৳50,000 payable: the floors apply (৳3,000, then ৳5,000)", () => {
    expect(lateFilingExtraTax(50000).map((w) => w.amount)).toEqual([3000, 5000]);
  });

  it("a refund counts as nothing payable, so only the floors remain", () => {
    expect(lateFilingExtraTax(-20000).map((w) => w.amount)).toEqual([3000, 5000]);
  });
});
