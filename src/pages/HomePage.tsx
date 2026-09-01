import { useEffect, useState } from 'react';
import { Flame, Trophy, Zap, Star, Gamepad2, ArrowRight, LogIn, UserRound } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { StreakIndicator } from '@/components/StreakIndicator';
import { Badge } from '@/components/Badge';
import { AdSlot } from '@/components/ads/AdSlot';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Page } from '@/components/BottomNav';
import type { Theme, UserStats, LeaderboardEntry } from '@/types';
import { getLevelProgress } from '@/utils/levels';
import { api } from '@/services/api';

export function HomePage({
  stats,
  theme,
  onToggleTheme,
  onNavigate,
  isLoggedIn,
  onLogin,
  onRegister,
  onProfile,
}: {
  stats: UserStats;
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (p: Page) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onProfile: () => void;
}) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setBoardLoading(true);
      setBoardError(false);
      try {
        const b = await api.getLeaderboard();
        if (active) setBoard(b.slice(0, 5));
      } catch {
        if (active) setBoardError(true);
      } finally {
        if (active) setBoardLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const lp = getLevelProgress(stats.xp);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-10">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button
              onClick={onProfile}
              className="flex items-center gap-1.5 rounded-xl bg-primary-500/10 px-3 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-500/20 dark:text-primary-400"
            >
              <UserRound size={16} /> Profile
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 rounded-xl bg-primary-500/10 px-3 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-500/20 dark:text-primary-400"
            >
              <LogIn size={16} /> Log in
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      {/* Hero */}
      <section className="card relative overflow-hidden p-6 sm:p-8 animate-fade-in">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative">
          <span className="chip bg-accent-500/15 text-accent-600 dark:text-accent-300">
            <Flame size={13} /> 60 Second Daily Challenge
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Test your mind.<br />Beat the clock.
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
            Answer as many questions as you can in 60 seconds. Build your streak, earn XP, and climb the leaderboard.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => onNavigate('game')}
              className="btn-primary w-full animate-pulse-ring sm:w-auto"
            >
              <Gamepad2 size={18} /> Start Challenge
              <ArrowRight size={16} />
            </button>
            {!isLoggedIn && (
              <button
                onClick={onRegister}
                className="btn-outline w-full sm:w-auto"
              >
                Create account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Flame size={20} />} label="Current Streak" value={`${stats.streak}d`} accent="accent" />
        <StatCard icon={<Zap size={20} />} label="Level" value={`Lv ${stats.level}`} accent="primary" />
        <StatCard icon={<Star size={20} />} label="Today's Best" value={stats.todayBestScore} accent="warning" />
        <StatCard icon={<Trophy size={20} />} label="Highest Score" value={stats.highestScore} accent="success" />
      </section>

      {/* XP progress */}
      <section className="card mt-4 p-5 animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Level {lp.level}</p>
            <p className="font-display text-lg font-bold">{lp.levelName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Total XP</p>
            <p className="font-display text-lg font-bold text-primary-500">{stats.xp}</p>
          </div>
        </div>
        <ProgressBar
          value={lp.next ? stats.xp : 1}
          max={lp.next ?? 1}
          label={lp.next ? `Next level` : 'Max level reached'}
          color="primary"
        />
      </section>

      {/* Streak + Badges */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-ink-500 dark:text-ink-400">Streak Status</h3>
          <StreakIndicator streak={stats.streak} />
          <div className="mt-3 flex gap-2 text-xs text-ink-400 dark:text-ink-500">
            <span className={stats.streak >= 1 ? 'text-warning-500 font-bold' : ''}>1d</span>
            <span>→</span>
            <span className={stats.streak >= 7 ? 'text-accent-500 font-bold' : ''}>7d</span>
            <span>→</span>
            <span className={stats.streak >= 30 ? 'text-accent-600 font-bold' : ''}>30d</span>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-ink-500 dark:text-ink-400">Achievements</h3>
          <Badge streak={stats.streak} level={stats.level} />
        </div>
      </section>

      {/* Leaderboard preview */}
      <section className="card mt-4 p-5 animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy size={18} className="text-warning-500" /> Leaderboard
          </h3>
          <button onClick={() => onNavigate('leaderboard')} className="text-xs font-semibold text-primary-500 hover:underline">
            View all →
          </button>
        </div>
        {boardLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
          </div>
        ) : boardError ? (
          <p className="py-6 text-center text-sm text-ink-400 dark:text-ink-500">
            Couldn't load the leaderboard. It'll appear once you're back online.
          </p>
        ) : board.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400 dark:text-ink-500">
            No scores yet. Be the first to play!
          </p>
        ) : (
          <div className="space-y-1.5">
            {board.map((e) => (
              <div key={e.rank} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-warning-500/20 text-warning-600' : e.rank === 2 ? 'bg-ink-300/30 text-ink-500' : e.rank === 3 ? 'bg-accent-500/20 text-accent-600' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'}`}>
                  {e.rank}
                </span>
                <span className="flex-1 truncate text-sm font-semibold">{e.username}</span>
                <span className="text-sm font-bold text-primary-500">{e.score}</span>
                <span className="hidden text-xs text-ink-400 sm:inline">XP {e.xp}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Banner ad */}
      <div className="mt-4">
        <AdSlot variant="banner" />
      </div>
    </div>
  );
}
