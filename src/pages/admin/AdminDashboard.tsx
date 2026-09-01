import { useEffect, useState } from 'react';
import {
  HelpCircle,
  CheckCircle,
  Users,
  UserCheck,
  Gamepad2,
  CalendarDays,
  Trophy,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { AdminStats } from '@/types';
import { api } from '@/services/api';
import { ErrorState } from '@/components/ErrorState';

export function AdminDashboard({
  onManageQuestions,
}: {
  onManageQuestions: () => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const s = await api.getAdminStats();
      setStats(s);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = stats
    ? [
        {
          icon: HelpCircle,
          label: 'Total Questions',
          value: stats.totalQuestions,
          accent: 'text-primary-500 bg-primary-500/10',
        },
        {
          icon: CheckCircle,
          label: 'Active Questions',
          value: stats.activeQuestions,
          accent: 'text-success-500 bg-success-500/10',
        },
        {
          icon: Users,
          label: 'Total Players',
          value: stats.totalPlayers,
          accent: 'text-accent-500 bg-accent-500/10',
        },
        {
          icon: UserCheck,
          label: 'Registered Users',
          value: stats.registeredPlayers,
          accent: 'text-primary-500 bg-primary-500/10',
        },
        {
          icon: Gamepad2,
          label: 'Total Games Played',
          value: stats.totalGames,
          accent: 'text-accent-500 bg-accent-500/10',
        },
        {
          icon: CalendarDays,
          label: "Today's Games",
          value: stats.gamesToday,
          accent: 'text-warning-500 bg-warning-500/10',
        },
        {
          icon: Trophy,
          label: 'Top Score',
          value: stats.topScore,
          accent: 'text-success-500 bg-success-500/10',
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
        <button onClick={load} className="btn-ghost text-sm">
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load stats"
          message="We couldn't fetch the dashboard statistics. Please try again."
          onRetry={load}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="card flex flex-col gap-3 p-4 animate-fade-in"
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.accent}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-extrabold tabular-nums">
                      {c.value.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                      {c.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick action */}
          <div className="card mt-5 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Question Management</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Add, edit, delete, or enable/disable quiz questions.
              </p>
            </div>
            <button onClick={onManageQuestions} className="btn-primary w-full sm:w-auto">
              Manage Questions <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
