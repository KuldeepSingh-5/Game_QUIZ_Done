import type { ReactNode } from 'react';

export function StatCard({
  icon,
  label,
  value,
  accent = 'primary',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accent?: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const accents = {
    primary: 'from-primary-500/15 to-primary-500/5 text-primary-600 dark:text-primary-300',
    accent: 'from-accent-500/15 to-accent-500/5 text-accent-600 dark:text-accent-300',
    success: 'from-success-500/15 to-success-500/5 text-success-600 dark:text-success-300',
    warning: 'from-warning-500/15 to-warning-500/5 text-warning-600 dark:text-warning-300',
  }[accent];

  return (
    <div className="card flex items-center gap-3 p-3.5 animate-fade-in">
      <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accents}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
        <p className="truncate text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
