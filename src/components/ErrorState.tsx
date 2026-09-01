import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center animate-fade-in">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-error-500/15 text-error-500">
        <AlertTriangle size={26} />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="max-w-xs text-sm text-ink-500 dark:text-ink-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-1">
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  );
}
