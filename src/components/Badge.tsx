import { Award, Star, Target, Flame } from 'lucide-react';

export function Badge({
  streak,
  level,
}: {
  streak: number;
  level: number;
}) {
  const badges = [
    { id: 'first', label: 'First Step', icon: Star, unlocked: level >= 1, color: 'text-primary-500' },
    { id: 'streak7', label: '7-Day Fire', icon: Award, unlocked: streak >= 7, color: 'text-accent-500' },
    { id: 'streak30', label: 'Inferno', icon: Flame, unlocked: streak >= 30, color: 'text-accent-600' },
    { id: 'champion', label: 'Champion', icon: Target, unlocked: level >= 5, color: 'text-success-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.id}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${b.unlocked ? 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900' : 'border-dashed border-ink-200 opacity-50 dark:border-ink-800'}`}
          >
            <Icon size={20} className={b.unlocked ? b.color : 'text-ink-400'} />
            <span className="text-[10px] font-semibold leading-tight">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
