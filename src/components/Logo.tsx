import { Zap } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-lg' },
    md: { box: 'h-10 w-10', icon: 20, text: 'text-2xl' },
    lg: { box: 'h-14 w-14', icon: 28, text: 'text-3xl' },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${sizes.box} grid place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow`}>
        <Zap size={sizes.icon} className="fill-white" />
      </div>
      <span className={`font-display font-extrabold tracking-tight ${sizes.text}`}>
        Daily<span className="text-primary-500">Challenge</span>
      </span>
    </div>
  );
}
