import { useAuth } from './use-auth';

// The current access token, or undefined when not authenticated. A small shared
// hook so data hooks don't each re-derive it from the auth state.
export function useToken(): string | undefined {
  const auth = useAuth();
  return auth.status === 'authenticated' ? auth.token : undefined;
}
