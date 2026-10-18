/** "8.50%" or "8.50–8.90%". */
export const fmtPctRange = (low: number, high: number | null) =>
  `${low.toFixed(2)}${high !== null && high !== low ? `–${high.toFixed(2)}` : ""}%`;
