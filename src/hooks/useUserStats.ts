import { useCallback, useEffect, useState } from 'react';
import type { UserStats } from '@/types';
import { api } from '@/services/api';
import { recalcUserStats } from '@/utils/levels';

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>(() => {
    // Start from cached stats so the UI renders instantly
    try {
      const raw = localStorage.getItem('dc_user_stats');
      return raw ? recalcUserStats(JSON.parse(raw)) : recalcUserStats({
        username: 'Guest', xp: 0, level: 1, streak: 0, highestScore: 0,
        lastPlayedDate: null, todayBestScore: 0, todayDate: null, totalGamesPlayed: 0,
        totalCorrectAnswers: 0,
      });
    } catch {
      return recalcUserStats({
        username: 'Guest', xp: 0, level: 1, streak: 0, highestScore: 0,
        lastPlayedDate: null, todayBestScore: 0, todayDate: null, totalGamesPlayed: 0,
        totalCorrectAnswers: 0,
      });
    }
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api.getUserStats();
      setStats(recalcUserStats(s));
    } catch {
      /* keep cached stats on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback((next: UserStats) => {
    setStats(recalcUserStats(next));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, refresh, update, loading };
}
