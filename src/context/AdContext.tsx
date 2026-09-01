import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { adConfig, shouldShowAds as configShouldShowAds } from '@/config/ads';
import type { AdContextValue, AdSettings } from '@/types/ads';

const STORAGE_KEY = 'dc_games_since_interstitial';

export const AdContext = createContext<AdContextValue | null>(null);

export function useAdContext(): AdContextValue {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error('useAdContext must be used within AdProvider');
  return ctx;
}

export function AdProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [gamesSinceInterstitial, setGamesSinceInterstitial] = useState(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) ?? '0');
    } catch {
      return 0;
    }
  });

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_ad_settings');
      if (error || !data) {
        setSettings({
          adsEnabled: adConfig.enabled,
          interstitialFrequency: adConfig.interstitialFrequency,
          rewardedEnabled: adConfig.rewardedEnabled,
        });
        return;
      }
      const row = (Array.isArray(data) ? data[0] : data) as {
        ads_enabled: boolean;
        interstitial_frequency: number;
        rewarded_enabled: boolean;
      };
      setSettings({
        adsEnabled: Boolean(row.ads_enabled),
        interstitialFrequency: Number(row.interstitial_frequency) || 3,
        rewardedEnabled: Boolean(row.rewarded_enabled),
      });
    } catch {
      setSettings({
        adsEnabled: adConfig.enabled,
        interstitialFrequency: adConfig.interstitialFrequency,
        rewardedEnabled: adConfig.rewardedEnabled,
      });
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const adsActive = useMemo(() => {
    const envEnabled = adConfig.enabled;
    const serverEnabled = settings?.adsEnabled ?? adConfig.enabled;
    return configShouldShowAds(isPremium) && envEnabled && serverEnabled;
  }, [isPremium, settings]);

  const persistCounter = useCallback((n: number) => {
    setGamesSinceInterstitial(n);
    try {
      localStorage.setItem(STORAGE_KEY, String(n));
    } catch {
      /* ignore */
    }
  }, []);

  const shouldShowInterstitial = useCallback((): boolean => {
    if (!adsActive) return false;
    const freq = settings?.interstitialFrequency ?? adConfig.interstitialFrequency;
    return gamesSinceInterstitial >= freq;
  }, [adsActive, settings, gamesSinceInterstitial]);

  const markInterstitialShown = useCallback(() => {
    persistCounter(0);
  }, [persistCounter]);

  const incrementGameCount = useCallback(() => {
    persistCounter(gamesSinceInterstitial + 1);
  }, [gamesSinceInterstitial, persistCounter]);

  const setPremium = useCallback((v: boolean) => {
    setIsPremium(v);
  }, []);

  const value: AdContextValue = {
    adsActive,
    settings,
    settingsLoading,
    isPremium,
    gamesSinceInterstitial,
    shouldShowInterstitial,
    markInterstitialShown,
    incrementGameCount,
    refreshSettings,
    setPremium,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}
