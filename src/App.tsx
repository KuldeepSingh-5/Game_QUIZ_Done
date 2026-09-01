import { useCallback, useState } from 'react';
import { HomePage } from '@/pages/HomePage';
import { GamePage, type GameOutcome } from '@/pages/GamePage';
import { ResultPage } from '@/pages/ResultPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { BottomNav, type Page } from '@/components/BottomNav';
import { AuthContext, useAuth } from '@/context/AuthContext';
import { AdProvider, useAdContext } from '@/context/AdContext';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { useUserStats } from '@/hooks/useUserStats';
import { InterstitialAd } from '@/components/ads/InterstitialAd';

type Route = Page | 'result' | 'login' | 'register' | 'admin';

function AppInner() {
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const { stats, refresh } = useUserStats();
  const adCtx = useAdContext();
  const [route, setRoute] = useState<Route>('home');
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [wasGuest, setWasGuest] = useState(false);
  const [interstitialOpen, setInterstitialOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState(false);

  const navigate = useCallback((p: Page) => {
    setRoute(p);
    if (p !== 'game') setOutcome(null);
  }, []);

  const handleFinish = useCallback(
    async (o: GameOutcome) => {
      setSaving(true);
      setSaveError(false);
      const wasLoggedIn = !!auth.user;
      try {
        setWasGuest(false);
        setOutcome(o);
        await refresh();
      } catch {
        setSaveError(true);
        setWasGuest(!wasLoggedIn);
        setOutcome(o);
      } finally {
        setSaving(false);
      }

      // Increment game counter for interstitial frequency
      adCtx.incrementGameCount();

      // Show interstitial at natural break if frequency threshold met
      if (adCtx.shouldShowInterstitial()) {
        setPendingResult(true);
        setInterstitialOpen(true);
      } else {
        setRoute('result');
      }
    },
    [refresh, auth.user, adCtx]
  );

  const handleInterstitialComplete = useCallback(() => {
    setInterstitialOpen(false);
    adCtx.markInterstitialShown();
    if (pendingResult) {
      setPendingResult(false);
      setRoute('result');
    }
  }, [adCtx, pendingResult]);

  const handleInterstitialSkip = useCallback(() => {
    setInterstitialOpen(false);
    adCtx.markInterstitialShown();
    if (pendingResult) {
      setPendingResult(false);
      setRoute('result');
    }
  }, [adCtx, pendingResult]);

  const exitToHome = useCallback(() => {
    setOutcome(null);
    setSaveError(false);
    setWasGuest(false);
    setRoute('home');
  }, []);

  const handleNavigate = useCallback(
    (p: Page) => {
      if (p === 'profile' && !auth.user) {
        setRoute('login');
        return;
      }
      navigate(p);
    },
    [auth.user, navigate]
  );

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      {route === 'home' && (
        <HomePage
          stats={stats}
          theme={theme}
          onToggleTheme={toggle}
          onNavigate={handleNavigate}
          isLoggedIn={!!auth.user}
          onLogin={() => setRoute('login')}
          onRegister={() => setRoute('register')}
          onProfile={() => setRoute('profile')}
        />
      )}
      {route === 'game' && (
        <GamePage onFinish={handleFinish} onExit={exitToHome} />
      )}
      {route === 'result' && outcome && (
        <ResultPage
          outcome={outcome}
          stats={stats}
          saving={saving}
          saveError={saveError}
          wasGuest={wasGuest && !auth.user}
          onPlayAgain={() => setRoute('game')}
          onHome={() => setRoute('home')}
          onLeaderboard={() => setRoute('leaderboard')}
          onCreateAccount={() => setRoute('register')}
          onExit={exitToHome}
          onRewardEarned={refresh}
        />
      )}
      {route === 'leaderboard' && (
        <LeaderboardPage onExit={exitToHome} />
      )}
      {route === 'login' && (
        <LoginPage onBack={exitToHome} onSwitchToRegister={() => setRoute('register')} />
      )}
      {route === 'register' && (
        <RegisterPage onBack={exitToHome} onSwitchToLogin={() => setRoute('login')} />
      )}
      {route === 'profile' && auth.user && (
        <ProfilePage theme={theme} onToggleTheme={toggle} onExit={exitToHome} onAdmin={() => setRoute('admin')} />
      )}
      {route === 'profile' && !auth.user && (
        <LoginPage onBack={exitToHome} onSwitchToRegister={() => setRoute('register')} />
      )}
      {route === 'admin' && (
        <AdminPage theme={theme} onToggleTheme={toggle} onExit={exitToHome} />
      )}

      <BottomNav
        current={route === 'result' || route === 'login' || route === 'register' || route === 'admin' ? 'home' : (route as Page)}
        onNavigate={handleNavigate}
        isLoggedIn={!!auth.user}
      />

      <InterstitialAd
        open={interstitialOpen}
        onComplete={handleInterstitialComplete}
        onSkip={handleInterstitialSkip}
      />
    </div>
  );
}

export default function App() {
  const auth = useAuthProvider();
  return (
    <AdProvider>
      <AuthContext.Provider value={auth}>
        <AppInner />
      </AuthContext.Provider>
    </AdProvider>
  );
}
