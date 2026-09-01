import { useState } from 'react';
import { ArrowLeft, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export function LoginPage({
  onBack,
  onSwitchToRegister,
}: {
  onBack: () => void;
  onSwitchToRegister: () => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      onBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-24 pt-6 md:pb-10">
      <button onClick={onBack} className="btn-ghost mb-4 h-10 w-10 !p-0">
        <ArrowLeft size={18} />
      </button>

      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>

      <div className="card animate-pop-in p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-center">Welcome back</h1>
        <p className="mt-1.5 text-center text-sm text-ink-500 dark:text-ink-400">
          Log in to save your progress and climb the leaderboard.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-500/10 px-4 py-3 text-sm font-medium text-error-600 dark:text-error-400 animate-fade-in">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-500 dark:text-ink-400">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-500 dark:text-ink-400">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={loading}
                className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500 dark:text-ink-400">
          No account yet?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold text-primary-500 hover:underline"
            disabled={loading}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
