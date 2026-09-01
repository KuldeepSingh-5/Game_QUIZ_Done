export type AdSlotVariant = 'banner' | 'interstitial' | 'rewarded';

export type AdStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'disabled';

export interface AdSettings {
  adsEnabled: boolean;
  interstitialFrequency: number;
  rewardedEnabled: boolean;
}

export interface RewardedAdReward {
  rewardXp: number;
  rewardScoreBonus: number;
  xp: number;
  level: number;
  highestScore: number;
}

export interface AdContextValue {
  /** Whether ads are on for this user (config + server + premium). */
  adsActive: boolean;
  /** Server-side ad settings (loaded from DB). */
  settings: AdSettings | null;
  settingsLoading: boolean;
  /** Whether the current player is premium (ad-free). */
  isPremium: boolean;
  /** Number of games completed since the last interstitial. */
  gamesSinceInterstitial: number;
  /** Call after a game completes; returns true if an interstitial should show. */
  shouldShowInterstitial: () => boolean;
  /** Mark that an interstitial was shown (resets the counter). */
  markInterstitialShown: () => void;
  /** Increment the games-since-interstitial counter. */
  incrementGameCount: () => void;
  /** Refresh ad settings from the server. */
  refreshSettings: () => Promise<void>;
  /** Set the premium status (from player profile). */
  setPremium: (v: boolean) => void;
}
