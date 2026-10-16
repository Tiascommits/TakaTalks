import { afterEach, describe, expect, it, vi } from "vitest";
import { BB_DEPOSIT_CHART_URL } from "@/config/rate-monitoring";
import { bbChartAdapter, fetchBbChart, parseBbChart, parseBbRate } from "./bb-chart";

// Synthetic copy of the chart's layout (two header rows, a month row, group rows, 12 cells per bank); not real figures.
const HEAD = `<table><thead>
<tr><td rowspan="2">Name of the Banks</td><td rowspan="2">Savings Deposit</td><td colspan="5">Special Notice Deposit (SND) Deposit</td><td colspan="5">Fixed Deposit</td></tr>
<tr><td>&lt; 1.00 crore</td><td>1.00 crore but &lt;25.00 crore</td><td>25.00 crore but &lt;50.00 crore</td><td>50.00 crore but &lt;100.00 crore</td><td>100.00 crore and above</td>
<td>3 months but&lt;6 months</td><td>6 months but&lt;1 year</td><td>1 year but&lt;2 years</td><td>2 years but&lt;3 years</td><td>3 years and above</td></tr></thead><tbody>`;
const row = (name: string, fdr: string[]) => `<tr><td>${name}</td>${"<td>3.00</td>".repeat(6)}${fdr.map((r) => `<td>${r}</td>`).join("")}</tr>`;
const CHART =
  HEAD +
  `<tr><td colspan="12">September, 2026</td></tr><tr><td colspan="12">SCBs</td></tr>` +
  row("SONALI", ["6.20", "6.75", "7.10", "7.32", "7.32"]) +
  `<tr><td colspan="12">PCBs</td></tr>` +
  row("AB-BANK", ["8.50-8.90", "8.50-9", " 9.00 - 9.25 ", "", ""]) +
  row("THIN", ["", "", "", "5.00", ""]) +
  row("ODD", ["n/a", "8.00", "8.00", "", ""]) +
  row("LATE", ["8.00", "8.00", "8.00", "", "see note"]) +
  `</tbody></table>`;

afterEach(() => vi.unstubAllGlobals());

describe("parseBbRate", () => {
  it("reads single figures, ranges and blanks; anything else fails loudly", () => {
    expect(parseBbRate("8.50")).toEqual({ min: 8.5, max: 8.5 });
    expect(parseBbRate("8.50-8.90")).toEqual({ min: 8.5, max: 8.9 });
    expect(parseBbRate("8.50-9")).toEqual({ min: 8.5, max: 9 });
    expect(parseBbRate("9.06 - 11.39")).toEqual({ min: 9.06, max: 11.39 });
    expect(parseBbRate("8.50\u20138.90")).toEqual({ min: 8.5, max: 8.9 });
    expect(parseBbRate("")).toBeNull();
    expect(() => parseBbRate("8.5%")).toThrow(/unreadable/);
    expect(() => parseBbRate("n/a")).toThrow(/unreadable/);
  });
});

describe("parseBbChart", () => {
  it("reads the month and each bank's five fixed-deposit cells", () => {
    const chart = parseBbChart(CHART);
    expect(chart.month.toISOString()).toBe("2026-09-01T12:00:00.000Z");
    expect([...chart.fdr.keys()]).toEqual(["SONALI", "AB-BANK", "THIN", "ODD", "LATE"]);
    expect(chart.fdr.get("AB-BANK")).toEqual(["8.50-8.90", "8.50-9", "9.00 - 9.25", "", ""]);
  });

  it("refuses a page whose tenor columns moved, or with no month", () => {
    expect(() => parseBbChart(CHART.replace("1 year but&lt;2 years", "1 year"))).toThrow(/columns moved/);
    expect(() => parseBbChart(CHART.replace("September, 2026", "SCBs"))).toThrow(/no month/);
  });
});

describe("bbChartAdapter", () => {
  const load = async () => parseBbChart(CHART);

  it("returns 3/6/12-month FDR rates dated by the chart's month, with the upper end only for a range", async () => {
    expect(await bbChartAdapter("SONALI", "SONALI", load).scrape()).toEqual([
      { instrument: "FDR", termMonths: 3, ratePct: 6.2, method: "SCRAPED", source: BB_DEPOSIT_CHART_URL, asOf: new Date("2026-09-01T12:00:00Z") },
      { instrument: "FDR", termMonths: 6, ratePct: 6.75, method: "SCRAPED", source: BB_DEPOSIT_CHART_URL, asOf: new Date("2026-09-01T12:00:00Z") },
      { instrument: "FDR", termMonths: 12, ratePct: 7.1, method: "SCRAPED", source: BB_DEPOSIT_CHART_URL, asOf: new Date("2026-09-01T12:00:00Z") },
    ]);
    const ab = await bbChartAdapter("AB", "AB-BANK", load).scrape();
    expect(ab.map((r) => [r.termMonths, r.ratePct, r.ratePctMax])).toEqual([[3, 8.5, 8.9], [6, 8.5, 9], [12, 9, 9.25]]);
  });

  it("fails only the bank whose row is missing or has none of the tracked tenors", async () => {
    await expect(bbChartAdapter("X", "NOT-THERE", load).scrape()).rejects.toThrow(/no row "NOT-THERE"/);
    await expect(bbChartAdapter("T", "THIN", load).scrape()).rejects.toThrow(/no 3-, 6- or 12-month rate/);
    // an unreadable tracked cell fails that bank only; one in an untracked tenor fails nobody
    await expect(bbChartAdapter("O", "ODD", load).scrape()).rejects.toThrow(/unreadable rate "n\/a"/);
    expect(await bbChartAdapter("L", "LATE", load).scrape()).toHaveLength(3);
  });

  it("downloads the chart once for every bank in a run, and retries after a failure", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(CHART, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const t = 1_000_000_000;
    await Promise.all([fetchBbChart(t), fetchBbChart(t + 1)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe(BB_DEPOSIT_CHART_URL);

    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));
    await expect(fetchBbChart(t + 11 * 60_000)).rejects.toThrow(/HTTP 503/);
    await expect(fetchBbChart(t + 11 * 60_000 + 1)).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
