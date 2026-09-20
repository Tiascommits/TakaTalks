/** `alice@example.com` → `a•••@example.com`; `+8801712345678` → `•••678`. Enough to recognise, not enough to harvest. */
export function maskDestination(destination: string): string {
  const d = destination.trim();
  const at = d.lastIndexOf("@");
  if (at > 0) return `${d[0]}•••${d.slice(at)}`;
  return `•••${d.slice(-3)}`;
}
