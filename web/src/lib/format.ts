export function fmtTaka(n: number): string {
  const sign = n < 0 ? "−" : "";
  const rounded = Math.round(Math.abs(n));
  return sign + "৳" + rounded.toLocaleString("en-IN");
}
