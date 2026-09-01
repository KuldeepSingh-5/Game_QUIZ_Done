import { useEffect, useState } from 'react';
import { ArrowLeft, Zap, Flame, Trophy, Target, CheckCircle, Gamepad2, LogOut, Loader2, Mail, Award, Shield } from 'lucide-react';
import type { Theme, UserStats } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api, checkIsAdmin } from '@/services/api';
import { getLevelProgress } from '@/utils/levels';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/Badge';
import { StreakIndicator } from '@/components/StreakIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';

export function ProfilePage({
  theme,
  onToggleTheme,
  onExit,
  onAdmin,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  onExit: () => void;
  onAdmin: () => void;
}) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api.getUserStats();
        if (active) setStats(s);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    (async () => {
      const ok = await checkIsAdmin();
      if (active) setIsAdmin(ok);
    })();
    return () => { active = false; };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onExit();
  };

  const lp = stats ? getLevelProgress(stats.xp) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 md:pb-10">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="btn-ghost h-10 w-10 !p-0">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-2xl font-extrabold">Profile</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      ) : stats ? (
        <>
          <div className="card relative overflow-hidden p-6 animate-pop-in sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow">
                <span className="font-display text-xl font-extrabold">
                  {stats.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-extrabold truncate">{stats.username}</h2>
                {user?.email && (
                  <p className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400 truncate">
                    <Mail size={13} className="shrink-0" /> {user.email}
                  </p>
                )}
                <span className="chip mt-1.5 bg-accent-500/15 text-accent-600 dark:text-accent-300">
                  <Award size={13} /> {lp?.levelName ?? 'Beginner'}
                </span>
              </div>
            </div>
          </div>

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={<Zap size={20} />} label="Total XP" value={stats.xp} accent="primary" />
            <StatCard icon={<Target size={20} />} label="Level" value={`Lv ${stats.level}`} accent="success" />
            <StatCard icon={<Flame size={20} />} label="Current Streak" value={`${stats.streak}d`} accent="warning" />
            <StatCard icon={<Trophy size={20} />} label="Highest Score" value={stats.highestScore} accent="accent" />
            <StatCard icon={<Gamepad2 size={20} />} label="Games Played" value={stats.totalGamesPlayed} accent="primary" />
            <StatCard icon={<CheckCircle size={20} />} label="Correct Answers" value={stats.totalCorrectAnswers} accent="success" />
          </section>

          <section className="card mt-4 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Level {lp?.level}</p>
                <p className="font-display text-lg font-bold">{lp?.levelName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Next level</p>
                <p className="font-display text-lg font-bold text-primary-500">{lp?.next ?? 'MAX'}</p>
              </div>
            </div>
            <ProgressBar
              value={lp?.next ? stats.xp : 1}
              max={lp?.next ?? 1}
              label={lp?.next ? `${stats.xp} / ${lp.next} XP` : 'Max level reached'}
              color="primary"
            />
          </section>

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

          <section className="mt-5 space-y-3">
            {isAdmin && (
              <button onClick={onAdmin} className="btn-primary w-full">
                <Shield size={18} /> Admin Panel
              </button>
            )}
            <button onClick={handleSignOut} className="btn-outline w-full text-error-600 dark:text-error-400">
              <LogOut size={18} /> Sign out
            </button>
          </section>
        </>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-500 dark:text-ink-400">Could not load your profile. Please try again.</p>
        </div>
      )}
    </div>
  );
}
