import { useCallback, useEffect, useRef, useState } from 'react';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Play, Loader2, AlertCircle, CheckCircle, Gift, X, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adConfig } from '@/config/ads';
import { useAdContext } from '@/context/AdContext';
import type { RewardedAdReward } from '@/types/ads';

type Phase = 'idle' | 'watching' | 'verifying' | 'success' | 'error' | 'already-claimed';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [earnedReward, setEarnedReward] = useState<RewardedAdReward | null>(null);
  const claimStartedRef = useRef(false);
  const claimCompletedRef = useRef(false);
  const playerIdRef = useRef(playerId);
  const gameResultIdRef = useRef(gameResultId);
  const onRewardRef = useRef(onReward);

  useEffect(() => {
    playerIdRef.current = playerId;
    gameResultIdRef.current = gameResultId;
    onRewardRef.current = onReward;
  }, [playerId, gameResultId, onReward]);

  const rewardedAvailable =
    adConfig.enabled &&
    adsActive &&
    !!adConfig.unitIds.rewarded &&
    (settings?.rewardedEnabled ?? adConfig.rewardedEnabled);

  useEffect(() => {
    if (open) {
      console.log('[REWARDED AD] modal opened', {
        playerId,
        gameResultId,
      });
      setPhase('idle');
      setErrorMsg('');
      setEarnedReward(null);
      claimStartedRef.current = false;
      claimCompletedRef.current = false;
    }
  }, [gameResultId, open, playerId]);

  const verifyAndClaim = useCallback(async () => {
    if (claimStartedRef.current || claimCompletedRef.current) return;
    claimStartedRef.current = true;
    setPhase('verifying');

    const currentPlayerId = playerIdRef.current;
    const currentGameResultId = gameResultIdRef.current;

    console.log('[REWARDED AD] ON USER EARNED REWARD');
    console.log('[REWARDED AD] PLAYER ID:', currentPlayerId);
    console.log('[REWARDED AD] GAME RESULT ID:', currentGameResultId);

    if (!currentPlayerId && !currentGameResultId) {
      console.error('[REWARDED AD] missing state: currentPlayerId && currentGameResultId both null');
      setPhase('error');
      setErrorMsg('Player ID and Game Result ID are missing.');
      return;
    }

    if (!currentPlayerId) {
      console.error('[REWARDED AD] missing state: currentPlayerId is null');
      setPhase('error');
      setErrorMsg('Player ID is missing.');
      return;
    }

    if (
      !currentGameResultId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentGameResultId)
    ) {
      console.error('[REWARDED AD] missing state: currentGameResultId is null/invalid', {
        currentGameResultId,
      });
      setPhase('error');
      setErrorMsg('Game Result ID is missing.');
      return;
    }

    try {
      console.log('[REWARDED AD] CLAIM REWARD with payload', {
        p_player_id: currentPlayerId,
        p_game_result_id: currentGameResultId,
      });

      const { data, error } = await supabase.rpc('claim_rewarded_ad', {
        p_player_id: currentPlayerId,
        p_game_result_id: currentGameResultId,
      });

      console.log('[REWARDED AD] Reward Claim Response:', { data, error });

      if (error) {
        console.error('Reward Claim Error:', error);

        const msg = (error.message || '').toLowerCase();

        if (msg.includes('already claimed')) {
          claimCompletedRef.current = true;
          setPhase('already-claimed');
          return;
        }

        if (msg.includes('not available')) {
          setPhase('error');
          setErrorMsg('Rewarded ads are not available right now.');
          return;
        }

        setPhase('error');
        setErrorMsg(error.message || 'Could not verify the ad reward.');
        return;
      }

      if (!data) {
        console.error('Reward Claim returned no data');
        setPhase('error');
        setErrorMsg('Reward claim returned no data.');
        return;
      }

      const row = (Array.isArray(data) ? data[0] : data) as {
        reward_xp: number;
        reward_score_bonus: number;
        xp: number;
        level: number;
        highest_score: number;
      };

      console.log('Reward Data:', row);

      const reward: RewardedAdReward = {
        rewardXp: Number(row.reward_xp) || 0,
        rewardScoreBonus: Number(row.reward_score_bonus) || 0,
        xp: Number(row.xp) || 0,
        level: Number(row.level) || 1,
        highestScore: Number(row.highest_score) || 0,
      };

      console.log('[REWARDED AD] REWARD SUCCESS', {
        xpBefore: Number(row.xp) - Number(row.reward_xp || 0),
        xpAdded: Number(row.reward_xp) || 0,
        xpAfter: Number(row.xp) || 0,
        reward,
      });

      setEarnedReward(reward);
      claimCompletedRef.current = true;
      onRewardRef.current(reward);
      setPhase('success');
    } catch (error) {
      console.error('Reward Claim Exception:', error);
      setPhase('error');
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;

    const registerRewardListener = async () => {
      listener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        () => {
          if (active) void verifyAndClaim();
        }
      );
    };

    void registerRewardListener();

    return () => {
      active = false;
      void listener?.remove();
    };
  }, [open, verifyAndClaim]);

  const startWatching = async () => {
    if (!rewardedAvailable) {
      setPhase('error');
      setErrorMsg('Rewarded ads are currently unavailable.');
      return;
    }

    try {
      console.log('[REWARDED AD] WATCH AD CLICKED', {
        playerId,
        gameResultId,
      });
      setPhase('watching');
      setErrorMsg('');

      await AdMob.initialize();
      console.log('[REWARDED AD] REWARDED AD LOADED');

      await AdMob.prepareRewardVideoAd({
        adId: adConfig.unitIds.rewarded,
        isTesting: true,
      });

      console.log('[REWARDED AD] REWARDED AD SHOWN');
      const reward = await AdMob.showRewardVideoAd();
      console.log('[REWARDED AD] AD SHOW RESULT', reward);

      if (reward) await verifyAndClaim();
    } catch (error) {
      console.error('Rewarded Ad Error:', error);
      setPhase('error');
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'The ad could not be completed. Please try again.'
      );
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
          <h3 className="font-display text-base font-bold">
            Get a second chance
          </h3>

          <p className="text-xs text-ink-500 dark:text-ink-400">
            Watch a rewarded ad to earn bonus XP for this game.
          </p>
        </div>
      </div>

      {phase === 'idle' && (
        <button
          onClick={startWatching}
          className="btn-accent w-full"
        >
          <Play size={18} />
          Watch ad to earn
        </button>
      )}

      {phase === 'watching' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2
            size={32}
            className="animate-spin text-accent-500"
          />

          <p className="text-sm font-semibold">
            Loading rewarded ad...
          </p>

          <p className="text-xs text-ink-500 dark:text-ink-400">
            Please watch the ad completely to receive your reward.
          </p>
        </div>
      )}

      {phase === 'verifying' && (
        <div className="flex flex-col items-center gap-2 py-6 text-ink-500 dark:text-ink-400">
          <Loader2
            size={24}
            className="animate-spin text-primary-500"
          />

          <span className="text-sm font-medium">
            Verifying reward...
          </span>
        </div>
      )}

      {phase === 'success' && earnedReward && (
        <div className="flex flex-col items-center gap-2 py-4 text-center animate-pop-in">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-success-500/15 text-success-500">
            <CheckCircle size={26} />
          </div>

          <p className="font-display text-base font-bold">
            Reward earned!
          </p>

          <p className="text-sm text-success-600 dark:text-success-400">
            +{earnedReward.rewardXp} bonus XP added to your account.
          </p>

          <button
            onClick={onClose}
            className="btn-primary mt-2 w-full"
          >
            <CheckCircle size={16} />
            Collect
          </button>
        </div>
      )}

      {phase === 'already-claimed' && (
        <div className="flex flex-col items-center gap-2 py-4 text-center animate-fade-in">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
            <CheckCircle size={26} />
          </div>

          <p className="font-display text-sm font-bold">
            Already claimed
          </p>

          <p className="text-xs text-ink-500 dark:text-ink-400">
            You've already earned the reward for this game.
          </p>

          <button
            onClick={onClose}
            className="btn-ghost mt-1 w-full"
          >
            Close
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-2 py-4 text-center animate-fade-in">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-error-500/15 text-error-500">
            <AlertCircle size={26} />
          </div>

          <p className="font-display text-sm font-bold">
            Couldn't claim reward
          </p>

          <p className="text-xs text-ink-500 dark:text-ink-400">
            {errorMsg}
          </p>

          <div className="mt-1 flex w-full gap-2">
            <button
              onClick={() => {
                claimStartedRef.current = false;
                setPhase('idle');
              }}
              className="btn-outline flex-1"
            >
              Try again
            </button>

            <button
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              <X size={16} />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
