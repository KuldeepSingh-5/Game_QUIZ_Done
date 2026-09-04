import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RotateCcw, Home, Trophy, Zap, Flame, Star, Target, CheckCircle, ListChecks, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import type { GameOutcome } from '@/pages/GamePage';
import type { UserStats } from '@/types';
import { getMotivationalMessage } from '@/utils/motivation';
import { getLevelProgress } from '@/utils/levels';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { AdSlot } from '@/components/ads/AdSlot';
import { RewardedAd } from '@/components/ads/RewardedAd';
import { useAdContext } from '@/context/AdContext';
import { resolvePlayerId } from '@/services/api';

export function ResultPage({
  outcome,
  stats,
  saving = false,
  saveError = false,
  wasGuest = false,
  onPlayAgain,
  onHome,
  onLeaderboard,
  onCreateAccount,
  onExit,
  onRewardEarned,
}: {
  outcome: GameOutcome;
  stats: UserStats;
  saving?: boolean;
  saveError?: boolean;
  wasGuest?: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onCreateAccount: () => void;
  onExit: () => void;
  onRewardEarned: () => void;
}) {
  const { adsActive } = useAdContext();
  const [rewardedOpen, setRewardedOpen] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { playerId: id } = await resolvePlayerId();

        if (active) {
          setPlayerId(id);
        }
      } catch (error) {
        console.error('Player ID Error:', error);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    console.log('[RESULT PAGE] state snapshot', {
      hasOutcome: Boolean(outcome),
      gameResultId: outcome?.gameResultId ?? null,
      playerId,
      rewardedOpen,
      adsActive,
    });
  }, [adsActive, outcome, playerId, rewardedOpen]);

  const message = useMemo(
    () => getMotivationalMessage(outcome.score, stats.highestScore),
    [outcome.score, stats.highestScore]
  );

  const lp = getLevelProgress(stats.xp);

  const isBest =
    outcome.score >= stats.highestScore &&
    outcome.score > 0;

  const handleReward = () => {
    onRewardEarned();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 md:pb-10">
      <button
        onClick={onExit}
        className="btn-ghost mb-4 h-10 w-10 !p-0"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="card relative overflow-hidden p-6 text-center animate-pop-in sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />

        {isBest && (
          <span className="chip mx-auto mb-3 bg-warning-500/15 text-warning-600 dark:text-warning-300">
            <Star size={13} />
            New personal best!
          </span>
        )}

        <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow">
          <span className="font-display text-3xl font-extrabold tabular-nums">
            {outcome.score}
          </span>
        </div>

        <h1 className="font-display text-2xl font-extrabold">
          Challenge complete
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
          {message}
        </p>

        {saving && (
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-500">
            <Loader2 size={13} className="animate-spin" />
            Saving your score…
          </p>
        )}

        {saveError && !saving && (
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-error-500">
            <AlertCircle size={13} />
            Couldn't save to the server. Your local stats are still updated.
          </p>
        )}
      </div>

      {wasGuest && !saving && (
        <div className="card mt-4 flex flex-col items-center gap-3 p-5 text-center animate-fade-in">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-500/15 text-primary-500">
            <UserPlus size={22} />
          </div>

          <p className="max-w-sm text-sm font-medium text-ink-600 dark:text-ink-300">
            Create an account to save your progress and appear on the leaderboard.
          </p>

          <button
            onClick={onCreateAccount}
            className="btn-primary w-full sm:w-auto"
          >
            <UserPlus size={18} />
            Create account
          </button>
        </div>
      )}

      {adsActive && playerId && outcome.gameResultId && (
        <div className="mt-4">
          <RewardedAd
            open={rewardedOpen}
            playerId={playerId}
            gameResultId={outcome.gameResultId}
            onReward={handleReward}
            onClose={() => setRewardedOpen(false)}
          />
        </div>
      )}

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Correct"
          value={outcome.correctAnswers}
          accent="success"
        />

        <StatCard
          icon={<ListChecks size={20} />}
          label="Attempted"
          value={outcome.attemptedQuestions}
          accent="primary"
        />

        <StatCard
          icon={<Zap size={20} />}
          label="XP Earned"
          value={`+${outcome.xpEarned}`}
          accent="accent"
        />

        <StatCard
          icon={<Flame size={20} />}
          label="Streak"
          value={`${stats.streak}d`}
          accent="warning"
        />

        <StatCard
          icon={<Star size={20} />}
          label="Highest"
          value={stats.highestScore}
          accent="primary"
        />

        <StatCard
          icon={<Target size={20} />}
          label="Level"
          value={`Lv ${stats.level}`}
          accent="success"
        />
      </section>

      <section className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
              Level {lp.level} · {lp.levelName}
            </p>

            <p className="font-display text-lg font-bold">
              Total XP: {stats.xp}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
              Next
            </p>

            <p className="font-display text-lg font-bold text-primary-500">
              {lp.next ?? 'MAX'}
            </p>
          </div>
        </div>

        <ProgressBar
          value={lp.next ? stats.xp : 1}
          max={lp.next ?? 1}
          color="primary"
        />
      </section>

      <div className="mt-5">
        <AdSlot variant="banner" />
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          onClick={onPlayAgain}
          className="btn-primary"
        >
          <RotateCcw size={18} />
          Play Again
        </button>

        <button
          onClick={onHome}
          className="btn-ghost"
        >
          <Home size={18} />
          Daily Challenge
        </button>

        <button
          onClick={onLeaderboard}
          className="btn-outline"
        >
          <Trophy size={18} />
          Leaderboard
        </button>
      </section>
    </div>
  );
}
