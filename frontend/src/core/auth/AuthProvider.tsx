import { useEffect, useReducer, type ReactNode } from 'react';
import type { User, Business, LoginResponse } from '@ordo/shared';
import { apiFetch } from '@/core/api/api';
import { AuthContext } from './auth-context';
import { authReducer } from './auth-reducer';

const TOKEN_KEY = 'ordo_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });

  // On load, restore the session from a stored token by asking the backend who
  // it belongs to. An invalid or expired token is discarded.
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

  // White-label: paint the UI with the tenant's accent while authenticated,
  // reset to the monochrome default otherwise.
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
