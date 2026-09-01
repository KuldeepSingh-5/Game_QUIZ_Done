import type { UserStats } from '@/types';

export const LEVELS = [
  { level: 1, name: 'Beginner', minXp: 0 },
  { level: 2, name: 'Learner', minXp: 300 },
  { level: 3, name: 'Focused', minXp: 800 },
  { level: 4, name: 'Challenger', minXp: 1600 },
  { level: 5, name: 'Champion', minXp: 3000 },
] as const;

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (const l of LEVELS) {
    if (xp >= l.minXp) level = l.level;
  }
  return level;
}

export function getLevelName(level: number): string {
  return LEVELS.find((l) => l.level === level)?.name ?? 'Beginner';
}

export function getLevelProgress(xp: number): {
  current: number;
  next: number | null;
  progress: number;
  level: number;
  levelName: string;
} {
  const level = getLevelFromXp(xp);
  const currentLevelData = LEVELS[level - 1];
  const nextLevelData = LEVELS[level] ?? null;

  if (!nextLevelData) {
    return {
      current: xp,
      next: null,
      progress: 100,
      level,
      levelName: currentLevelData.name,
    };
  }

  const rangeStart = currentLevelData.minXp;
  const rangeEnd = nextLevelData.minXp;
  const progress = Math.min(
    100,
    Math.round(((xp - rangeStart) / (rangeEnd - rangeStart)) * 100)
  );

  return {
    current: xp,
    next: rangeEnd,
    progress,
    level,
    levelName: currentLevelData.name,
  };
}

export function recalcUserStats(stats: UserStats): UserStats {
  const level = getLevelFromXp(stats.xp);
  return { ...stats, level };
}
