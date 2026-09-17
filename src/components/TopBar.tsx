import { useLocation } from 'react-router-dom';
import { ProfileSheet } from './ProfileSheet';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/my-jobs':   'My Jobs',
  '/fleet':     'Fleet',
  '/events':    'Events',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'TNL Tracker';

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-hairline bg-black/90 backdrop-blur-xl shrink-0 z-50">
      <div className="flex items-center gap-2.5">
        <img src="/icons/icon-192.png" alt="TNL" className="w-7 h-7 rounded-md object-cover" />
        <span className="font-display text-lg tracking-wider text-white">
          TNL <span className="text-gold">{title}</span>
        </span>
      </div>
      <ProfileSheet />
    </header>
  );
}
