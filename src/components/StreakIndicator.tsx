import { Flame } from 'lucide-react';

export function StreakIndicator({ streak }: { streak: number }) {
  const tier = streak >= 30 ? '30' : streak >= 7 ? '7' : streak >= 1 ? '1' : '0';
  const color = streak >= 30 ? 'text-accent-500' : streak >= 7 ? 'text-accent-500' : streak >= 1 ? 'text-warning-500' : 'text-ink-400';
  const bg = streak >= 30 ? 'from-accent-500/20 to-accent-500/5' : streak >= 1 ? 'from-warning-500/15 to-warning-500/5' : 'from-ink-500/10 to-ink-500/5';

  return (
    <div className={`flex items-center gap-2 rounded-xl bg-gradient-to-br ${bg} px-3 py-2`}>
      <Flame size={18} className={color} />
      <div className="leading-tight">
        <p className="text-sm font-bold">{streak} day{streak === 1 ? '' : 's'}</p>
        <p className="text-[10px] font-medium text-ink-500 dark:text-ink-400">
          {tier === '30' ? 'Inferno streak!' : tier === '7' ? 'On fire!' : tier === '1' ? 'Keep it going' : 'Start a streak'}
        </p>
      </div>
    </div>
  );
}
