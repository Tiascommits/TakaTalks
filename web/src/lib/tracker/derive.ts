export function daysUntil(date: Date | string): number {
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function maturityBucket(daysLeft: number): 30 | 60 | 90 | null {
  if (daysLeft < 0) return null;
  if (daysLeft <= 30) return 30;
  if (daysLeft <= 60) return 60;
  if (daysLeft <= 90) return 90;
  return null;
}
