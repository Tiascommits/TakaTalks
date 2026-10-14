export function fmtTaka(n: number): string {
  const sign = n < 0 ? "−" : "";
  const rounded = Math.round(Math.abs(n));
  return sign + "৳" + rounded.toLocaleString("en-IN");
}

/** Bangla keyboards type ০-৯; JavaScript's \d and parseFloat only know 0-9. */
export function toAsciiDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
}

/** Strips a typed amount down to digits, one optional leading minus and the decimal point. */
export function cleanNumberText(raw: string): string {
  const digitsOnly = toAsciiDigits(raw).replace(/[^\d.]/g, "");
  return raw.trim().startsWith("-") ? `-${digitsOnly}` : digitsOnly;
}
