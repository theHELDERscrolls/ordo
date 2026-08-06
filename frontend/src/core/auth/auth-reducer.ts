import type { AuthState, AuthAction } from './auth-types';

export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'session':
      return {
        status: 'authenticated',
        token: action.token,
        user: action.user,
        business: action.business,
      };
    case 'clear':
      return { status: 'unauthenticated' };
  }
}
