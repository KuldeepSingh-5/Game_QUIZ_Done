/**
 * Centralized ad configuration driven by environment variables.
 *
 * When VITE_ADS_ENABLED is "false" (or unset), the entire ad system is a
 * no-op: no banners, no interstitials, no rewarded ads. The app works
 * normally without any ad network configured.
 */

function parseBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export interface AdUnitIds {
  banner: string;
  interstitial: string;
  rewarded: string;
}

export interface AdConfig {
  /** Master switch. When false, every ad component renders nothing. */
  enabled: boolean;
  /** Show an interstitial every N completed games. */
  interstitialFrequency: number;
  /** Rewarded ad feature switch. */
  rewardedEnabled: boolean;
  /** Ad network provider label, for future use. */
  provider: 'test' | 'google';
  /** Production ad unit IDs. Empty strings in dev — never hard-code real IDs. */
  unitIds: AdUnitIds;
}

function loadConfig(): AdConfig {
  const enabled = parseBool(import.meta.env.VITE_ADS_ENABLED, false);
  const rewardedEnabled = parseBool(
    import.meta.env.VITE_REWARDED_ADS_ENABLED,
    true
  );
  const interstitialFrequency = parseInt(
    import.meta.env.VITE_INTERSTITIAL_FREQUENCY,
    3
  );

  return {
    enabled,
    interstitialFrequency: Math.max(1, Math.min(50, interstitialFrequency)),
    rewardedEnabled: enabled && rewardedEnabled,
    provider: 'test',
    unitIds: {
      banner: import.meta.env.VITE_AD_UNIT_BANNER ?? '',
      interstitial: import.meta.env.VITE_AD_UNIT_INTERSTITIAL ?? '',
      rewarded: import.meta.env.VITE_AD_UNIT_REWARDED ?? '',
    },
  };
}

export const adConfig = loadConfig();

/** Whether ads should render, considering config and premium status. */
export function shouldShowAds(isPremium: boolean): boolean {
  return adConfig.enabled && !isPremium;
}
