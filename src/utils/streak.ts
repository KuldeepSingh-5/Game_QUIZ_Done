export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diffDaysUTC(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function computeStreak(
  lastPlayedDate: string | null,
  currentStreak: number,
  today: string
): number {
  if (!lastPlayedDate) return 1;
  const diff = diffDaysUTC(lastPlayedDate, today);
  if (diff === 0) return currentStreak || 1;
  if (diff === 1) return (currentStreak || 0) + 1;
  return 1;
}
