import { LayoutDashboard, Package, Settings } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/core/auth/use-auth';

// Primary sections sit at the top; the utility entry stays quiet at the bottom.
const primaryNav = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Inventario', icon: Package, end: false },
];
const settingsNav = { to: '/settings', label: 'Ajustes', icon: Settings, end: false };

/**
 * The authenticated shell. It is exactly viewport-height and never grows with its
 * content: only `<main>` scrolls, so the sidebar and the bottom bar stay put however
 * long the inventory gets.
 */
export function AppLayout() {
  const auth = useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Every page starts at the top, instead of inheriting the list's scroll position.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  if (auth.status !== 'authenticated') return null;
  const { business } = auth;

  const brand = (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-base font-semibold tracking-tight">{business.name}</span>
      <span className="text-xs text-fg-muted">by Ordo</span>
    </div>
  );

  const sidebarLink = ({ to, label, icon: Icon, end }: (typeof primaryNav)[number]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'border-accent bg-surface-2 font-medium text-fg'
            : 'border-transparent text-fg-muted hover:text-fg'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-bg text-fg transition-colors md:flex-row">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border">
        <div className="h-0.5 bg-accent" />
        <div className="px-5 py-4">{brand}</div>
        <nav className="flex-1 space-y-1 px-3">{primaryNav.map(sidebarLink)}</nav>
        <div className="border-t border-border px-3 py-3">{sidebarLink(settingsNav)}</div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-border md:hidden">
          <div className="h-0.5 bg-accent" />
          <div className="px-4 py-3">{brand}</div>
        </header>

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-border bg-surface md:hidden">
        {[...primaryNav, settingsNav].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                isActive ? 'text-fg' : 'text-fg-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`h-0.5 w-6 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`}
                />
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
