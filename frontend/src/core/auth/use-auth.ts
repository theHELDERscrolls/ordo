import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-types';

/**
 * The session and its actions.
 *
 * @throws When called outside an `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
