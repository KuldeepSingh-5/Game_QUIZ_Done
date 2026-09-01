import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Flame, Crown, Calendar } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';
import { api, resolvePlayerId } from '@/services/api';
import { AdSlot } from '@/components/ads/AdSlot';
import { ErrorState } from '@/components/ErrorState';

export function LeaderboardPage({
  onExit,
}: {
  onExit: () => void;
}) {
  const [tab, setTab] = useState<'all' | 'daily'>('all');
  const [allTime, setAllTime] = useState<LeaderboardEntry[]>([]);
  const [daily, setDaily] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [a, d] = await Promise.all([api.getLeaderboard(), api.getDailyLeaderboard()]);
      setAllTime(a);
      setDaily(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { playerId } = await resolvePlayerId();
        if (active) setCurrentPlayerId(playerId);
      } catch {
        /* ignore */
      }
    })();
    return () => { active = false; };
  }, []);

  const entries = tab === 'all' ? allTime : daily;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-10">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onExit} className="btn-ghost h-10 w-10 !p-0">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Trophy size={22} className="text-warning-500" /> Leaderboard
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-xl bg-ink-100 p-1 dark:bg-ink-900">
        <button
          onClick={() => setTab('all')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${tab === 'all' ? 'bg-white text-primary-600 shadow dark:bg-ink-800' : 'text-ink-500'}`}
        >
          <Crown size={15} className="mr-1 inline" /> All-time
        </button>
        <button
          onClick={() => setTab('daily')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${tab === 'daily' ? 'bg-white text-primary-600 shadow dark:bg-ink-800' : 'text-ink-500'}`}
        >
          <Calendar size={15} className="mr-1 inline" /> Daily
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-ink-200 bg-ink-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">
          <span className="col-span-2">Rank</span>
          <span className="col-span-5">Player</span>
          <span className="col-span-2 text-right">Score</span>
          <span className="col-span-2 text-right">XP</span>
          <span className="col-span-1 text-right">Streak</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState
              title="Couldn't load the leaderboard"
              message="We couldn't fetch the rankings right now. Please try again."
              onRetry={load}
            />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-400 dark:text-ink-500">
            No scores in this leaderboard yet. Play a challenge to appear here!
          </p>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {entries.map((e) => {
              const isMe = currentPlayerId !== null && e.playerId === currentPlayerId;
              return (
                <div
                  key={`${tab}-${e.rank}-${e.username}`}
                  className={`grid grid-cols-12 items-center gap-2 px-4 py-3 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/40 ${isMe ? 'bg-primary-500/5 ring-1 ring-inset ring-primary-500/20' : ''}`}
                >
                  <span className={`col-span-2 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-warning-500/20 text-warning-600' : e.rank === 2 ? 'bg-ink-300/40 text-ink-500' : e.rank === 3 ? 'bg-accent-500/20 text-accent-600' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'}`}>
                    {e.rank}
                  </span>
                  <span className="col-span-5 truncate text-sm font-semibold">
                    {e.username}
                    {isMe && (
                      <span className="ml-1.5 rounded bg-primary-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400">
                        You
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 text-right font-display text-sm font-bold text-primary-500 tabular-nums">{e.score}</span>
                  <span className="col-span-2 text-right text-sm tabular-nums text-ink-500 dark:text-ink-400">{e.xp}</span>
                  <span className="col-span-1 flex items-center justify-end gap-0.5 text-sm">
                    <Flame size={13} className="text-accent-500" />
                    {e.streak}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5">
        <AdSlot variant="banner" />
      </div>
    </div>
  );
}
