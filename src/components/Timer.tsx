import { Clock } from 'lucide-react';
import { formatTime } from '@/utils/format';

export function Timer({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const pct = Math.min(100, (secondsLeft / total) * 100);
  const danger = secondsLeft <= 10;
  const warn = secondsLeft <= 20 && !danger;

  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${danger ? 'bg-error-500/15 text-error-500 animate-pulse' : warn ? 'bg-warning-500/15 text-warning-500' : 'bg-primary-500/15 text-primary-500'}`}>
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Time left</span>
          <span className={`font-display text-xl font-extrabold tabular-nums ${danger ? 'text-error-500' : warn ? 'text-warning-500' : ''}`}>
            {formatTime(secondsLeft)}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${danger ? 'bg-error-500' : warn ? 'bg-warning-500' : 'bg-primary-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
