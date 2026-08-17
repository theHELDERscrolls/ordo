import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './use-auth';

/**
 * Gate for protected routes: renders nothing while the session resolves, then
 * either the page or a redirect to the login screen.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.status === 'loading') return null;
  if (auth.status !== 'authenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
