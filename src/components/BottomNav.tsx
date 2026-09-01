import { Home, Gamepad2, Trophy, User } from 'lucide-react';

export type Page = 'home' | 'game' | 'leaderboard' | 'profile';

export function BottomNav({
  current,
  onNavigate,
  isLoggedIn,
}: {
  current: Page;
  onNavigate: (p: Page) => void;
  isLoggedIn: boolean;
}) {
  const items: { id: Page; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'game', label: 'Play', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'profile', label: isLoggedIn ? 'Profile' : 'Login', icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/90 backdrop-blur-lg dark:border-ink-800 dark:bg-ink-900/90 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors ${active ? 'text-primary-500' : 'text-ink-400 dark:text-ink-500'}`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl transition-all ${active ? 'bg-primary-500/15 scale-110' : ''}`}>
                <Icon size={20} />
              </span>
              <span className="text-[11px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
