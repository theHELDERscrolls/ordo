import type { User, Business } from '@ordo/shared';

// The session is a small state machine: "loading" while we check for a stored
// token, then either authenticated or unauthenticated.
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; token: string; user: User; business: Business }
  | { status: 'unauthenticated' };

export type AuthAction =
  | { type: 'session'; token: string; user: User; business: Business }
  | { type: 'clear' };

export type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};
