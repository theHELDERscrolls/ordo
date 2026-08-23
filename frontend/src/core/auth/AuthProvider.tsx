import { useEffect, useReducer, type ReactNode } from 'react';
import type { User, Business, LoginResponse } from '@ordo/shared';
import { apiFetch } from '@/core/api/api';
import { AuthContext } from './auth-context';
import { authReducer } from './auth-reducer';

const TOKEN_KEY = 'ordo_token';

/** Owns the session: restores it on load, exposes login/logout, and paints the
 * tenant's accent while authenticated. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });

  // An invalid or expired stored token is discarded rather than trusted.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      dispatch({ type: 'clear' });
      return;
    }
    apiFetch<{ user: User; business: Business }>('/auth/me', {}, token)
      .then(({ user, business }) =>
        dispatch({ type: 'session', token, user, business }),
      )
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        dispatch({ type: 'clear' });
      });
  }, []);

  // White-label: the tenant's accent while authenticated, monochrome otherwise.
  useEffect(() => {
    const root = document.documentElement;
    if (state.status === 'authenticated') {
      root.style.setProperty('--accent', state.business.branding.accentColor);
    } else {
      root.style.removeProperty('--accent');
    }
  }, [state]);

  async function login(email: string, password: string): Promise<void> {
    const { token, user, business } = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, token);
    dispatch({ type: 'session', token, user, business });
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'clear' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
