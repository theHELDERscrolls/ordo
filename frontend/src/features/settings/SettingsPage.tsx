import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';

import { useAuth } from '@/core/auth/use-auth';
import { Page, PageHeader } from '@/shared/ui/Page';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

/** Account-level options gathered in one calm place, with log out set apart at the bottom. */
export function SettingsPage() {
  const auth = useAuth();
  if (auth.status !== 'authenticated') return null;
  const { business, logout } = auth;

  return (
    <Page width="narrow">
      <PageHeader title="Ajustes" description="Preferencias de la aplicación y tu negocio." />

      <div className="mt-8 divide-y divide-border">
        <Row title="Tema" hint="Alterna entre claro y oscuro.">
          <ThemeToggle />
        </Row>

        <Row title="Idioma" hint="Próximamente habrá más idiomas.">
          <span className="text-sm text-fg-muted">Español</span>
        </Row>

        <Row title="Negocio" hint="Los datos y la marca de tu comercio.">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ background: business.branding.accentColor }}
              aria-hidden
            />
            <span className="text-sm">
              {business.name} <span className="text-fg-muted">by Ordo</span>
            </span>
          </div>
        </Row>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </Page>
  );
}

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-fg-muted transition-colors">{hint}</p>
      </div>
      {children}
    </div>
  );
}
