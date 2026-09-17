import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/my-jobs',   label: 'My Jobs',   icon: '📦' },
  { to: '/fleet',     label: 'Fleet',     icon: '🌐' },
  { to: '/events',    label: 'Events',    icon: '🚛' },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex bg-black/95 border-t border-soft backdrop-blur-xl z-50"
         style={{ height: 'calc(var(--tab-bar-h) + var(--sab))', paddingBottom: 'var(--sab)' }}>
      {TABS.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className="flex-1">
          {({ isActive }) => (
            <div className={`relative flex flex-col items-center justify-center gap-1 h-full text-[10px] font-semibold tracking-wider transition-colors ${isActive ? 'text-gold' : 'text-[--fg-3]'}`}>
              <span className={`text-xl leading-none ${isActive ? 'drop-shadow-[0_0_6px_rgba(245,197,24,0.6)]' : ''}`}>
                {icon}
              </span>
              <span>{label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-gold rounded shadow-gold" />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
