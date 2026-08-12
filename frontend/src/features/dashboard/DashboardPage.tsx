import { useAuth } from '@/core/auth/use-auth';

// The dashboard panel. Its stat cards land in Phase 3; for now it hosts the
// welcome and reserves the space. The branded shell lives in AppLayout.
export function DashboardPage() {
  const auth = useAuth();
  if (auth.status !== 'authenticated') return null;
  const { user } = auth;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Panel</h1>
      <p className="mt-1 text-sm text-fg-muted transition-colors">
        Un resumen de tu inventario y actividad reciente.
      </p>
      <p className="mt-10 text-sm text-fg-muted transition-colors">
        Bienvenido, {user.name}. Aquí vivirán las tarjetas de resumen.
      </p>
    </div>
  );
}
