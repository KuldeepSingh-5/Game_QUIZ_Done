export function ProgressBar({
  value,
  max,
  label,
  color = 'primary',
  height = 'h-2.5',
}: {
  value: number;
  max: number;
  label?: string;
  color?: 'primary' | 'accent' | 'success';
  height?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = {
    primary: 'from-primary-500 to-primary-400',
    accent: 'from-accent-500 to-accent-400',
    success: 'from-success-500 to-success-400',
  }[color];

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-500 dark:text-ink-400">
          <span>{label}</span>
          <span>{value} / {max}</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800 ${height}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
