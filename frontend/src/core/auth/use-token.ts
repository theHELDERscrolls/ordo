import { useAuth } from './use-auth';

/**
 * The current access token, or `undefined` when not authenticated, so data hooks
 * do not each re-derive it from the auth state.
 */
export function useToken(): string | undefined {
  const auth = useAuth();
  return auth.status === 'authenticated' ? auth.token : undefined;
}
