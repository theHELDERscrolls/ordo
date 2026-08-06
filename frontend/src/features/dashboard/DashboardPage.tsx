import { useAuth } from '@/core/auth/use-auth';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

export function DashboardPage() {
  const auth = useAuth();
  if (auth.status !== 'authenticated') return null;
  const { user, business } = auth;

  return (
    <div className="min-h-svh bg-bg text-fg transition-colors">
      {/* Branded shell: the tenant's name is the identity; "by Ordo" is the
          white-label signature. The accent bar carries the tenant color. */}
      <header className="border-b border-border transition-colors">
        <div className="h-0.5 bg-accent" />
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">
              {business.name}
            </span>
            <span className="text-xs text-fg-muted transition-colors">by Ordo</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={auth.logout}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="mt-2 text-sm text-fg-muted transition-colors">
          Your inventory will live here.
        </p>
      </main>
    </div>
  );
}
