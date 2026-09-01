import { useEffect, useState } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle, Gift, X, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adConfig } from '@/config/ads';
import { useAdContext } from '@/context/AdContext';
import type { RewardedAdReward } from '@/types/ads';

const AD_DURATION_S = 8;

type Phase = 'idle' | 'watching' | 'verifying' | 'success' | 'error' | 'already-claimed';

/**
 * Rewarded ad: "Watch an ad to get a second chance".
 *
 * Security model:
 *  - The reward is NEVER granted by the frontend. After the simulated ad
 *    finishes, the frontend calls `claim_rewarded_ad` on the server, which
 *    validates the request, enforces one-reward-per-game, computes the
 *    reward server-side, and returns updated stats. The client cannot pass
 *    in XP or score values.
 *  - If the user closes before the ad completes, no claim is made.
 */
export function RewardedAd({
  open,
  playerId,
  gameResultId,
  onReward,
  onClose,
}: {
  open: boolean;
  playerId: string | null;
  gameResultId: string | null;
  onReward: (reward: RewardedAdReward) => void;
  onClose: () => void;
}) {
  const { adsActive, settings } = useAdContext();
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(AD_DURATION_S);
  const [errorMsg, setErrorMsg] = useState('');
  const [earnedReward, setEarnedReward] = useState<RewardedAdReward | null>(null);

  const rewardedAvailable =
    adConfig.enabled && adsActive && (settings?.rewardedEnabled ?? adConfig.rewardedEnabled);

  useEffect(() => {
    if (open) {
      setPhase('idle');
      setCountdown(AD_DURATION_S);
      setErrorMsg('');
      setEarnedReward(null);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== 'watching') return;
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          void verifyAndClaim();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startWatching = () => {
    if (!rewardedAvailable) return;
    setPhase('watching');
    setCountdown(AD_DURATION_S);
  };

  const verifyAndClaim = async () => {
    setPhase('verifying');
    if (!playerId || !gameResultId) {
      setPhase('error');
      setErrorMsg('Missing game information. Please play again.');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('claim_rewarded_ad', {
        p_player_id: playerId,
        p_game_result_id: gameResultId,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('already claimed')) {
          setPhase('already-claimed');
          return;
        }
        if (msg.includes('not available')) {
          setPhase('error');
          setErrorMsg('Rewarded ads are not available right now.');
          return;
        }
        setPhase('error');
        setErrorMsg('Could not verify the ad reward. Please try again.');
        return;
      }

      const row = (Array.isArray(data) ? data[0] : data) as {
        reward_xp: number;
        reward_score_bonus: number;
        xp: number;
        level: number;
        highest_score: number;
      };

      const reward: RewardedAdReward = {
        rewardXp: Number(row.reward_xp) || 0,
        rewardScoreBonus: Number(row.reward_score_bonus) || 0,
        xp: Number(row.xp) || 0,
        level: Number(row.level) || 1,
        highestScore: Number(row.highest_score) || 0,
      };
      setEarnedReward(reward);
      onReward(reward);
      setPhase('success');
    } catch {
      setPhase('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  if (!open) return null;

  if (!rewardedAvailable) {
    return (
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-400 dark:bg-ink-800">
            <Gift size={20} />
          </div>
          <div>
            <p className="text-sm font-bold">Second chance</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Rewarded ads are currently unavailable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 animate-fade-in">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-500/15 text-accent-500">
          <Coins size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold">Get a second chance</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Watch a short ad to earn bonus XP for this game.
          </p>
        </div>
      </div>

      {phase === 'idle' && (
        <button onClick={startWatching} className="btn-accent w-full">
          <Play size={18} /> Watch ad to earn
        </button>
      )}

      {phase === 'watching' && (
        <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
              Advertisement
            </span>
            <span className="text-xs font-semibold text-ink-500">{countdown}s</span>
          </div>
          <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/10 to-primary-500/10">
            <div className="flex flex-col items-center gap-1 text-ink-500 dark:text-ink-400">
              <Loader2 size={22} className="animate-spin text-accent-500" />
              <span className="text-xs font-medium">Ad playing…</span>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <div
              className="h-full rounded-full bg-accent-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((AD_DURATION_S - countdown) / AD_DURATION_S) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-400">
            Please keep the ad playing to earn your reward.
          </p>
        </div>
      )}

      {phase === 'verifying' && (
        <div className="flex flex-col items-center gap-2 py-6 text-ink-500 dark:text-ink-400">
          <Loader2 size={24} className="animate-spin text-primary-500" />
          <span className="text-sm font-medium">Verifying reward…</span>
        </div>
      )}

      {phase === 'success' && earnedReward && (
        <div className="flex flex-col items-center gap-2 py-4 text-center animate-pop-in">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-success-500/15 text-success-500">
            <CheckCircle size={26} />
          </div>
          <p className="font-display text-base font-bold">Reward earned!</p>
          <p className="text-sm text-success-600 dark:text-success-400">
            +{earnedReward.rewardXp} bonus XP added to your account.
          </p>
          <button onClick={onClose} className="btn-primary mt-2 w-full">
            <CheckCircle size={16} /> Collect
          </button>
        </div>
      )}

      {phase === 'already-claimed' && (
        <div className="flex flex-col items-center gap-2 py-4 text-center animate-fade-in">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
            <CheckCircle size={26} />
          </div>
          <p className="font-display text-sm font-bold">Already claimed</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            You've already earned the reward for this game.
          </p>
          <button onClick={onClose} className="btn-ghost mt-1 w-full">Close</button>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-2 py-4 text-center animate-fade-in">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-error-500/15 text-error-500">
            <AlertCircle size={26} />
          </div>
          <p className="font-display text-sm font-bold">Couldn't claim reward</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">{errorMsg}</p>
          <div className="mt-1 flex w-full gap-2">
            <button onClick={() => setPhase('idle')} className="btn-outline flex-1">
              Try again
            </button>
            <button onClick={onClose} className="btn-ghost flex-1">
              <X size={16} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
