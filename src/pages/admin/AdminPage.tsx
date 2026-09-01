import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, LayoutDashboard, HelpCircle, Loader2, Lock } from 'lucide-react';
import type { Theme } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { checkIsAdmin } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminQuestions } from '@/pages/admin/AdminQuestions';

type AdminTab = 'dashboard' | 'questions';

export function AdminPage({
  theme,
  onToggleTheme,
  onExit,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  onExit: () => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await checkIsAdmin();
      if (active) {
        setIsAdmin(ok);
        setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary-500" />
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400">
            Checking admin access…
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="card flex flex-col items-center gap-3 p-8 text-center animate-pop-in">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-error-500/15 text-error-500">
            <Lock size={26} />
          </div>
          <h2 className="font-display text-lg font-bold">Access denied</h2>
          <p className="max-w-xs text-sm text-ink-500 dark:text-ink-400">
            You need an admin account to view this page. If you believe this is an
            error, contact the site administrator.
          </p>
          <button onClick={onExit} className="btn-primary mt-1">
            <ArrowLeft size={16} /> Back to the app
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pb-10">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="btn-ghost h-10 w-10 !p-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-500/15 text-primary-500">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight">
                Admin Panel
              </h1>
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-xl bg-ink-100 p-1 dark:bg-ink-900">
        <button
          onClick={() => setTab('dashboard')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            tab === 'dashboard'
              ? 'bg-white text-primary-600 shadow dark:bg-ink-800'
              : 'text-ink-500'
          }`}
        >
          <LayoutDashboard size={15} className="mr-1.5 inline" /> Dashboard
        </button>
        <button
          onClick={() => setTab('questions')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            tab === 'questions'
              ? 'bg-white text-primary-600 shadow dark:bg-ink-800'
              : 'text-ink-500'
          }`}
        >
          <HelpCircle size={15} className="mr-1.5 inline" /> Questions
        </button>
      </div>

      {/* Content */}
      {tab === 'dashboard' && <AdminDashboard onManageQuestions={() => setTab('questions')} />}
      {tab === 'questions' && <AdminQuestions />}
    </div>
  );
}
