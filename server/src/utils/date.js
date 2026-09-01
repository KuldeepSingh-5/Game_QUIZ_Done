export function getTodayDateString(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diffDaysUTC(a, b) {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function computeStreak(lastPlayedDate, currentStreak, today) {
  if (!lastPlayedDate) return 1;
  const diff = diffDaysUTC(lastPlayedDate, today);
  if (diff === 0) return currentStreak || 1;
  if (diff === 1) return (currentStreak || 0) + 1;
  return 1;
}

export function getLevelFromXp(xp) {
  const levels = [
    { level: 1, minXp: 0 },
    { level: 2, minXp: 300 },
    { level: 3, minXp: 800 },
    { level: 4, minXp: 1600 },
    { level: 5, minXp: 3000 },
  ];
  let level = 1;
  for (const l of levels) {
    if (xp >= l.minXp) level = l.level;
  }
  return level;
}
